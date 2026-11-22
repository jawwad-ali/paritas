'use client';

import { EXCEPTION_TYPE_LABELS, formatExceptionNumber } from '@paritas/shared';
import { ArrowLeft, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Money } from '@/components/domain/money';
import { SeverityBadge } from '@/components/domain/severity-badge';
import { ExceptionStatusLabel, ExceptionTypeLabel } from '@/components/domain/status-badges';
import { ErrorState } from '@/components/layout/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/api-error';
import { useAuth } from '@/lib/auth/use-auth';
import { formatAge, formatDateTime } from '@/lib/format/time';
import { useException } from '../use-exception-queries';
import { ActivityTimeline } from './activity-timeline';
import { AssigneeControl } from './assignee-control';
import { DecisionPanel } from './decision-panel';
import { TYPE_GUIDANCE } from './exception-copy';
import { NoteForm } from './note-form';
import { RecordComparison } from './record-comparison';

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-1">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd>{children}</dd>
  </div>
);

const InvestigationSkeleton = () => (
  <div
    className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    aria-busy="true"
    aria-label="Loading exception"
  >
    <div className="space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-72" />
      <Skeleton className="h-48" />
    </div>
    <Skeleton className="h-96" />
  </div>
);

/** One exception: the evidence on the left, the decision on the right. */
export const ExceptionInvestigation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const query = useException(id);

  if (query.isPending || !user) {
    return <InvestigationSkeleton />;
  }
  if (query.isError) {
    const missing =
      isApiError(query.error) && (query.error.status === 404 || query.error.status === 400);
    return (
      <ErrorState
        title={missing ? 'This exception does not exist' : 'The exception could not load'}
        error={query.error}
        onRetry={missing ? undefined : () => void query.refetch()}
      />
    );
  }

  const exception = query.data;
  const open = exception.status === 'OPEN' || exception.status === 'INVESTIGATING';
  const guidance = TYPE_GUIDANCE[exception.type];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/exceptions">
          <ArrowLeft data-icon="inline-start" />
          Exceptions
        </Link>
      </Button>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">
            {formatExceptionNumber(exception.number)}
          </span>
          <SeverityBadge severity={exception.severity} />
          <ExceptionTypeLabel type={exception.type} />
          <ExceptionStatusLabel status={exception.status} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">{exception.title}</h1>
        <p className="text-sm text-muted-foreground">
          Detected {formatDateTime(exception.createdAt)}
          {open && ` · open for ${formatAge(exception.createdAt)}`}
        </p>
      </header>

      {/* Phone order: evidence, decision, history. Desktop: decision in a sticky column. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0 space-y-6 lg:col-start-1">
          <div className="flex gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="max-w-prose">
              <span className="font-medium">{EXCEPTION_TYPE_LABELS[exception.type]}: </span>
              {guidance.meaning} <span className="text-muted-foreground">{guidance.next}</span>
            </p>
          </div>
          <RecordComparison exception={exception} />
        </div>

        <aside
          aria-label="Decision"
          className="space-y-4 lg:sticky lg:top-16 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <section className="space-y-4 rounded-md border bg-card p-4">
            <h2 className="text-sm font-bold">{open ? 'Decide' : 'Decision'}</h2>
            <dl className="space-y-3 text-sm">
              <Fact label="Assignee">
                <AssigneeControl exception={exception} user={user} editable={open} />
              </Fact>
              {exception.amountMinor !== null && exception.currency && (
                <Fact label="Amount at issue">
                  <Money
                    amountMinor={exception.amountMinor}
                    currency={exception.currency}
                    className="font-medium"
                  />
                </Fact>
              )}
              {!open && (
                <Fact label={exception.status === 'RESOLVED' ? 'Resolved by' : 'Ignored by'}>
                  {exception.resolvedBy?.name ?? 'Matching engine'}
                  {exception.resolvedAt && (
                    <span className="block text-xs text-muted-foreground">
                      {formatDateTime(exception.resolvedAt)}
                    </span>
                  )}
                  {exception.resolutionReason && (
                    <p className="mt-1">{exception.resolutionReason}</p>
                  )}
                </Fact>
              )}
            </dl>
            <DecisionPanel exception={exception} user={user} />
          </section>
        </aside>

        <section
          aria-labelledby="history-title"
          className="min-w-0 space-y-4 self-start rounded-md border bg-card p-4 lg:col-start-1"
        >
          <h2 id="history-title" className="text-sm font-bold">
            History
          </h2>
          <ActivityTimeline activities={exception.activities} />
          <NoteForm exceptionId={exception.id} number={exception.number} />
        </section>
      </div>
    </div>
  );
};
