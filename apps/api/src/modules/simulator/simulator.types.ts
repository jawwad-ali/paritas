import type { SimulatedScenario, TransactionStatus } from '@paritas/shared';

/** One customer payment, before deciding what each system records about it. */
export interface SimulatedPayment {
  scenario: SimulatedScenario;
  orderId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  description: string;
  /** When the gateway created the payment. */
  gatewayAt: Date;
}

/** What the gateway ends up reporting for a payment. */
export type GatewayOutcome = 'succeeded' | 'failed' | 'processing';

/** One row the internal ledger records. */
export interface LedgerEntry {
  entryId: string;
  reference: string | null;
  amountMinor: number;
  status: TransactionStatus;
  occurredAt: Date;
}
