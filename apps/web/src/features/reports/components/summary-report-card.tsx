'use client';

import { useQuery } from '@tanstack/react-query';
import { Figure } from '@/components/domain/figure';
import { Money } from '@/components/domain/money';
import { ErrorState } from '@/components/layout/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadSummaryReport, getSummaryReport } from '@/lib/api/endpoints/insights';
import { useAuth } from '@/lib/auth/use-auth';
import { queryKeys } from '@/lib/query/keys';
import { useReportRange } from '../use-report-range';
import { DownloadButtons } from './download-buttons';
import { RangeFields } from './range-fields';

const NUMBER = new Intl.NumberFormat('en-US');
const PERCENT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

/** The reconciliation summary: previewed live for the chosen days, then downloaded. */
export const SummaryReportCard = () => {
  const range = useReportRange();
  const ready = useAuth().status === 'authenticated';
  const preview = useQuery({
    queryKey: queryKeys.summaryReport(range.params),
    queryFn: ({ signal }) => getSummaryReport(range.params, signal),
    enabled: ready && range.ready && range.problem === null,
  });
  const summary = preview.data;

  return (
    <section
      aria-labelledby="summary-report"
      className="space-y-4 rounded-md border bg-card p-4 sm:p-6"
    >
      <div className="space-y-1">
        <h2 id="summary-report" className="text-lg font-bold tracking-tight">
          Reconciliation summary
        </h2>
        <p className="text-muted-foreground">
          Records and match rate by source, payment volume, matches by method, and exceptions
          detected and closed, day by day.
        </p>
      </div>
      <RangeFields range={range} idPrefix="summary" />
      {preview.isError ? (
        <ErrorState
          title="The preview could not load"
          error={preview.error}
          onRetry={() => void preview.refetch()}
        />
      ) : !summary || preview.isFetching ? (
        <Skeleton className="h-24" aria-label="Loading the preview" />
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 rounded-md border px-4">
          <Figure label="Records" value={NUMBER.format(summary.transactions.total)} />
          <Figure
            label="Match rate"
            value={
              summary.transactions.matchRate === null
                ? '—'
                : PERCENT.format(summary.transactions.matchRate)
            }
          />
          <Figure label="Exceptions detected" value={NUMBER.format(summary.exceptionFlow.opened)} />
          <Figure
            label="Payment volume"
            value={
              summary.volume.length === 1 && summary.volume[0] ? (
                <Money
                  amountMinor={summary.volume[0].amountMinor}
                  currency={summary.volume[0].currency}
                />
              ) : (
                `${summary.volume.length} currencies`
              )
            }
          />
        </dl>
      )}
      <DownloadButtons
        disabled={!range.ready || range.problem !== null}
        download={(format) => downloadSummaryReport(range.params, format)}
      />
    </section>
  );
};
