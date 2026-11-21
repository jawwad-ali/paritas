import { z } from 'zod';
import {
  DEFAULT_PORT,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  LOG_LEVELS,
  NODE_ENVIRONMENTS,
} from './env.constants.js';

/** Env vars arrive as strings; parse "true"/"false" explicitly (z.coerce.boolean treats "false" as true). */
const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

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
export const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(DEFAULT_PORT),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  CORS_ORIGINS: commaSeparatedList.pipe(z.array(z.url()).min(1)),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  SWAGGER_ENABLED: booleanFromString.default(false),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(DEFAULT_THROTTLE_TTL_MS),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(DEFAULT_THROTTLE_LIMIT),
});

export type Env = z.infer<typeof envSchema>;
