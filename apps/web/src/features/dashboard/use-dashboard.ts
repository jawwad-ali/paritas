'use client';

import type { DashboardPeriod } from '@paritas/shared';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api/endpoints/insights';
import { useAuth } from '@/lib/auth/use-auth';
import { useBrowserTimeZone } from '@/hooks/use-browser-time-zone';
import { queryKeys } from '@/lib/query/keys';

/** The engine works continuously; the dashboard follows it once a minute. */
const REFRESH_MS = 60_000;

export const useDashboard = (period: DashboardPeriod) => {
  const ready = useAuth().status === 'authenticated';
  const timeZone = useBrowserTimeZone();
  return useQuery({
    queryKey: queryKeys.dashboard(period, timeZone),
    queryFn: ({ signal }) => getDashboard(period, timeZone, signal),
    enabled: ready,
    refetchInterval: REFRESH_MS,
  });
};
