/** Request paths that are too noisy to auto-log (probes hit them every few seconds). */
export const UNLOGGED_PATH_PREFIXES = ['/api/health'] as const;

/** Never write these to logs. */
export const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["stripe-signature"]',
  'res.headers["set-cookie"]',
] as const;
