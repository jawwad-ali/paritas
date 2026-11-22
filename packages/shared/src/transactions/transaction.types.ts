import type {
  RawEventStatus,
  ReconciliationStatus,
  SourceCode,
  SourceKind,
  TransactionStatus,
} from './transaction.constants.js';

export interface SourceSummaryDto {
  id: string;
  code: SourceCode;
  name: string;
  /** Which side of a reconciliation this source is on. */
  kind: SourceKind;
}

export interface TransactionDto {
  id: string;
  source: SourceSummaryDto;
  externalId: string;
  reference: string | null;
  /** Integer minor units (cents). Format with the currency's exponent for display. */
  amountMinor: number;
  currency: string;
  status: TransactionStatus;
  reconciliationStatus: ReconciliationStatus;
  matchId: string | null;
  customerRef: string | null;
  description: string | null;
  /** ISO-8601 timestamps. */
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawEventDto {
  id: string;
  source: SourceSummaryDto;
  externalEventId: string;
  eventType: string;
  status: RawEventStatus;
  error: string | null;
  receivedAt: string;
  processedAt: string | null;
}

export interface RawEventDetailDto extends RawEventDto {
  /** The payload exactly as the source sent it. */
  payload: unknown;
}

export interface TransactionDetailDto extends TransactionDto {
  metadata: unknown;
  lastEventAt: string;
  /** The raw event that last created or updated this transaction. */
  latestRawEvent: RawEventDetailDto | null;
}

export interface SourceDto extends SourceSummaryDto {
  isActive: boolean;
  transactionCount: number;
  /** When the newest raw event from this source arrived. */
  lastEventReceivedAt: string | null;
  createdAt: string;
}
