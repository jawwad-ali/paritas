import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUES, RECONCILIATION_JOBS } from '../../infrastructure/queue/queue.constants.js';

export interface MatchTransactionJob {
  transactionId: string;
}

/**
 * Producer side of the reconciliation queue. Every created or changed
 * transaction is (re-)evaluated by the matching engine; the matcher is
 * idempotent, so a redundant job is harmless.
 */
@Injectable()
export class ReconciliationQueueService {
  constructor(@InjectQueue(QUEUES.RECONCILIATION) private readonly queue: Queue) {}

  async enqueueMatch(transactionId: string): Promise<void> {
    const job: MatchTransactionJob = { transactionId };
    await this.queue.add(RECONCILIATION_JOBS.MATCH_TRANSACTION, job);
  }
}
