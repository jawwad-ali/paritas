/** Inline runner: start the background sweeps at most this often per function instance. */
export const SWEEP_ON_TRAFFIC_EVERY_MS = 60_000;

export const CRON_ROUTE = {
  CONTROLLER: 'internal/cron',
  SWEEP: 'sweep',
} as const;
