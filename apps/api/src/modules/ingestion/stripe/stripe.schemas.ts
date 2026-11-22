import { z } from 'zod';

/**
 * Only the fields Paritas relies on are declared; everything else Stripe sends
 * passes through untouched (and stays in the stored raw payload).
 */
const expandableId = z.union([z.string(), z.object({ id: z.string() })]);

const stripeMetadata = z.record(z.string(), z.string()).default({});

export const stripeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  created: z.number().int().positive(),
  livemode: z.boolean(),
  data: z.object({ object: z.record(z.string(), z.unknown()) }),
});
export type StripeEventEnvelope = z.infer<typeof stripeEventSchema>;

export const paymentIntentSchema = z.object({
  id: z.string().startsWith('pi_'),
  amount: z.number().int().nonnegative(),
  amount_received: z.number().int().nonnegative().default(0),
  currency: z.string().length(3),
  status: z.string(),
  created: z.number().int().positive(),
  receipt_email: z.string().nullish(),
  customer: expandableId.nullish(),
  description: z.string().nullish(),
  metadata: stripeMetadata,
  latest_charge: expandableId.nullish(),
});
export type StripePaymentIntent = z.infer<typeof paymentIntentSchema>;

export const chargeSchema = z.object({
  id: z.string().startsWith('ch_'),
  payment_intent: expandableId.nullish(),
  amount: z.number().int().nonnegative(),
  amount_refunded: z.number().int().nonnegative(),
  currency: z.string().length(3),
  refunded: z.boolean(),
  created: z.number().int().positive(),
  receipt_email: z.string().nullish(),
  billing_details: z.object({ email: z.string().nullish() }).partial().nullish(),
  description: z.string().nullish(),
  metadata: stripeMetadata,
});
export type StripeCharge = z.infer<typeof chargeSchema>;

export const idOf = (value: z.infer<typeof expandableId> | null | undefined): string | null =>
  value == null ? null : typeof value === 'string' ? value : value.id;
