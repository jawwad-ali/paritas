import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { RawEventStatus } from '../../generated/prisma/client.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { INGESTION_JOBS, QUEUES } from '../../infrastructure/queue/queue.constants.js';
import { RawEventDispatcher } from './raw-event-dispatcher.js';

const SWEEP_EVERY_MS = 60_000;
/** Only events this old are considered stuck; younger ones may still be in flight. */
const STUCK_AFTER_MS = 2 * 60_000;
const SWEEP_BATCH_SIZE = 500;

/**
 * Safety net for raw events that were stored but never processed (e.g. Redis
 * down for a moment, or an inline attempt that failed). With the queue runner it
 * runs as a BullMQ job scheduler, so exactly one worker executes each sweep even
 * with many API replicas; with the inline runner the sweep trigger calls it.
 */
@Injectable()
export class RawEventSweeper implements OnApplicationBootstrap {
  private readonly logger = new Logger(RawEventSweeper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: RawEventDispatcher,
    private readonly config: AppConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.runsJobsInline) {
      return;
    }
    const queue = this.moduleRef.get<Queue>(getQueueToken(QUEUES.INGESTION), { strict: false });
    await queue.upsertJobScheduler(
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
      await this.dispatcher.retry(id);
    }
    if (stuck.length > 0) {
      this.logger.warn({ count: stuck.length }, 'Retried stuck raw events.');
    }
    return stuck.length;
  }
}
