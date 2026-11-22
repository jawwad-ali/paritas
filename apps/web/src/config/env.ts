import { z } from 'zod';

/**
 * Public (browser-visible) configuration. NEXT_PUBLIC_* values are inlined
 * at build time, so each must be referenced literally for Next to replace it.
 */
const publicEnvSchema = z.object({
  /**
   * Where the browser calls the API. Unset: this same origin, which forwards
   * /api/v1/* to the API (API_PROXY_URL in next.config.ts), so the session
   * cookie stays first-party when the two run on different domains.
   */
  NEXT_PUBLIC_API_URL: z
    .preprocess((value) => (value === '' ? undefined : value), z.url().optional())
    .transform((value) => value ?? ''),
  /**
   * Local demos only: when set, the sign-in page offers the seeded demo
   * accounts with this password. Never set it in a real deployment.
   */
  NEXT_PUBLIC_DEMO_PASSWORD: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DEMO_PASSWORD: process.env.NEXT_PUBLIC_DEMO_PASSWORD,
});
