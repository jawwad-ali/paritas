import { ExceptionType } from '../../generated/prisma/client.js';

/**
 * Fuzzy-match signal weights (sum = 1). Amount is the strongest evidence, the
 * customer identity next, timing last (clocks and processing delays vary).
 */
export const SCORE_WEIGHTS = { amount: 0.45, customer: 0.3, time: 0.25 } as const;

/** Customer signal when either side has no customer on record: neither for nor against. */
export const UNKNOWN_CUSTOMER_SCORE = 0.5;
/** Amount signal at the very edge of the tolerance (an exact amount scores 1). */
export const AMOUNT_SCORE_AT_TOLERANCE = 0.5;
/** If the runner-up scores within this margin of the best candidate, the choice is ambiguous. */
export const AMBIGUITY_MARGIN = 0.05;

/**
 * Time a counterpart may still be "in flight" after a transaction was ingested.
 * The sweep waits this long, and a fuzzy candidate that carries a reference
 * waits this long for its exact counterpart before fuzzy matching may claim it.
 */
export const SETTLE_WINDOW_MS = 2 * 60_000;

export const SWEEP_EVERY_MS = 60_000;
export const SWEEP_BATCH_SIZE = 500;

/** Payments at or above $1,000 are escalated one severity level. */
export const HIGH_VALUE_MINOR = 100_000n;
/** Amount differences at or above $100 or 10% are HIGH severity. */
export const LARGE_AMOUNT_DIFFERENCE_MINOR = 10_000n;
export const LARGE_AMOUNT_DIFFERENCE_RATIO = 0.1;

/** Exception types that disappear on their own when the records come to agree. */
export const AUTO_RESOLVABLE_TYPES: readonly ExceptionType[] = [
  ExceptionType.MISSING,
  ExceptionType.DELAYED,
  ExceptionType.STATUS_CONFLICT,
  ExceptionType.AMOUNT_MISMATCH,
  ExceptionType.LOW_CONFIDENCE_MATCH,
  ExceptionType.OTHER,
];

/**
 * An open exception of these types on a transaction takes it out of the
 * candidate pool for *other* transactions: it is a confirmed record of the same
 * payment, already paired in a dispute.
 * Not blocking: MISSING, DELAYED, DUPLICATE (a late counterpart must be able to
 * match and clear them) and LOW_CONFIDENCE_MATCH (a weak guess must never stop a
 * stronger match; when one wins, the weak guess is auto-resolved and its other
 * side is freed for re-evaluation).
 */
export const CANDIDACY_BLOCKING_TYPES: readonly ExceptionType[] = [
  ExceptionType.STATUS_CONFLICT,
  ExceptionType.AMOUNT_MISMATCH,
  ExceptionType.OTHER,
];

export const AUTO_RESOLUTION_REASON =
  'Auto-resolved by the matching engine: the records now agree.';

/** Matching is serialised per currency with a Postgres advisory lock (see MatchingEngine). */
export const LOCK_KEY_PREFIX = 'paritas:reconcile:';
export const MATCHING_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const;

export const RECONCILIATION_CONCURRENCY = 5;
