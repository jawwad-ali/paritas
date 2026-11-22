import { type DashboardOverviewDto, formatExceptionNumber } from '@paritas/shared';
import { ArrowRight, CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { Money } from '@/components/domain/money';
import { SEVERITY_STYLES } from '@/components/domain/severity.config';
import { SeverityBadge } from '@/components/domain/severity-badge';
import { Button } from '@/components/ui/button';
import { formatAge } from '@/lib/format/time';
import { cn } from '@/lib/utils';
import { SEVERITY_OPTIONS } from '@/features/exceptions/exception-filters';

const NUMBER = new Intl.NumberFormat('en-US');

/** What needs a person now: the most urgent open exceptions, and the open count by severity. */
export const AttentionPanel = ({ overview }: { overview: DashboardOverviewDto }) => {
  const { priorityExceptions, openExceptions } = overview;
  const largest = Math.max(1, ...SEVERITY_OPTIONS.map((s) => openExceptions.bySeverity[s]));

  return (
    <section
      aria-labelledby="attention-title"
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="rounded-md border bg-card">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 id="attention-title" className="text-sm font-bold">
            Needs attention
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/exceptions">
              Open the queue
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        {priorityExceptions.length === 0 ? (
          <p className="flex items-center gap-2 px-4 py-6 text-muted-foreground">
            <CircleCheck aria-hidden="true" className="size-4 text-matched-fg" />
            Nothing open. Every record has a match or a decision.
          </p>
        ) : (
          <ul className="divide-y">
            {priorityExceptions.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/exceptions/${row.id}`}
                  className={cn(
                    'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                    SEVERITY_STYLES[row.severity].edge,
                  )}
                >
                  <span className="font-medium tabular-nums">
                    {formatExceptionNumber(row.number)}
                  </span>
                  <span className="truncate text-muted-foreground">{row.title}</span>
                  <span className="text-right text-sm tabular-nums">
                    {row.amountMinor !== null && row.currency && (
                      <Money
                        amountMinor={row.amountMinor}
                        currency={row.currency}
                        className="font-medium"
                      />
                    )}
                    <span className="block text-xs text-muted-foreground">
                      {formatAge(row.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-3 rounded-md border bg-card p-4">
        <h2 className="text-sm font-bold">Open by severity</h2>
        <ul className="space-y-2.5">
          {SEVERITY_OPTIONS.map((severity) => {
            const count = openExceptions.bySeverity[severity];
            return (
              <li
                key={severity}
                className="grid grid-cols-[88px_minmax(0,1fr)_40px] items-center gap-3"
              >
                <SeverityBadge severity={severity} />
                <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span
                    className={cn('block h-full rounded-full', SEVERITY_STYLES[severity].tick)}
                    style={{ width: `${(count / largest) * 100}%` }}
                  />
                </span>
                <Link
                  href={`/exceptions?severity=${severity}`}
                  className="text-right text-sm font-medium tabular-nums underline-offset-4 hover:underline"
                  aria-label={`${NUMBER.format(count)} open ${severity.toLowerCase()} exceptions`}
                >
                  {NUMBER.format(count)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
