import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { ReconciliationStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { QUEUES, RECONCILIATION_JOBS } from '../../infrastructure/queue/queue.constants.js';
import { MatchingEngine } from './engine/matching-engine.service.js';
import { SETTLE_WINDOW_MS, SWEEP_BATCH_SIZE, SWEEP_EVERY_MS } from './reconciliation.constants.js';

/**
 * Periodically re-evaluates unmatched transactions. This is where time-based
 * conclusions happen (MISSING, DELAYED, EXCLUDED), and it doubles as the safety
 * net for any transaction whose matching job was lost.
 */
@Injectable()
export class ReconciliationSweeper implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReconciliationSweeper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: MatchingEngine,
    @InjectQueue(QUEUES.RECONCILIATION) private readonly queue: Queue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // A job scheduler, not a timer: exactly one worker runs each sweep cluster-wide.
    await this.queue.upsertJobScheduler(
      RECONCILIATION_JOBS.SWEEP_UNRECONCILED,
      { every: SWEEP_EVERY_MS },
      { name: RECONCILIATION_JOBS.SWEEP_UNRECONCILED },
    );
  }

  async sweep(): Promise<number> {
    const due = await this.prisma.transaction.findMany({
      where: {
        reconciliationStatus: ReconciliationStatus.UNMATCHED,
        createdAt: { lt: new Date(Date.now() - SETTLE_WINDOW_MS) },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: SWEEP_BATCH_SIZE,
    });

    let failures = 0;
    for (const { id } of due) {
      try {
        await this.engine.evaluate(id, 'sweep');
      } catch (error) {
        failures += 1;
        this.logger.error({ err: error, transactionId: id }, 'Sweep evaluation failed.');
      }
    }
    if (due.length > 0) {
      this.logger.log({ evaluated: due.length, failures }, 'Reconciliation sweep finished.');
    }
    return due.length;
  }
}
