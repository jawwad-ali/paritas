import type {
  ExceptionSeverity,
  ExceptionType,
  MatchingConfig,
  Prisma,
  Source,
  Transaction,
} from '../../generated/prisma/client.js';

export type MatchingRules = Pick<
  MatchingConfig,
  | 'amountToleranceMinor'
  | 'amountToleranceBps'
  | 'timeWindowMinutes'
  | 'autoMatchThreshold'
  | 'candidateThreshold'
  | 'missingAfterMinutes'
>;

/**
 * `event`: triggered by new data. Never concludes that something is missing,
 *   because the counterpart may simply not have arrived yet.
 * `sweep`: periodic re-evaluation; may conclude MISSING / DELAYED / EXCLUDED
 *   once the grace period has passed.
 */
export type EvaluationMode = 'event' | 'sweep';

export type TransactionWithSource = Transaction & { source: Source };

/** The two sides of one payment, oriented: gateway's record vs the internal ledger's. */
export interface Pair {
  gateway: TransactionWithSource;
  ledger: TransactionWithSource;
}

/** Why a fuzzy match scored what it did: every automated decision is explainable. */
export interface ScoreBreakdown {
  score: number;
  amount: number;
  customer: number;
  time: number;
  amountDifferenceMinor: number;
  timeDifferenceMinutes: number;
}

export type Counterpart =
  | { kind: 'none' }
  /** Already linked by an active match (re-validation). */
  | { kind: 'matched'; other: TransactionWithSource }
  | { kind: 'exact'; other: TransactionWithSource }
  | {
      kind: 'fuzzy';
      other: TransactionWithSource;
      breakdown: ScoreBreakdown;
      /** Runner-up scored almost as high: do not auto-confirm. */
      ambiguous: boolean;
    };

export type PairVerdict =
  | { kind: 'agree' }
  | { kind: 'pending' }
  | { kind: 'currency_mismatch' }
  | { kind: 'status_conflict' }
  | { kind: 'amount_mismatch'; differenceMinor: bigint };

/** Everything needed to open (or find) one exception. */
export interface ExceptionSpec {
  type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  /** Stable identity of the underlying problem; see ReconciliationException.dedupeKey. */
  dedupeKey: string;
  details: Prisma.InputJsonObject;
  /** Transactions that are the problem (held in EXCEPTION status). */
  subjectIds: string[];
  /** Transactions shown for comparison only. */
  contextIds: string[];
}
