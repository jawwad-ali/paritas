'use client';

import { RECONCILIATION_STATUSES, SOURCE_CODES, TRANSACTION_STATUSES } from '@paritas/shared';
import { ArrowLeftRight, X } from 'lucide-react';
import { DateRangeFilter } from '@/components/data/date-range-filter';
import { PaginationBar } from '@/components/data/pagination-bar';
import { SearchBox } from '@/components/data/search-box';
import { SelectFilter } from '@/components/data/select-filter';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { ErrorState } from '@/components/layout/error-state';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SOURCE_LABELS } from '@/features/exceptions/exception-filters';
import { useSearchState } from '@/hooks/use-search-state';
import {
  parseTransactionFilters,
  RECONCILIATION_LABELS,
  toTransactionParams,
  TRANSACTION_STATUS_LABELS,
} from '../transaction-filters';
import { useTransactionList } from '../use-transaction-queries';
import { TransactionSheet } from './transaction-sheet';
import { TransactionTable } from './transaction-table';

/** Every normalised record, searchable by reference, id or customer; filters live in the URL. */
export const TransactionsView = () => {
  const [filters, setFilters] = useSearchState(parseTransactionFilters);
  const list = useTransactionList(toTransactionParams(filters));
  const narrowed = Boolean(
    filters.source ||
    filters.status ||
    filters.reconciliationStatus ||
    filters.from ||
    filters.to ||
    filters.search,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center">
        <SearchBox
          label="Search transactions"
          placeholder="Reference, record id or customer"
          value={filters.search}
          onChange={(search) => setFilters({ search })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SelectFilter
            label="Source"
            allLabel="All sources"
            options={Object.values(SOURCE_CODES)}
            labels={SOURCE_LABELS}
            value={filters.source}
            onChange={(source) => setFilters({ source })}
          />
          <SelectFilter
            label="Payment status"
            allLabel="Any payment status"
            options={TRANSACTION_STATUSES}
            labels={TRANSACTION_STATUS_LABELS}
            value={filters.status}
            onChange={(status) => setFilters({ status })}
          />
          <SelectFilter
            label="Reconciliation"
            allLabel="Any reconciliation"
            options={RECONCILIATION_STATUSES}
            labels={RECONCILIATION_LABELS}
            value={filters.reconciliationStatus}
            onChange={(reconciliationStatus) => setFilters({ reconciliationStatus })}
          />
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            onChange={(range) => setFilters(range)}
          />
          {narrowed && (
            <Button
              variant="ghost"
              onClick={() =>
                setFilters({
                  source: undefined,
                  status: undefined,
                  reconciliationStatus: undefined,
                  from: undefined,
                  to: undefined,
                  search: undefined,
                })
              }
            >
              <X data-icon="inline-start" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
      {list.isPending ? (
        <TableSkeleton />
      ) : list.isError ? (
        <ErrorState
          title="Transactions could not load"
          error={list.error}
          onRetry={() => void list.refetch()}
        />
      ) : list.data.data.length === 0 ? (
        <Empty className="rounded-md border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowLeftRight />
            </EmptyMedia>
            <EmptyTitle>
              {narrowed ? 'No records match these filters' : 'No transactions yet'}
            </EmptyTitle>
            <EmptyDescription>
              {narrowed
                ? 'Clear a filter or widen the dates.'
                : 'Records appear as Stripe and the ledger send their events.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <TransactionTable
            rows={list.data.data}
            onOpen={(id) => setFilters({ id, page: filters.page })}
          />
        </div>
      )}
      {list.data && list.data.meta.totalItems > 0 && (
        <PaginationBar
          meta={list.data.meta}
          noun="records"
          onPageChange={(page) => setFilters({ page })}
        />
      )}
      <TransactionSheet
        id={filters.id}
        onClose={() => setFilters({ id: undefined, page: filters.page })}
      />
    </div>
  );
};
