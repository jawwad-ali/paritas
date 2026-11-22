'use client';

import {
  RAW_EVENT_STATUSES,
  type RawEventStatus,
  SOURCE_CODES,
  type SourceCode,
} from '@paritas/shared';
import { PaginationBar } from '@/components/data/pagination-bar';
import { SelectFilter } from '@/components/data/select-filter';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { ErrorState } from '@/components/layout/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SOURCE_LABELS } from '@/features/exceptions/exception-filters';
import { useSearchState } from '@/hooks/use-search-state';
import { formatDateTime } from '@/lib/format/time';
import { cn } from '@/lib/utils';
import { readEnum, readPage, readString } from '@/lib/url/search-params';
import { useRawEvents } from '../use-admin-queries';
import { EventSheet } from './event-sheet';
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from './events.config';

interface EventFilters {
  source?: SourceCode;
  status?: RawEventStatus;
  id?: string;
  page: number;
}

const parse = (params: URLSearchParams): EventFilters => ({
  source: readEnum(params, 'source', Object.values(SOURCE_CODES)),
  status: readEnum(params, 'status', RAW_EVENT_STATUSES),
  id: readString(params, 'id'),
  page: readPage(params),
});

/** Webhooks exactly as each source sent them, kept for audit and for replay. */
export const EventsView = () => {
  const [filters, setFilters] = useSearchState(parse);
  const query = useRawEvents({
    source: filters.source,
    status: filters.status,
    page: filters.page,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <SelectFilter
          label="Source"
          allLabel="All sources"
          options={Object.values(SOURCE_CODES)}
          labels={SOURCE_LABELS}
          value={filters.source}
          onChange={(source) => setFilters({ source })}
        />
        <SelectFilter
          label="Status"
          allLabel="Any status"
          options={RAW_EVENT_STATUSES}
          labels={EVENT_STATUS_LABELS}
          value={filters.status}
          onChange={(status) => setFilters({ status })}
        />
      </div>
      {query.isPending ? (
        <TableSkeleton columns={5} />
      ) : query.isError ? (
        <ErrorState
          title="Events could not load"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Received</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.data.map((event) => (
                <TableRow key={event.id} className="relative">
                  <TableCell className="pl-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setFilters({ id: event.id, page: filters.page })}
                      className="text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                    >
                      {formatDateTime(event.receivedAt)}
                    </button>
                  </TableCell>
                  <TableCell>{event.source.name}</TableCell>
                  <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex h-5 items-center rounded-sm px-1.5 text-xs font-medium',
                        EVENT_STATUS_STYLES[event.status],
                      )}
                    >
                      {EVENT_STATUS_LABELS[event.status]}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-64 truncate pr-4 text-muted-foreground">
                    {event.error ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {query.data && query.data.meta.totalItems > 0 && (
        <PaginationBar
          meta={query.data.meta}
          noun="events"
          onPageChange={(page) => setFilters({ page })}
        />
      )}
      <EventSheet
        id={filters.id}
        onClose={() => setFilters({ id: undefined, page: filters.page })}
      />
    </div>
  );
};
