import type { TransactionDto } from '@paritas/shared';
import { Identifier } from '@/components/domain/identifier';
import { Money } from '@/components/domain/money';
import { SourceLabel } from '@/components/domain/source-label';
import { TRANSACTION_STATUS_LABELS } from '@/components/domain/status.config';
import { ReconciliationStatusBadge } from '@/components/domain/status-badges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format/time';

interface TransactionTableProps {
  rows: TransactionDto[];
  onOpen: (id: string) => void;
}

/** Records from both sources in one normalised list; a row opens the full record. */
export const TransactionTable = ({ rows, onOpen }: TransactionTableProps) => (
  <>
    <div className="hidden overflow-hidden rounded-md border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Record</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Paid at</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reconciliation</TableHead>
            <TableHead className="pr-4 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="relative">
              <TableCell className="max-w-0 pl-4">
                <button
                  type="button"
                  onClick={() => onOpen(row.id)}
                  className="flex w-full min-w-0 flex-col text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                >
                  <Identifier value={row.externalId} />
                  <span className="truncate text-xs text-muted-foreground">
                    {row.customerRef ?? 'No customer on record'}
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <SourceLabel name={row.source.name} kind={row.source.kind} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(row.occurredAt)}
              </TableCell>
              <TableCell>{TRANSACTION_STATUS_LABELS[row.status]}</TableCell>
              <TableCell>
                <ReconciliationStatusBadge status={row.reconciliationStatus} />
              </TableCell>
              <TableCell className="pr-4 text-right font-medium">
                <Money amountMinor={row.amountMinor} currency={row.currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <ul className="space-y-2 md:hidden">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => onOpen(row.id)}
            className="block w-full space-y-1.5 rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex items-center justify-between gap-2">
              <Identifier value={row.externalId} />
              <Money
                amountMinor={row.amountMinor}
                currency={row.currency}
                className="font-medium"
              />
            </span>
            <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {row.source.name} · {formatDateTime(row.occurredAt)}
              </span>
              <ReconciliationStatusBadge status={row.reconciliationStatus} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  </>
);
