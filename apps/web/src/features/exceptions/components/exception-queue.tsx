'use client';

import { Inbox } from 'lucide-react';
import { PaginationBar } from '@/components/data/pagination-bar';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { ErrorState } from '@/components/layout/error-state';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSearchState } from '@/hooks/use-search-state';
import { parseQueueFilters, type QueueView, toListParams } from '../exception-filters';
import { useExceptionList, useExceptionStats } from '../use-exception-queries';
import { ExceptionCards, ExceptionTable } from './exception-rows';
import { QueueToolbar } from './queue-toolbar';

const EMPTY_COPY: Record<QueueView, { title: string; description: string }> = {
  open: {
    title: 'Nothing to reconcile',
    description:
      'Every record has a match or a decision. New exceptions appear here as they are detected.',
  },
  mine: {
    title: 'Nothing assigned to you',
    description: 'Take an exception from the Unassigned view to start on it.',
  },
  unassigned: {
    title: 'Every open exception has an owner',
    description: 'Nothing is waiting to be picked up.',
  },
  closed: {
    title: 'No closed exceptions yet',
    description: 'Resolved and ignored exceptions are kept here with their reasons.',
  },
  all: {
    title: 'No exceptions yet',
    description: 'They appear when the matching engine finds records that do not agree.',
  },
};

/** The work queue: views, filters and search in the URL; the list below. */
export const ExceptionQueue = () => {
  const [filters, setFilters] = useSearchState(parseQueueFilters);
  const params = toListParams(filters);
  const list = useExceptionList(params);
  const stats = useExceptionStats();
  const narrowed = Boolean(filters.type || filters.severity || filters.source || filters.search);

  return (
    <div className="space-y-4">
      <QueueToolbar filters={filters} stats={stats.data} onChange={setFilters} />
      {list.isPending ? (
        <TableSkeleton />
      ) : list.isError ? (
        <ErrorState
          title="The queue could not load"
          error={list.error}
          onRetry={() => void list.refetch()}
        />
      ) : list.data.data.length === 0 ? (
        <Empty className="rounded-md border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>
              {narrowed ? 'No exceptions match these filters' : EMPTY_COPY[filters.view].title}
            </EmptyTitle>
            <EmptyDescription>
              {narrowed
                ? 'Clear a filter or change the search.'
                : EMPTY_COPY[filters.view].description}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <ExceptionTable rows={list.data.data} />
          <ExceptionCards rows={list.data.data} />
        </div>
      )}
      {list.data && list.data.meta.totalItems > 0 && (
        <PaginationBar
          meta={list.data.meta}
          noun="exceptions"
          onPageChange={(page) => setFilters({ page })}
        />
      )}
    </div>
  );
};
