import { formatExceptionNumber } from '@paritas/shared';
import { Identifier } from '@/components/domain/identifier';
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
import { formatMinutes } from '@/lib/format/time';
import { cn } from '@/lib/utils';
import { SAMPLE_EXCEPTIONS } from './sample-data';

/**
 * The queue's row grammar: a severity edge down the left, the exception's
 * number and title together, figures right-aligned in tabular numerals.
 */
export const TableShowcase = () => (
  <div className="overflow-hidden rounded-md border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[38%] pl-4">Exception</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="pr-4 text-right">Open for</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SAMPLE_EXCEPTIONS.map((row) => {
          const closed = row.status === 'RESOLVED' || row.status === 'IGNORED';
          return (
            <TableRow key={row.number} className={cn(closed && 'text-muted-foreground')}>
              <TableCell className={cn('pl-4', !closed && SEVERITY_STYLES[row.severity].edge)}>
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium tabular-nums">
                    {formatExceptionNumber(row.number)}
                  </span>
                  <span className="truncate text-muted-foreground">{row.title}</span>
                </div>
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
              <TableCell>
                <Identifier value={row.reference} copyable />
              </TableCell>
              <TableCell className="text-right font-medium">
                <Money amountMinor={row.amountMinor} currency={row.currency} />
              </TableCell>
              <TableCell className="pr-4 text-right tabular-nums">
                {formatMinutes(row.openMinutes)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
