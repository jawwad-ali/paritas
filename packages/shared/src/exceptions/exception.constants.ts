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

export const MATCH_METHODS = ['EXACT', 'FUZZY', 'MANUAL'] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

/** Human-friendly exception reference, e.g. EX-1042. */
export const formatExceptionNumber = (number: number): string => `EX-${number}`;
