import {
  type ExceptionDetailDto,
  type ExceptionTransactionDto,
  formatMoney,
  type TransactionDto,
} from '@paritas/shared';
import { TRANSACTION_STATUS_LABELS } from '@/components/domain/status.config';
import { formatDateTime } from '@/lib/format/time';

export type FieldState = 'agree' | 'differ' | 'none';

export interface ComparedField {
  label: string;
  gateway: string | null;
  ledger: string | null;
  state: FieldState;
  /** Why the field differs, e.g. "Differs by $147.97". */
  note?: string;
}

export interface Sides {
  gateway: ExceptionTransactionDto[];
  ledger: ExceptionTransactionDto[];
}

/** Records grouped by side; subjects come first (the API orders them so). */
export const splitSides = (exception: ExceptionDetailDto): Sides => ({
  gateway: exception.transactions.filter(
    (link) => link.transaction.source.kind === 'PAYMENT_GATEWAY',
  ),
  ledger: exception.transactions.filter(
    (link) => link.transaction.source.kind === 'INTERNAL_LEDGER',
  ),
});

const MINUTE_MS = 60_000;

const compare = (a: string | null, b: string | null): FieldState =>
  a === null || b === null ? 'none' : a === b ? 'agree' : 'differ';

/** The two primary records, field by field, the way an officer checks them by eye. */
export const compareRecords = (
  gateway: TransactionDto | undefined,
  ledger: TransactionDto | undefined,
): ComparedField[] => {
  const g = gateway ?? null;
  const l = ledger ?? null;
  const money = (txn: TransactionDto | null): string | null =>
    txn ? formatMoney(txn.amountMinor, txn.currency) : null;

  const amountState = compare(g && String(g.amountMinor), l && String(l.amountMinor));
  const minutesApart =
    g && l
      ? Math.round(Math.abs(Date.parse(g.occurredAt) - Date.parse(l.occurredAt)) / MINUTE_MS)
      : null;

  return [
    {
      label: 'Reference',
      gateway: g?.reference ?? null,
      ledger: l?.reference ?? null,
      state: compare(g?.reference ?? null, l?.reference ?? null),
    },
    {
      label: 'Amount',
      gateway: money(g),
      ledger: money(l),
      state: amountState,
      note:
        amountState === 'differ' && g && l && g.currency === l.currency
          ? `Differs by ${formatMoney(Math.abs(g.amountMinor - l.amountMinor), g.currency)}`
          : undefined,
    },
    {
      label: 'Currency',
      gateway: g?.currency ?? null,
      ledger: l?.currency ?? null,
      state: compare(g?.currency ?? null, l?.currency ?? null),
    },
    {
      label: 'Status',
      gateway: g ? TRANSACTION_STATUS_LABELS[g.status] : null,
      ledger: l ? TRANSACTION_STATUS_LABELS[l.status] : null,
      state: compare(g?.status ?? null, l?.status ?? null),
    },
    {
      label: 'Customer',
      gateway: g?.customerRef ?? null,
      ledger: l?.customerRef ?? null,
      state: compare(g?.customerRef ?? null, l?.customerRef ?? null),
    },
    {
      label: 'Paid at',
      gateway: g ? formatDateTime(g.occurredAt) : null,
      ledger: l ? formatDateTime(l.occurredAt) : null,
      state: 'none',
      note: minutesApart !== null ? `${minutesApart} min apart` : undefined,
    },
  ];
};
