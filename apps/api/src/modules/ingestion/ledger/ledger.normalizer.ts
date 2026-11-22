import { Injectable } from '@nestjs/common';
import { SOURCE_CODES } from '@paritas/shared';
import type { NormalizationResult, SourceNormalizer } from '../ingestion.types.js';
import { normalizeCustomerRef, parseOrInvalid } from '../ingestion.utils.js';
import { ledgerEventSchema } from './ledger-event.schema.js';

/** Internal ledger → common format. The ledger already speaks our vocabulary. */
@Injectable()
export class LedgerNormalizer implements SourceNormalizer {
  readonly sourceCode = SOURCE_CODES.INTERNAL_LEDGER;

  normalize(payload: unknown): NormalizationResult {
    const event = parseOrInvalid(ledgerEventSchema, payload, 'ledger event');
    const { data } = event;

    return {
      kind: 'transaction',
      transaction: {
        externalId: data.entryId,
        reference: data.paymentReference,
        amountMinor: BigInt(data.amountMinor),
        currency: data.currency.toUpperCase(),
        status: data.status,
        occurredAt: new Date(data.occurredAt),
        customerRef: normalizeCustomerRef(data.customerEmail),
        description: data.description,
        metadata: {
          ledgerEventId: event.id,
          ledgerEventType: event.type,
          ...(data.orderId && { orderId: data.orderId }),
        },
        eventAt: new Date(event.createdAt),
        updateScope: 'full',
      },
    };
  }
}
