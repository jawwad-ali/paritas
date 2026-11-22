import { type ExceptionDto, formatExceptionNumber } from '@paritas/shared';
import Link from 'next/link';
import { Money } from '@/components/domain/money';
import { SEVERITY_STYLES } from '@/components/domain/severity.config';
import { SeverityBadge } from '@/components/domain/severity-badge';
import { ExceptionStatusLabel, ExceptionTypeLabel } from '@/components/domain/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAge, formatDateTime } from '@/lib/format/time';
import { cn } from '@/lib/utils';

const isClosed = (row: ExceptionDto): boolean =>
  row.status === 'RESOLVED' || row.status === 'IGNORED';

const AgeCell = ({ row }: { row: ExceptionDto }) =>
  isClosed(row) && row.resolvedAt ? (
    <span title={formatDateTime(row.resolvedAt)}>Closed</span>
  ) : (
    <span title={`Detected ${formatDateTime(row.createdAt)}`}>{formatAge(row.createdAt)}</span>
  );

const href = (row: ExceptionDto): string => `/exceptions/${row.id}`;

/** Desktop: the queue as a table. The number links to the investigation; the whole row is the target. */
export const ExceptionTable = ({ rows }: { rows: ExceptionDto[] }) => (
  <div className="hidden overflow-hidden rounded-md border bg-card md:block">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[40%] pl-4">Exception</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="pr-4 text-right">Open for</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className={cn('relative', isClosed(row) && 'text-muted-foreground')}
          >
            <TableCell
              className={cn('max-w-0 pl-4', !isClosed(row) && SEVERITY_STYLES[row.severity].edge)}
            >
              <Link
                href={href(row)}
                className="flex min-w-0 flex-col outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
              >
                <span className="font-medium text-foreground tabular-nums">
                  {formatExceptionNumber(row.number)}
                </span>
                <span className="truncate text-muted-foreground">{row.title}</span>
              </Link>
            </TableCell>
            <TableCell>
              <SeverityBadge severity={row.severity} />
            </TableCell>
            <TableCell>
              <ExceptionTypeLabel type={row.type} />
            </TableCell>
            <TableCell>
              <ExceptionStatusLabel status={row.status} />
            </TableCell>
            <TableCell className="max-w-36 truncate">
              {row.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}
            </TableCell>
            <TableCell className="text-right font-medium">
              {row.amountMinor !== null && row.currency ? (
                <Money amountMinor={row.amountMinor} currency={row.currency} />
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell className="pr-4 text-right tabular-nums">
              <AgeCell row={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

/** Phone and small tablet: one card per exception, the same facts stacked. */
export const ExceptionCards = ({ rows }: { rows: ExceptionDto[] }) => (
  <ul className="space-y-2 md:hidden">
    {rows.map((row) => (
      <li key={row.id}>
        <Link
          href={href(row)}
          className="block space-y-2 rounded-md border bg-card p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium tabular-nums">{formatExceptionNumber(row.number)}</span>
            <SeverityBadge severity={row.severity} />
          </div>
          <p className="line-clamp-2 text-muted-foreground">{row.title}</p>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <ExceptionStatusLabel status={row.status} />
            <span className="tabular-nums">
              {row.amountMinor !== null && row.currency && (
                <Money
                  amountMinor={row.amountMinor}
                  currency={row.currency}
                  className="font-medium text-foreground"
                />
              )}{' '}
              · <AgeCell row={row} />
            </span>
          </div>
        </Link>
      </li>
    ))}
  </ul>
);
