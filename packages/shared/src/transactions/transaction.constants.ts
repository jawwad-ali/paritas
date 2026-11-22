/** Mirrors the API's Prisma enums (checked at compile time there). */
export const TRANSACTION_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const RECONCILIATION_STATUSES = ['UNMATCHED', 'MATCHED', 'EXCEPTION', 'EXCLUDED'] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export const SOURCE_KINDS = ['PAYMENT_GATEWAY', 'INTERNAL_LEDGER'] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** Stable machine identifiers of the supported sources. */
export const SOURCE_CODES = {
  STRIPE: 'stripe',
  INTERNAL_LEDGER: 'internal_ledger',
} as const;
export type SourceCode = (typeof SOURCE_CODES)[keyof typeof SOURCE_CODES];

export const RAW_EVENT_STATUSES = ['RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED'] as const;
export type RawEventStatus = (typeof RAW_EVENT_STATUSES)[number];
