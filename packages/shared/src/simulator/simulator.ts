import { z } from 'zod';

/**
 * - `synthetic`: Stripe-shaped events are generated locally (no Stripe account needed).
 * - `stripe`: real PaymentIntents are created in Stripe test mode; Stripe then sends
 *   the webhooks (forward them with `stripe listen`).
 */
export const SIMULATOR_GATEWAY_MODES = ['synthetic', 'stripe'] as const;
export type SimulatorGatewayMode = (typeof SIMULATOR_GATEWAY_MODES)[number];

/** What the simulator makes happen to one payment, so every exception type can be demoed. */
export const SIMULATED_SCENARIOS = [
  'EXACT_MATCH', // both sides agree and share the gateway reference
  'FEE_WITHIN_TOLERANCE', // amounts differ by a fee-sized amount
  'FUZZY_MATCH', // ledger lacks the reference; amount, time and customer agree
  'MISSING_IN_LEDGER', // paid at the gateway, never recorded internally
  'MISSING_AT_GATEWAY', // recorded internally, gateway has no such payment
  'AMOUNT_MISMATCH', // amounts differ beyond tolerance
  'DUPLICATE_IN_LEDGER', // ledger recorded the same payment twice
  'STATUS_CONFLICT', // gateway failed, ledger says succeeded
  'DELAYED_SETTLEMENT', // gateway still processing, ledger already pending
] as const;
export type SimulatedScenario = (typeof SIMULATED_SCENARIOS)[number];

export const MAX_SIMULATED_PAYMENTS = 200;
/** Real Stripe calls are slow and rate-limited; keep a run within one request's budget. */
export const MAX_STRIPE_SIMULATED_PAYMENTS = 50;

export const simulatorRunRequestSchema = z
  .object({
    count: z.number().int().min(1).max(MAX_SIMULATED_PAYMENTS).default(25),
    gateway: z.enum(SIMULATOR_GATEWAY_MODES).default('synthetic'),
    /** Share of payments that get an anomaly (0 = all clean, 1 = all anomalous). */
    anomalyRate: z.number().min(0).max(1).default(0.3),
    /** Payments are spread over this many past hours (synthetic mode only). */
    spreadHours: z.number().int().min(0).max(168).default(6),
  })
  .refine((run) => run.gateway !== 'stripe' || run.count <= MAX_STRIPE_SIMULATED_PAYMENTS, {
    path: ['count'],
    message: `Stripe mode creates real test payments; use at most ${MAX_STRIPE_SIMULATED_PAYMENTS} per run.`,
  });
export type SimulatorRunRequest = z.infer<typeof simulatorRunRequestSchema>;

export interface SimulatorRunResult {
  runId: string;
  gateway: SimulatorGatewayMode;
  payments: number;
  scenarios: Partial<Record<SimulatedScenario, number>>;
  /** Events handed to ingestion (synthetic) or payments created at Stripe (stripe mode). */
  gatewayEvents: number;
  ledgerEvents: number;
}
