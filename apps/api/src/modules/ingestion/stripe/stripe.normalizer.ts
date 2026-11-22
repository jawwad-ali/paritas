import { Injectable } from '@nestjs/common';
import { SOURCE_CODES } from '@paritas/shared';
import { TransactionStatus } from '../../../generated/prisma/client.js';
import type { NormalizationResult, SourceNormalizer } from '../ingestion.types.js';
import { normalizeCustomerRef, parseOrInvalid } from '../ingestion.utils.js';
import {
  CHARGE_REFUNDED_EVENT,
  IGNORE_REASONS,
  PAYMENT_INTENT_EVENT_STATUS,
  type PaymentIntentEventType,
} from './stripe.constants.js';
import {
  chargeSchema,
  idOf,
  paymentIntentSchema,
  type StripeEventEnvelope,
  stripeEventSchema,
} from './stripe.schemas.js';

const fromUnixSeconds = (seconds: number): Date => new Date(seconds * 1000);

const isPaymentIntentEvent = (type: string): type is PaymentIntentEventType =>
  Object.hasOwn(PAYMENT_INTENT_EVENT_STATUS, type);

/**
 * Stripe → common format. The PaymentIntent id is both the transaction's
 * external id and its cross-system reference: it is what the merchant's own
 * systems store when they record a card payment.
 */
@Injectable()
export class StripeNormalizer implements SourceNormalizer {
  readonly sourceCode = SOURCE_CODES.STRIPE;

  normalize(payload: unknown): NormalizationResult {
    const event = parseOrInvalid(stripeEventSchema, payload, 'Stripe event');

    if (event.livemode) {
      return { kind: 'ignored', reason: IGNORE_REASONS.LIVE_MODE };
    }
    if (isPaymentIntentEvent(event.type)) {
      return this.fromPaymentIntent(event, PAYMENT_INTENT_EVENT_STATUS[event.type]);
    }
    if (event.type === CHARGE_REFUNDED_EVENT) {
      return this.fromRefundedCharge(event);
    }
    return { kind: 'ignored', reason: IGNORE_REASONS.UNSUPPORTED_TYPE };
  }

  private fromPaymentIntent(
    event: StripeEventEnvelope,
    status: TransactionStatus,
  ): NormalizationResult {
    const intent = parseOrInvalid(paymentIntentSchema, event.data.object, 'PaymentIntent');
    // amount_received is what was actually captured; it is 0 until the payment succeeds.
    const amountMinor =
      status === TransactionStatus.SUCCEEDED && intent.amount_received > 0
        ? intent.amount_received
        : intent.amount;

    return {
      kind: 'transaction',
      transaction: {
        externalId: intent.id,
        reference: intent.id,
        amountMinor: BigInt(amountMinor),
        currency: intent.currency.toUpperCase(),
        status,
        occurredAt: fromUnixSeconds(intent.created),
        customerRef: normalizeCustomerRef(
          intent.metadata['customer_email'] ?? intent.receipt_email ?? idOf(intent.customer),
        ),
        description: intent.description ?? null,
        metadata: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          stripeStatus: intent.status,
          ...(intent.metadata['order_id'] && { orderId: intent.metadata['order_id'] }),
          ...(idOf(intent.latest_charge) && { latestChargeId: idOf(intent.latest_charge) }),
        },
        eventAt: fromUnixSeconds(event.created),
        updateScope: 'full',
      },
    };
  }

  private fromRefundedCharge(event: StripeEventEnvelope): NormalizationResult {
    const charge = parseOrInvalid(chargeSchema, event.data.object, 'Charge');
    const paymentIntentId = idOf(charge.payment_intent);
    if (!paymentIntentId) {
      return { kind: 'ignored', reason: IGNORE_REASONS.CHARGE_WITHOUT_PAYMENT_INTENT };
    }
    const fullyRefunded = charge.refunded || charge.amount_refunded >= charge.amount;

    return {
      kind: 'transaction',
      transaction: {
        externalId: paymentIntentId,
        reference: paymentIntentId,
        amountMinor: BigInt(charge.amount),
        currency: charge.currency.toUpperCase(),
        // A partial refund leaves the payment succeeded; the refunded amount is recorded.
        status: fullyRefunded ? TransactionStatus.REFUNDED : TransactionStatus.SUCCEEDED,
        occurredAt: fromUnixSeconds(charge.created),
        customerRef: normalizeCustomerRef(
          charge.metadata['customer_email'] ??
            charge.receipt_email ??
            charge.billing_details?.email,
        ),
        description: charge.description ?? null,
        metadata: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          latestChargeId: charge.id,
          amountRefundedMinor: charge.amount_refunded,
        },
        eventAt: fromUnixSeconds(event.created),
        updateScope: 'status',
      },
    };
  }
}
