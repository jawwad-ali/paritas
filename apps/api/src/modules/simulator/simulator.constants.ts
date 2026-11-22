import type { SimulatedScenario } from '@paritas/shared';

/** Most clean payments match exactly; some exercise the tolerance and fuzzy paths. */
export const CLEAN_SCENARIO_WEIGHTS: ReadonlyArray<{ value: SimulatedScenario; weight: number }> = [
  { value: 'EXACT_MATCH', weight: 70 },
  { value: 'FEE_WITHIN_TOLERANCE', weight: 15 },
  { value: 'FUZZY_MATCH', weight: 15 },
];

export const ANOMALY_SCENARIOS: readonly SimulatedScenario[] = [
  'MISSING_IN_LEDGER',
  'MISSING_AT_GATEWAY',
  'AMOUNT_MISMATCH',
  'DUPLICATE_IN_LEDGER',
  'STATUS_CONFLICT',
  'DELAYED_SETTLEMENT',
];

/** Stripe test cards cannot leave a card payment "processing", so this one is synthetic-only. */
export const STRIPE_MODE_UNSUPPORTED: readonly SimulatedScenario[] = ['DELAYED_SETTLEMENT'];

export const SIMULATED_CURRENCY = 'USD';

/** Typical US e-commerce baskets: $8.99 to $450.00. */
export const ORDER_AMOUNT_MINOR = { min: 899, max: 45_000 } as const;
/** Small enough to stay inside the default 50¢ / 3% tolerance. */
export const FEE_DIFFERENCE_MINOR = { min: 10, max: 45 } as const;
/** Large enough to break the tolerance: 10–40% of the order, at least $5. */
export const MISMATCH_FRACTION = { min: 0.1, max: 0.4 } as const;
export const MIN_MISMATCH_MINOR = 500;

/** The order system records the order shortly before the card is charged. */
export const LEDGER_LEAD_SECONDS = { min: 0, max: 90 } as const;
/** Without a reference, only time/amount/customer can pair the records. */
export const FUZZY_LEAD_MINUTES = { min: 2, max: 15 } as const;
/** Gateway confirms a few seconds after the PaymentIntent is created. */
export const GATEWAY_CONFIRMATION_DELAY_SECONDS = 3;

/** https://docs.stripe.com/testing — test-mode payment methods. */
export const STRIPE_TEST_PAYMENT_METHODS = {
  SUCCEEDS: 'pm_card_visa',
  DECLINED: 'pm_card_chargeDeclined',
} as const;

/** Parallel Stripe calls: well under test-mode rate limits. */
export const STRIPE_CONCURRENCY = 4;
