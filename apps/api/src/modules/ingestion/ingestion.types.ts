import type { SourceCode } from '@paritas/shared';
import type { Prisma, TransactionStatus } from '../../generated/prisma/client.js';

/** An event as received from a source, after its signature was verified. */
export interface InboundEvent {
  /** The source's own unique id for the event: the idempotency key. */
  externalEventId: string;
  eventType: string;
  /** The payload exactly as received. */
  payload: Prisma.InputJsonObject;
}

export interface ReceiveResult {
  rawEventId: string;
  /** True when this event was already stored (a redelivery); nothing was done. */
  duplicate: boolean;
}

/**
 * `full`: the event describes the whole payment (create or replace).
 * `status`: the event only changes the lifecycle (e.g. a refund) and must not
 * overwrite amount, time or customer captured by the original event.
 */
export type UpdateScope = 'full' | 'status';

/** A transaction in the common format, produced by a source-specific normaliser. */
export interface NormalizedTransaction {
  externalId: string;
  reference: string | null;
  amountMinor: bigint;
  currency: string;
  status: TransactionStatus;
  occurredAt: Date;
  customerRef: string | null;
  description: string | null;
  metadata: Prisma.InputJsonObject;
  /** Source timestamp of the event; orders updates to the same transaction. */
  eventAt: Date;
  updateScope: UpdateScope;
}

export type NormalizationResult =
  { kind: 'transaction'; transaction: NormalizedTransaction } | { kind: 'ignored'; reason: string };

/** Turns one source's raw payload into the common format. Must be pure and deterministic. */
export interface SourceNormalizer {
  readonly sourceCode: SourceCode;
  /** @throws InvalidEventPayloadError when the payload cannot be understood. */
  normalize(payload: unknown): NormalizationResult;
}

export interface ProcessRawEventJob {
  rawEventId: string;
}
