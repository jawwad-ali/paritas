import type { DashboardOverviewDto } from '@paritas/shared';
import { Figure, Footnotes } from '@/components/domain/figure';

const NUMBER = new Intl.NumberFormat('en-US');
const PERCENT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

/** 0.05 h → "3 min"; 5.25 → "5.3 h"; 60 → "2.5 d". */
const duration = (hours: number | null): string => {
  if (hours === null) {
    return '—';
  }
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))} min`;
  }
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} d`;
};

/** The five numbers a manager asks about first, each with how it is computed. */
export const HeadlineFigures = ({ overview }: { overview: DashboardOverviewDto }) => {
  const { transactions, openExceptions, exceptionFlow } = overview;
  return (
    <section aria-label="Headline figures" className="rounded-md border bg-card px-4">
      <dl className="grid grid-cols-2 divide-y border-b sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5 lg:divide-x [&>*]:px-0 lg:[&>*]:px-4 lg:[&>*:first-child]:pl-0">
        <Figure label="Records processed" value={NUMBER.format(transactions.total)} footnote={1} />
        <Figure
          label="Match rate"
          value={transactions.matchRate === null ? '—' : PERCENT.format(transactions.matchRate)}
          footnote={2}
          change={`${NUMBER.format(transactions.matched)} matched`}
        />
        <Figure
          label="Open exceptions"
          value={NUMBER.format(openExceptions.total)}
          change={`${NUMBER.format(openExceptions.unassigned)} unassigned`}
        />
        <Figure
          label="Critical"
          value={NUMBER.format(openExceptions.critical)}
          tone={openExceptions.critical > 0 ? 'critical' : 'default'}
          change="open now"
        />
        <Figure
          label="Median time to close"
          value={duration(exceptionFlow.medianHoursToClose)}
          footnote={3}
          change={`${NUMBER.format(exceptionFlow.resolved + exceptionFlow.ignored)} closed`}
        />
      </dl>
      <Footnotes
        className="py-3"
        notes={[
          'Both sides count: each payment is one Stripe record and one ledger record, by payment date.',
          'Matched ÷ (all records − excluded). Declined payments nobody booked are excluded.',
          'Detection to closure, for exceptions closed in the period.',
        ]}
      />
    </section>
  );
};
