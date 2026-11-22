import type { DashboardOverviewDto } from '@paritas/shared';
import { Money } from '@/components/domain/money';
import { SourceLabel } from '@/components/domain/source-label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const NUMBER = new Intl.NumberFormat('en-US');
const PERCENT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

/** Each side of the reconciliation, and money that moved, per currency (never summed across). */
export const SourcesPanel = ({ overview }: { overview: DashboardOverviewDto }) => (
  <section
    aria-label="Sources and volume"
    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]"
  >
    <div className="overflow-x-auto rounded-md border bg-card">
      <h2 className="border-b px-4 py-3 text-sm font-bold">By source</h2>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Source</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead className="text-right">Matched</TableHead>
            <TableHead className="text-right">In exception</TableHead>
            <TableHead className="pr-4 text-right">Match rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overview.bySource.map((row) => (
            <TableRow key={row.source.id}>
              <TableCell className="pl-4">
                <SourceLabel name={row.source.name} kind={row.source.kind} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{NUMBER.format(row.total)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {NUMBER.format(row.matched)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {NUMBER.format(row.exception)}
              </TableCell>
              <TableCell className="pr-4 text-right font-medium tabular-nums">
                {row.matchRate === null ? '—' : PERCENT.format(row.matchRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="space-y-3 rounded-md border bg-card p-4">
      <h2 className="text-sm font-bold">Successful payments</h2>
      {overview.volume.length === 0 ? (
        <p className="text-muted-foreground">No successful gateway payments in this period.</p>
      ) : (
        <dl className="space-y-3">
          {overview.volume.map((row) => (
            <div key={row.currency} className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted-foreground">
                {row.currency} · {NUMBER.format(row.count)} payments
              </dt>
              <dd className="text-lg font-medium">
                <Money amountMinor={row.amountMinor} currency={row.currency} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  </section>
);
