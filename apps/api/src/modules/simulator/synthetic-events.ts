import { faker } from '@faker-js/faker';
import type { InboundEvent } from '../ingestion/ingestion.types.js';
import { GATEWAY_CONFIRMATION_DELAY_SECONDS } from './simulator.constants.js';
import type { GatewayOutcome, LedgerEntry, SimulatedPayment } from './simulator.types.js';

/** Stripe-shaped ids, marked `sim` so they can never be confused with real Stripe objects. */
export const syntheticStripeId = (prefix: 'pi' | 'evt' | 'ch'): string =>
  `${prefix}_sim_${faker.string.alphanumeric(24)}`;

const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / 1000);

const OUTCOME_EVENT = {
  succeeded: { type: 'payment_intent.succeeded', status: 'succeeded' },
  failed: { type: 'payment_intent.payment_failed', status: 'requires_payment_method' },
  processing: { type: 'payment_intent.processing', status: 'processing' },
} as const satisfies Record<GatewayOutcome, { type: string; status: string }>;

/** A test-mode Stripe event with the same shape Stripe sends for a PaymentIntent. */
export const buildStripeEvent = (
  payment: SimulatedPayment,
  paymentIntentId: string,
  outcome: GatewayOutcome,
): InboundEvent => {
  const { type, status } = OUTCOME_EVENT[outcome];
  const externalEventId = syntheticStripeId('evt');
  const created = toUnixSeconds(payment.gatewayAt);

  return {
    externalEventId,
    eventType: type,
    payload: {
      id: externalEventId,
      object: 'event',
      type,
      created: created + GATEWAY_CONFIRMATION_DELAY_SECONDS,
      livemode: false,
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: payment.amountMinor,
          amount_received: outcome === 'succeeded' ? payment.amountMinor : 0,
          currency: payment.currency.toLowerCase(),
          status,
          created,
          receipt_email: payment.customerEmail,
          customer: null,
          description: payment.description,
          metadata: {
            order_id: payment.orderId,
            customer_email: payment.customerEmail,
            paritas_simulated: 'true',
          },
          latest_charge: outcome === 'processing' ? null : syntheticStripeId('ch'),
        },
      },
    },
  };
};

/** A ledger webhook event, in the internal ledger's documented contract. */
export const buildLedgerEvent = (payment: SimulatedPayment, entry: LedgerEntry): InboundEvent => {
  const externalEventId = `led_evt_${faker.string.alphanumeric(20)}`;
  return {
    externalEventId,
    eventType: 'ledger.entry.recorded',
    payload: {
      id: externalEventId,
      type: 'ledger.entry.recorded',
      createdAt: new Date(entry.occurredAt.getTime() + 1_000).toISOString(),
      data: {
        entryId: entry.entryId,
        paymentReference: entry.reference,
        amountMinor: entry.amountMinor,
        currency: payment.currency,
        status: entry.status,
        occurredAt: entry.occurredAt.toISOString(),
        customerEmail: payment.customerEmail,
        description: payment.description,
        orderId: payment.orderId,
      },
    },
  };
};
