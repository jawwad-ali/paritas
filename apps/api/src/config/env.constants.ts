export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export const DEFAULT_PORT = 4000;
export const DEFAULT_THROTTLE_TTL_MS = 60_000;
export const DEFAULT_THROTTLE_LIMIT = 300;

export const COOKIE_SAME_SITE_VALUES = ['lax', 'strict', 'none'] as const;

/**
 * Where background work runs. `queue`: BullMQ workers on Redis (retries, any number of replicas).
 * `inline`: inside the request that caused it, for serverless hosts with no long-running worker.
 */
export const JOB_RUNNERS = ['queue', 'inline'] as const;

/** Short-lived: limits the damage window of a leaked access token. */
export const DEFAULT_JWT_ACCESS_TTL_SECONDS = 15 * 60;
export const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
/** HS256 secrets shorter than the hash output (256 bits) weaken the signature. */
export const MIN_JWT_SECRET_LENGTH = 32;
/** The value shipped in .env.example; refused in production. */
export const PLACEHOLDER_SECRET_PREFIX = 'replace-with-';
