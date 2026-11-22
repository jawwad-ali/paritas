import type { RawEventStatus } from '@paritas/shared';

export const EVENT_STATUS_LABELS: Record<RawEventStatus, string> = {
  RECEIVED: 'Received',
  PROCESSED: 'Processed',
  FAILED: 'Failed',
  IGNORED: 'Ignored',
};

export const EVENT_STATUS_STYLES: Record<RawEventStatus, string> = {
  RECEIVED: 'bg-muted text-muted-foreground',
  PROCESSED: 'bg-matched-bg text-matched-fg',
  FAILED: 'bg-sev-critical-bg text-sev-critical-fg',
  IGNORED: 'bg-sev-low-bg text-sev-low-fg',
};
