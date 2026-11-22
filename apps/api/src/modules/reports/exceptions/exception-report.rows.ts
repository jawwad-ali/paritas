import {
  ExceptionStatus,
  ExceptionTransactionRole,
  type Prisma,
  SourceKind,
} from '../../../generated/prisma/client.js';
import { toSafeNumber } from '../../transactions/transactions.mapper.js';
import type { ExceptionReportRow } from '../reports.types.js';

export const MATCHING_ENGINE_LABEL = 'Matching engine';
const MS_PER_HOUR = 3_600_000;

export const EXCEPTION_REPORT_INCLUDE = {
  assignee: { select: { name: true } },
  resolvedBy: { select: { name: true } },
  transactions: {
    orderBy: [{ role: 'asc' }, { transactionId: 'asc' }],
    include: { transaction: { include: { source: { select: { kind: true } } } } },
  },
} satisfies Prisma.ReconciliationExceptionInclude;

type ReportSource = Prisma.ReconciliationExceptionGetPayload<{
  include: typeof EXCEPTION_REPORT_INCLUDE;
}>;

const closedBy = (row: ReportSource): string | null => {
  if (row.resolvedBy) {
    return row.resolvedBy.name;
  }
  return row.status === ExceptionStatus.RESOLVED ? MATCHING_ENGINE_LABEL : null;
};

export const toExceptionReportRow = (row: ReportSource, now: Date): ExceptionReportRow => {
  const records = (kind: SourceKind): string[] =>
    row.transactions
      .filter((link) => link.transaction.source.kind === kind)
      .map((link) => link.transaction.externalId);
  const primary = row.transactions.find(
    (link) => link.role === ExceptionTransactionRole.SUBJECT,
  )?.transaction;
  const end = row.resolvedAt ?? now;
  return {
    number: row.number,
    type: row.type,
    severity: row.severity,
    status: row.status,
    title: row.title,
    amountMinor: primary ? toSafeNumber(primary.amountMinor) : null,
    currency: primary?.currency ?? null,
    gatewayRecords: records(SourceKind.PAYMENT_GATEWAY),
    ledgerRecords: records(SourceKind.INTERNAL_LEDGER),
    detectedAt: row.createdAt,
    closedAt: row.resolvedAt,
    closedBy: closedBy(row),
    resolutionReason: row.resolutionReason,
    assignee: row.assignee?.name ?? null,
    hoursOpen: Math.round(((end.getTime() - row.createdAt.getTime()) / MS_PER_HOUR) * 10) / 10,
  };
};
