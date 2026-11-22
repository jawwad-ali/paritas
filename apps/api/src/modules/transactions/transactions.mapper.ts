import type {
  RawEventDetailDto,
  RawEventDto,
  TransactionDetailDto,
  TransactionDto,
} from '@paritas/shared';
import type { RawEvent, Source, Transaction } from '../../generated/prisma/client.js';
import { toSourceSummaryDto } from '../sources/sources.mapper.js';

/** BIGINT cents → JSON number. Safe below 2^53 cents (~$90 trillion); anything larger is a bug. */
export const toSafeNumber = (value: bigint): number => {
  const asNumber = Number(value);
  if (!Number.isSafeInteger(asNumber)) {
    throw new RangeError(`Amount ${value} exceeds the safe integer range.`);
  }
  return asNumber;
};

type TransactionWithSource = Transaction & { source: Source };

export const toTransactionDto = (transaction: TransactionWithSource): TransactionDto => ({
  id: transaction.id,
  source: toSourceSummaryDto(transaction.source),
  externalId: transaction.externalId,
  reference: transaction.reference,
  amountMinor: toSafeNumber(transaction.amountMinor),
  currency: transaction.currency,
  status: transaction.status,
  reconciliationStatus: transaction.reconciliationStatus,
  matchId: transaction.matchId,
  customerRef: transaction.customerRef,
  description: transaction.description,
  occurredAt: transaction.occurredAt.toISOString(),
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
});

type RawEventWithSource = RawEvent & { source: Source };

export const toRawEventDto = (event: RawEventWithSource): RawEventDto => ({
  id: event.id,
  source: toSourceSummaryDto(event.source),
  externalEventId: event.externalEventId,
  eventType: event.eventType,
  status: event.status,
  error: event.error,
  receivedAt: event.receivedAt.toISOString(),
  processedAt: event.processedAt?.toISOString() ?? null,
});

export const toRawEventDetailDto = (event: RawEventWithSource): RawEventDetailDto => ({
  ...toRawEventDto(event),
  payload: event.payload,
});

export const toTransactionDetailDto = (
  transaction: TransactionWithSource & { rawEvent: RawEvent | null },
): TransactionDetailDto => ({
  ...toTransactionDto(transaction),
  metadata: transaction.metadata,
  lastEventAt: transaction.lastEventAt.toISOString(),
  latestRawEvent: transaction.rawEvent
    ? toRawEventDetailDto({ ...transaction.rawEvent, source: transaction.source })
    : null,
});
