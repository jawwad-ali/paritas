import { TransactionStatus } from '../../../generated/prisma/client.js';

export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';

/** PaymentIntent events and the normalised status each one implies. */
export const PAYMENT_INTENT_EVENT_STATUS = {
  'payment_intent.succeeded': TransactionStatus.SUCCEEDED,
  'payment_intent.processing': TransactionStatus.PENDING,
  'payment_intent.payment_failed': TransactionStatus.FAILED,
  // No money moved; for reconciliation a cancelled payment is a failed one.
  'payment_intent.canceled': TransactionStatus.FAILED,
} as const;

export type PaymentIntentEventType = keyof typeof PAYMENT_INTENT_EVENT_STATUS;

export const CHARGE_REFUNDED_EVENT = 'charge.refunded';

export const IGNORE_REASONS = {
  LIVE_MODE: 'Live-mode event rejected: Paritas accepts Stripe test mode only.',
  UNSUPPORTED_TYPE: 'Event type is not reconciled.',
  CHARGE_WITHOUT_PAYMENT_INTENT: 'Charge is not linked to a PaymentIntent.',
} as const;
