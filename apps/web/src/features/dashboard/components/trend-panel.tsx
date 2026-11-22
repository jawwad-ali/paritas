import type { TrendPointDto } from '@paritas/shared';
import { BarChart } from '@/components/charts/bar-chart';
import type { ChartSeries } from '@/components/charts/chart.types';
import { formatDay } from '@/lib/format/day';

const RECORD_SERIES: ChartSeries[] = [
  { key: 'matched', label: 'Matched', color: 'var(--series-settled)' },
  { key: 'other', label: 'Not matched', color: 'var(--series-attention)' },
];

const EXCEPTION_SERIES: ChartSeries[] = [
  { key: 'opened', label: 'Detected', color: 'var(--series-attention)' },
  { key: 'closed', label: 'Closed', color: 'var(--series-settled)' },
];

/** Two charts, one scale each: records per day, and exceptions detected against closed. */
export const TrendPanel = ({ trend }: { trend: TrendPointDto[] }) => {
  const records = trend.map((point) => ({
    label: point.date,
    values: { matched: point.matched, other: point.transactions - point.matched },
  }));
  const exceptions = trend.map((point) => ({
    label: point.date,
    values: { opened: point.exceptionsOpened, closed: point.exceptionsClosed },
  }));

  return (
    <section aria-label="Daily trend" className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-md border bg-card p-4">
        <BarChart
          title="Records per day"
          data={records}
          series={RECORD_SERIES}
          layout="stacked"
          formatLabel={formatDay}
        />
      </div>
      <div className="rounded-md border bg-card p-4">
        <BarChart
          title="Exceptions per day"
          data={exceptions}
          series={EXCEPTION_SERIES}
          layout="grouped"
          formatLabel={formatDay}
        />
      </div>
    </section>
  );
};
