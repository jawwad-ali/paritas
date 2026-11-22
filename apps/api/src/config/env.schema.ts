import { z } from 'zod';
import {
  COOKIE_SAME_SITE_VALUES,
  DEFAULT_JWT_ACCESS_TTL_SECONDS,
  DEFAULT_PORT,
  DEFAULT_REFRESH_TOKEN_TTL_DAYS,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  LOG_LEVELS,
  MIN_JWT_SECRET_LENGTH,
  NODE_ENVIRONMENTS,
  PLACEHOLDER_SECRET_PREFIX,
} from './env.constants.js';

/** Env vars arrive as strings; parse "true"/"false" explicitly (z.coerce.boolean treats "false" as true). */
const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

/** `KEY=` in a .env file yields "", which must mean "not set", not "set to empty". */
const optionalString = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const commaSeparatedList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0),
);

/**
 * Single source of truth for configuration. The app refuses to boot when
 * any variable is missing or malformed, so misconfiguration fails fast at
 * deploy time instead of surfacing as a runtime error.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(DEFAULT_PORT),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
    CORS_ORIGINS: commaSeparatedList.pipe(z.array(z.url()).min(1)),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    REDIS_URL: z.url({ protocol: /^rediss?$/ }),
    SWAGGER_ENABLED: booleanFromString.default(false),
    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(DEFAULT_THROTTLE_TTL_MS),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(DEFAULT_THROTTLE_LIMIT),
    /** Number of reverse proxies in front of the API (0 = exposed directly). */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),

    // ── Authentication ────────────────────────────────────
    JWT_ACCESS_SECRET: z
      .string()
      .min(MIN_JWT_SECRET_LENGTH, `Must be at least ${MIN_JWT_SECRET_LENGTH} characters.`),
    JWT_ACCESS_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_JWT_ACCESS_TTL_SECONDS),
    REFRESH_TOKEN_TTL_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_REFRESH_TOKEN_TTL_DAYS),
    /** Secure by default; set "false" only for plain-HTTP local development. */
    AUTH_COOKIE_SECURE: booleanFromString.default(true),
    AUTH_COOKIE_SAMESITE: z.enum(COOKIE_SAME_SITE_VALUES).default('lax'),

    // ── Transaction sources ───────────────────────────────
    /** Signing secret of the Stripe webhook endpoint (or of `stripe listen`). Unset = Stripe webhooks disabled. */
    STRIPE_WEBHOOK_SECRET: optionalString(z.string().startsWith('whsec_')),
    /** Test-mode key, used only by the simulator to create real test payments. Live keys are refused. */
    STRIPE_SECRET_KEY: optionalString(
      z
        .string()
        .regex(/^(sk|rk)_test_/, 'Only Stripe test-mode keys (sk_test_/rk_test_) are allowed.'),
    ),
    /** HMAC secret shared with the internal ledger for signing its webhooks. */
    INTERNAL_LEDGER_WEBHOOK_SECRET: z
      .string()
      .min(MIN_JWT_SECRET_LENGTH, `Must be at least ${MIN_JWT_SECRET_LENGTH} characters.`),
    /** Demo data generator. Off unless explicitly enabled: it injects synthetic transactions. */
    SIMULATOR_ENABLED: booleanFromString.default(false),
  })
  .refine(
    (env) =>
      env.NODE_ENV !== 'production' || !env.JWT_ACCESS_SECRET.startsWith(PLACEHOLDER_SECRET_PREFIX),
    {
      path: ['JWT_ACCESS_SECRET'],
      message: 'Replace the example JWT secret before running in production.',
    },
  )
  .refine(
    (env) =>
      env.NODE_ENV !== 'production' ||
      !env.INTERNAL_LEDGER_WEBHOOK_SECRET.startsWith(PLACEHOLDER_SECRET_PREFIX),
    {
      path: ['INTERNAL_LEDGER_WEBHOOK_SECRET'],
      message: 'Replace the example ledger webhook secret before running in production.',
    },
  )
  .refine((env) => env.AUTH_COOKIE_SAMESITE !== 'none' || env.AUTH_COOKIE_SECURE, {
    path: ['AUTH_COOKIE_SAMESITE'],
    message: 'SameSite=None cookies must be Secure (set AUTH_COOKIE_SECURE=true).',
  });

export type Env = z.infer<typeof envSchema>;
