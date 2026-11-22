import { getQueueToken } from '@nestjs/bullmq';
import type { Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { AppConfigService } from '../../config/app-config.service.js';
import { QUEUES, RECONCILIATION_JOBS } from '../../infrastructure/queue/queue.constants.js';
import { MatchingEngine } from './engine/matching-engine.service.js';
import {
  type MatchTransactionJob,
  ReconciliationQueueService,
} from './reconciliation-queue.service.js';

/** Queue runner: a BullMQ job, evaluated by the reconciliation worker with retries. */
class QueueReconciliationService extends ReconciliationQueueService {
  constructor(private readonly queue: Queue) {
    super();
  }

  async enqueueMatch(transactionId: string): Promise<void> {
    const job: MatchTransactionJob = { transactionId };
    await this.queue.add(RECONCILIATION_JOBS.MATCH_TRANSACTION, job);
  }
}

/**
 * Inline runner: evaluated straight away, in the caller's request. A failure
 * rejects, and every caller already treats that as "the sweep will retry".
 */
class InlineReconciliationService extends ReconciliationQueueService {
  /** Resolved on first use: the engine itself depends on this service. */
  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  async enqueueMatch(transactionId: string): Promise<void> {
    await this.moduleRef.get(MatchingEngine).evaluate(transactionId, 'event');
  }
}

/** Kept apart from the abstract class so the engine can depend on it without an import cycle. */
export const reconciliationQueueProvider: Provider = {
  provide: ReconciliationQueueService,
  inject: [AppConfigService, ModuleRef],
  useFactory: (config: AppConfigService, moduleRef: ModuleRef): ReconciliationQueueService =>
    config.runsJobsInline
      ? new InlineReconciliationService(moduleRef)
      : new QueueReconciliationService(
          moduleRef.get<Queue>(getQueueToken(QUEUES.RECONCILIATION), { strict: false }),
        ),
};
