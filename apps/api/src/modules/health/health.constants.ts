/** A dependency that takes longer than this to answer is reported as down. */
export const DEPENDENCY_PING_TIMEOUT_MS = 1_500;

export const HEALTH_CHECK_KEYS = {
  DATABASE: 'database',
  REDIS: 'redis',
} as const;
