'use client';

import { useSyncExternalStore } from 'react';
import { browserTimeZone } from '@/lib/format/day';

const noSubscription = (): (() => void) => () => undefined;

/**
 * The viewer's IANA time zone. The server renders UTC; the browser switches to
 * the real zone right after hydration, without a hydration mismatch.
 */
export const useBrowserTimeZone = (): string =>
  useSyncExternalStore(noSubscription, browserTimeZone, () => 'UTC');
