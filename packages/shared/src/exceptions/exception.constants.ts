/** Mirrors the API's Prisma enums (checked at compile time there). */
export const EXCEPTION_TYPES = [
  'MISSING',
  'AMOUNT_MISMATCH',
  'DUPLICATE',
  'STATUS_CONFLICT',
  'DELAYED',
  'LOW_CONFIDENCE_MATCH',
  'OTHER',
] as const;
export type ExceptionType = (typeof EXCEPTION_TYPES)[number];

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  MISSING: 'Missing',
  AMOUNT_MISMATCH: 'Amount mismatch',
  DUPLICATE: 'Duplicate',
  STATUS_CONFLICT: 'Status conflict',
  DELAYED: 'Delayed',
  LOW_CONFIDENCE_MATCH: 'Needs review',
  OTHER: 'Other',
};

/** Ordered from least to most severe. */
export const EXCEPTION_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type ExceptionSeverity = (typeof EXCEPTION_SEVERITIES)[number];

export const EXCEPTION_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED'] as const;
export type ExceptionStatus = (typeof EXCEPTION_STATUSES)[number];

/** Statuses in which an exception still needs work. */
export const OPEN_EXCEPTION_STATUSES = [
  'OPEN',
  'INVESTIGATING',
] as const satisfies readonly ExceptionStatus[];
/** Statuses that close an exception (a decision has been made). */
export const CLOSED_EXCEPTION_STATUSES = [
  'RESOLVED',
  'IGNORED',
] as const satisfies readonly ExceptionStatus[];

export const EXCEPTION_ACTIVITY_TYPES = [
  'CREATED',
  'STATUS_CHANGED',
  'SEVERITY_CHANGED',
  'ASSIGNED',
  'NOTE_ADDED',
  'MANUALLY_MATCHED',
  'REOPENED',
] as const;
export type ExceptionActivityType = (typeof EXCEPTION_ACTIVITY_TYPES)[number];

/** SUBJECT: the record is the problem. CONTEXT: shown for comparison only. */
export const EXCEPTION_TRANSACTION_ROLES = ['SUBJECT', 'CONTEXT'] as const;
export type ExceptionTransactionRole = (typeof EXCEPTION_TRANSACTION_ROLES)[number];

export const MATCH_METHODS = ['EXACT', 'FUZZY', 'MANUAL'] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

export const MATCH_STATUSES = ['ACTIVE', 'REVERSED'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/**
 * `priority`: most severe first, then oldest first (the work queue order).
 * `newest` / `oldest`: by detection time.
 */
export const EXCEPTION_SORTS = ['priority', 'newest', 'oldest'] as const;
export type ExceptionSort = (typeof EXCEPTION_SORTS)[number];

/** `me` and `unassigned` are shortcuts; anything else must be a user id. */
export const ASSIGNEE_FILTER_ME = 'me';
export const ASSIGNEE_FILTER_UNASSIGNED = 'unassigned';

export const EXCEPTION_REASON_MIN_LENGTH = 3;
export const EXCEPTION_REASON_MAX_LENGTH = 500;
export const EXCEPTION_NOTE_MAX_LENGTH = 2000;

/** Human-friendly exception reference, e.g. EX-1042. */
export const formatExceptionNumber = (number: number): string => `EX-${number}`;
