'use client';

import type { AuditLogDto } from '@paritas/shared';
import Link from 'next/link';
import { dayRangeToInstants, DateRangeFilter } from '@/components/data/date-range-filter';
import { JsonBlock } from '@/components/data/json-block';
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
import { useSearchState } from '@/hooks/use-search-state';
import { formatDateTime } from '@/lib/format/time';
import { readEnum, readPage, readString } from '@/lib/url/search-params';
import { useAuditLogs } from '../use-admin-queries';
import { AUDIT_ACTION_LABELS, AUDIT_ACTIONS, ENTITY_LABELS, ENTITY_TYPES } from './audit.config';

interface AuditFilters {
  action?: (typeof AUDIT_ACTIONS)[number];
  entityType?: (typeof ENTITY_TYPES)[number];
  from?: string;
  to?: string;
  page: number;
}

const parse = (params: URLSearchParams): AuditFilters => ({
  action: readEnum(params, 'action', AUDIT_ACTIONS),
  entityType: readEnum(params, 'entityType', ENTITY_TYPES),
  from: readString(params, 'from'),
  to: readString(params, 'to'),
  page: readPage(params),
});

const EntityCell = ({ log }: { log: AuditLogDto }) => {
  if (!log.entityType) {
    return <span className="text-muted-foreground">—</span>;
  }
  const label = ENTITY_LABELS[log.entityType] ?? log.entityType;
  return log.entityType === 'exception' && log.entityId ? (
    <Link
      href={`/exceptions/${log.entityId}`}
      className="text-primary underline-offset-4 hover:underline"
    >
      {label}
    </Link>
  ) : (
    <span>{label}</span>
  );
};

/** The append-only record of every important action: who, what, when, and the before/after. */
export const AuditView = () => {
  const [filters, setFilters] = useSearchState(parse);
  const query = useAuditLogs({
    action: filters.action,
    entityType: filters.entityType,
    page: filters.page,
    ...dayRangeToInstants(filters.from, filters.to),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectFilter
          label="Action"
          allLabel="All actions"
          options={AUDIT_ACTIONS}
          labels={AUDIT_ACTION_LABELS}
          value={filters.action}
          onChange={(action) => setFilters({ action })}
        />
        <SelectFilter
          label="Entity"
          allLabel="All entities"
          options={ENTITY_TYPES}
          labels={ENTITY_LABELS}
          value={filters.entityType}
          onChange={(entityType) => setFilters({ entityType })}
        />
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={(range) => setFilters(range)}
        />
      </div>
      {query.isPending ? (
        <TableSkeleton columns={5} />
      ) : query.isError ? (
        <ErrorState
          title="The audit log could not load"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="pr-4">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.data.map((log) => (
                <TableRow key={log.id} className="align-top">
                  <TableCell className="pl-4 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.actorEmail ?? <span className="text-muted-foreground">System</span>}
                  </TableCell>
                  <TableCell>
                    {AUDIT_ACTION_LABELS[log.action as keyof typeof AUDIT_ACTION_LABELS] ??
                      log.action}
                  </TableCell>
                  <TableCell>
                    <EntityCell log={log} />
                  </TableCell>
                  <TableCell className="min-w-64 pr-4">
                    <details>
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Show
                      </summary>
                      <div className="mt-2">
                        <JsonBlock
                          value={{ changes: log.changes, context: log.metadata }}
                          label={`Details of ${log.action}`}
                        />
                      </div>
                    </details>
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
          noun="entries"
          onPageChange={(page) => setFilters({ page })}
        />
      )}
    </div>
  );
};
