import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type { NormalizedTransaction } from './ingestion.types.js';

export interface WriteResult {
  transactionId: string;
  /** False when the event was older than what is already stored (out-of-order delivery). */
  changed: boolean;
}

type Writer = Pick<Prisma.TransactionClient, 'transaction'>;

const isJsonObject = (value: Prisma.JsonValue): value is Prisma.JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Upserts a normalised transaction with last-writer-wins on the *source* event
 * time, so webhooks that arrive out of order can never roll state backwards.
 */
@Injectable()
export class TransactionWriter {
  async apply(
    writer: Writer,
    sourceId: string,
    rawEventId: string,
    normalized: NormalizedTransaction,
  ): Promise<WriteResult> {
    const existing = await writer.transaction.findUnique({
      where: { sourceId_externalId: { sourceId, externalId: normalized.externalId } },
      select: { id: true, metadata: true },
    });

    if (!existing) {
      // A concurrent insert of the same transaction raises a unique violation;
      // the job is retried and then takes the update path below.
      const created = await writer.transaction.create({
        data: {
          sourceId,
          externalId: normalized.externalId,
          rawEventId,
          lastEventAt: normalized.eventAt,
          ...this.fullFields(normalized),
          metadata: normalized.metadata,
        },
        select: { id: true },
      });
      return { transactionId: created.id, changed: true };
    }

    const mergedMetadata: Prisma.InputJsonObject = {
      ...(isJsonObject(existing.metadata) ? existing.metadata : {}),
      ...normalized.metadata,
    };
    const fields =
      normalized.updateScope === 'full'
        ? this.fullFields(normalized)
        : { status: normalized.status };

    // Conditional update: applies only if this event is not older than the stored state.
    const updated = await writer.transaction.updateMany({
      where: { id: existing.id, lastEventAt: { lte: normalized.eventAt } },
      data: { ...fields, metadata: mergedMetadata, rawEventId, lastEventAt: normalized.eventAt },
    });
    return { transactionId: existing.id, changed: updated.count > 0 };
  }

  private fullFields(normalized: NormalizedTransaction) {
    return {
      reference: normalized.reference,
      amountMinor: normalized.amountMinor,
      currency: normalized.currency,
      status: normalized.status,
      occurredAt: normalized.occurredAt,
      customerRef: normalized.customerRef,
      description: normalized.description,
    };
  }
}
