'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { JsonBlock } from '@/components/data/json-block';
import { Identifier } from '@/components/domain/identifier';
import { Money } from '@/components/domain/money';
import { SourceLabel } from '@/components/domain/source-label';
import { TRANSACTION_STATUS_LABELS } from '@/components/domain/status.config';
import { ReconciliationStatusBadge } from '@/components/domain/status-badges';
import { ErrorState } from '@/components/layout/error-state';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format/time';
import { useTransaction } from '../use-transaction-queries';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </div>
);

interface TransactionSheetProps {
  id: string | undefined;
  onClose: () => void;
}

/** One record in full, with the raw event its source sent, side panel over the list. */
export const TransactionSheet = ({ id, onClose }: TransactionSheetProps) => {
  const query = useTransaction(id);
  const txn = query.data;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{txn ? txn.externalId : 'Transaction'}</SheetTitle>
          <SheetDescription>
            {txn ? `${txn.source.name} record` : 'Loading the record'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {query.isPending ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-6" />
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState
              title="The record could not load"
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : txn ? (
            <>
              <dl className="divide-y text-sm">
                <Row label="Source">
                  <SourceLabel name={txn.source.name} kind={txn.source.kind} />
                </Row>
                <Row label="External id">
                  <Identifier value={txn.externalId} copyable />
                </Row>
                <Row label="Reference">
                  {txn.reference ? <Identifier value={txn.reference} copyable /> : '—'}
                </Row>
                <Row label="Amount">
                  <Money
                    amountMinor={txn.amountMinor}
                    currency={txn.currency}
                    className="font-medium"
                  />
                </Row>
                <Row label="Status">{TRANSACTION_STATUS_LABELS[txn.status]}</Row>
                <Row label="Reconciliation">
                  <ReconciliationStatusBadge status={txn.reconciliationStatus} />
                </Row>
                <Row label="Customer">{txn.customerRef ?? '—'}</Row>
                <Row label="Paid at">{formatDateTime(txn.occurredAt)}</Row>
                <Row label="Last source event">{formatDateTime(txn.lastEventAt)}</Row>
              </dl>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/exceptions?view=all&search=${encodeURIComponent(txn.reference ?? txn.externalId)}`}
                >
                  Exceptions for this payment
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
              {txn.latestRawEvent && (
                <section className="space-y-2">
                  <h3 className="text-sm font-bold">Raw event as received</h3>
                  <p className="text-xs text-muted-foreground">
                    {txn.latestRawEvent.eventType} · received{' '}
                    {formatDateTime(txn.latestRawEvent.receivedAt)}
                  </p>
                  <JsonBlock value={txn.latestRawEvent.payload} label="Raw event payload" />
                </section>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
