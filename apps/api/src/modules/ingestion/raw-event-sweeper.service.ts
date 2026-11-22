import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { RawEventStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { INGESTION_JOBS, QUEUES } from '../../infrastructure/queue/queue.constants.js';
import { IngestionService } from './ingestion.service.js';

const SWEEP_EVERY_MS = 60_000;
/** Only events this old are considered stuck; younger ones may still be in flight. */
const STUCK_AFTER_MS = 2 * 60_000;
const SWEEP_BATCH_SIZE = 500;

/**
 * Safety net for the gap between "raw event stored" and "job enqueued" (e.g.
 * Redis down for a moment). Runs as a BullMQ job scheduler, so exactly one
 * worker executes each sweep even with many API replicas.
 */
@Injectable()
export class RawEventSweeper implements OnApplicationBootstrap {
  private readonly logger = new Logger(RawEventSweeper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
    @InjectQueue(QUEUES.INGESTION) private readonly queue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      INGESTION_JOBS.SWEEP_STUCK_RAW_EVENTS,
      { every: SWEEP_EVERY_MS },
      { name: INGESTION_JOBS.SWEEP_STUCK_RAW_EVENTS },
    );
  }

  async sweep(): Promise<number> {
    const stuck = await this.prisma.rawEvent.findMany({
      where: {
        status: RawEventStatus.RECEIVED,
        receivedAt: { lt: new Date(Date.now() - STUCK_AFTER_MS) },
      },
      select: { id: true },
      orderBy: { receivedAt: 'asc' },
      take: SWEEP_BATCH_SIZE,
    });
    for (const { id } of stuck) {
      await this.ingestion.enqueue(id);
    }
    if (stuck.length > 0) {
      this.logger.warn({ count: stuck.length }, 'Re-enqueued stuck raw events.');
    }
    return stuck.length;
  }
}
