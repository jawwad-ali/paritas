import { z } from 'zod';

/**
 * Public (browser-visible) configuration. NEXT_PUBLIC_* values are inlined
 * at build time, so each must be referenced literally for Next to replace it.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
