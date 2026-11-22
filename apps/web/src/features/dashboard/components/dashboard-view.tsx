'use client';

import type { DashboardPeriod } from '@paritas/shared';
import { PageHeader } from '@/components/layout/page-header';
import { ErrorState } from '@/components/layout/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSearchState } from '@/hooks/use-search-state';
import { hasRole } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDay } from '@/lib/format/day';
import { readEnum } from '@/lib/url/search-params';
import { useDashboard } from '../use-dashboard';
import { AttentionPanel } from './attention-panel';
import { HeadlineFigures } from './headline-figures';
import { SimulateDialog } from './simulate-dialog';
import { SourcesPanel } from './sources-panel';
import { TrendPanel } from './trend-panel';

const PERIODS = ['7d', '30d'] as const satisfies readonly DashboardPeriod[];
const SELECTED = 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground';
const parse = (params: URLSearchParams): { period: DashboardPeriod; page?: number } => ({
  period: readEnum(params, 'period', PERIODS) ?? '7d',
});

const DashboardSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading the dashboard">
    <Skeleton className="h-36" />
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
    <Skeleton className="h-60" />
  </div>
);

/** Reconciliation health for the last 7 or 30 days, in the viewer's own time zone. */
export const DashboardView = () => {
  const [{ period }, setState] = useSearchState(parse);
  const { user } = useAuth();
  const query = useDashboard(period);
  const range = query.data
    ? `${formatDay(query.data.period.fromDate)} – ${formatDay(query.data.period.toDate)} · ${query.data.period.timeZone}`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={range ?? 'Reconciliation health at a glance.'}
        actions={
          <>
            {hasRole(user, ['ADMIN']) && <SimulateDialog />}
            <ToggleGroup
              type="single"
              variant="outline"
              value={period}
              onValueChange={(value) => {
                const next = PERIODS.find((option) => option === value);
                if (next) {
                  setState({ period: next });
                }
              }}
              aria-label="Period"
            >
              <ToggleGroupItem value="7d" className={SELECTED}>
                Last 7 days
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className={SELECTED}>
                Last 30 days
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      />
      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="The dashboard could not load"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="space-y-6">
          <HeadlineFigures overview={query.data} />
          <AttentionPanel overview={query.data} />
          <TrendPanel trend={query.data.trend} />
          <SourcesPanel overview={query.data} />
        </div>
      )}
    </div>
  );
};
