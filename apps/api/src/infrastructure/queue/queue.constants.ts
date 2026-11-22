import type { JobsOptions } from 'bullmq';

/** All Redis keys of this app's queues share this prefix. */
export const QUEUE_PREFIX = 'paritas';

export const QUEUES = {
  /** Raw events → normalised transactions. */
  INGESTION: 'ingestion',
  /** Normalised transactions → matches and exceptions (consumed from Phase 3). */
  RECONCILIATION: 'reconciliation',
} as const;

export const INGESTION_JOBS = {
  PROCESS_RAW_EVENT: 'process-raw-event',
  /** Periodic safety net: re-enqueues raw events that never got a job. */
  SWEEP_STUCK_RAW_EVENTS: 'sweep-stuck-raw-events',
} as const;

export const RECONCILIATION_JOBS = {
  MATCH_TRANSACTION: 'match-transaction',
  /** Periodic re-evaluation of unmatched transactions (time-based checks + safety net). */
  SWEEP_UNRECONCILED: 'sweep-unreconciled',
} as const;

const RETAIN_COMPLETED_JOBS = 1_000;
const RETAIN_FAILED_JOBS = 5_000;

/**
 * Retries with exponential backoff (1s, 2s, 4s, 8s, 16s) absorb transient
 * failures (DB failover, deploys) without hammering the database.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: RETAIN_COMPLETED_JOBS,
  removeOnFail: RETAIN_FAILED_JOBS,
};
