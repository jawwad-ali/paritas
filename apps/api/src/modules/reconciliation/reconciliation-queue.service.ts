export interface MatchTransactionJob {
  transactionId: string;
}

/**
 * Producer side of the matching engine. Every created or changed transaction is
 * (re-)evaluated; the matcher is idempotent, so a redundant request is harmless.
 * Callers invoke it after their own database transaction has committed.
 * Implementations (queue or inline) live in reconciliation-queue.provider.ts.
 */
export abstract class ReconciliationQueueService {
  abstract enqueueMatch(transactionId: string): Promise<void>;
}
