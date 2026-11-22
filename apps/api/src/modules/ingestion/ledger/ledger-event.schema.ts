import { z } from 'zod';
import { TRANSACTION_STATUSES } from '@paritas/shared';

export const LEDGER_EVENT_TYPES = ['ledger.entry.recorded', 'ledger.entry.updated'] as const;

/**
 * Contract for webhooks from the company's internal ledger (order system).
 * This is the API the internal team integrates against, so it is strict.
 */
export const ledgerEventSchema = z.object({
  /** Unique per event: redeliveries reuse it, which makes ingestion idempotent. */
  id: z.string().min(1).max(200),
  type: z.enum(LEDGER_EVENT_TYPES),
  createdAt: z.iso.datetime({ offset: true }),
  data: z.object({
    entryId: z.string().min(1).max(200),
    /** The gateway's payment id as captured at checkout; null if it was not captured. */
    paymentReference: z.string().min(1).max(200).nullable(),
    amountMinor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    currency: z.string().regex(/^[A-Za-z]{3}$/, 'Must be a 3-letter ISO 4217 code.'),
    status: z.enum(TRANSACTION_STATUSES),
    occurredAt: z.iso.datetime({ offset: true }),
    customerEmail: z.email().nullable(),
    description: z.string().max(500).nullable(),
    orderId: z.string().max(200).nullable(),
  }),
});
export type LedgerEvent = z.infer<typeof ledgerEventSchema>;
