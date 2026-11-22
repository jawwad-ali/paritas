import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUES, RECONCILIATION_JOBS } from '../../infrastructure/queue/queue.constants.js';
import { MatchingEngine } from './engine/matching-engine.service.js';
import type { MatchTransactionJob } from './reconciliation-queue.service.js';
import { RECONCILIATION_CONCURRENCY } from './reconciliation.constants.js';
import { ReconciliationSweeper } from './reconciliation-sweeper.service.js';

const isMatchTransactionJob = (data: unknown): data is MatchTransactionJob =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as Record<string, unknown>)['transactionId'] === 'string';

/** BullMQ worker for the reconciliation queue. Thin: dispatches to the engine. */
@Processor(QUEUES.RECONCILIATION, { concurrency: RECONCILIATION_CONCURRENCY })
export class ReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(
    private readonly engine: MatchingEngine,
    private readonly sweeper: ReconciliationSweeper,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case RECONCILIATION_JOBS.MATCH_TRANSACTION:
        if (!isMatchTransactionJob(job.data)) {
          this.logger.error({ jobId: job.id }, 'Malformed match-transaction job; dropping.');
          return;
        }
        await this.engine.evaluate(job.data.transactionId, 'event');
        return;
      case RECONCILIATION_JOBS.SWEEP_UNRECONCILED:
        await this.sweeper.sweep();
        return;
      default:
        this.logger.error(
          { jobId: job.id, name: job.name },
          'Unknown reconciliation job; dropping.',
        );
    }
  }
}
