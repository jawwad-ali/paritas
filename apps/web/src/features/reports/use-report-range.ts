'use client';

import { MAX_REPORT_DAYS } from '@paritas/shared';
import { useState, useSyncExternalStore } from 'react';
import type { ReportRangeParams } from '@/lib/api/endpoints/params';
import { useBrowserTimeZone } from '@/hooks/use-browser-time-zone';
import { shiftDay, todayIn } from '@/lib/format/day';

const DEFAULT_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const noSubscription = (): (() => void) => () => undefined;

export interface ReportRange {
  params: ReportRangeParams;
  setFrom: (day: string) => void;
  setTo: (day: string) => void;
  /** Why the range cannot be used, or null when it can. */
  problem: string | null;
  /** False while prerendering: "today" is only known in the browser. */
  ready: boolean;
}

/** "Today" in the viewer's zone; null on the server, so the static shell holds no clock value. */
const useToday = (timeZone: string): string | null =>
  useSyncExternalStore(
    noSubscription,
    () => todayIn(timeZone),
    () => null,
  );

/** A report window in whole days of the viewer's time zone, last 30 days by default. */
export const useReportRange = (): ReportRange => {
  const timeZone = useBrowserTimeZone();
  const today = useToday(timeZone);
  const [fromChoice, setFrom] = useState<string | null>(null);
  const [toChoice, setTo] = useState<string | null>(null);

  const to = toChoice ?? today ?? '';
  const from = fromChoice ?? (today ? shiftDay(today, -(DEFAULT_DAYS - 1)) : '');
  const days = (Date.parse(to) - Date.parse(from)) / MS_PER_DAY + 1;
  const problem = !today
    ? null
    : !from || !to
      ? 'Choose both dates.'
      : from > to
        ? 'The end date must be on or after the start date.'
        : days > MAX_REPORT_DAYS
          ? `A report covers at most ${MAX_REPORT_DAYS} days.`
          : null;

  return { params: { from, to, timeZone }, setFrom, setTo, problem, ready: today !== null };
};
