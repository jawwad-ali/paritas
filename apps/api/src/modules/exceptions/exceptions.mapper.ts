import type {
  ExceptionActivityDto,
  ExceptionDetailDto,
  ExceptionDto,
  ExceptionTransactionDto,
} from '@paritas/shared';
import {
  ExceptionTransactionRole,
  type ReconciliationException,
} from '../../generated/prisma/client.js';
import { toMatchSummaryDto } from '../reconciliation/match.mapper.js';
import { toSafeNumber, toTransactionDto } from '../transactions/transactions.mapper.js';
import { toUserSummaryDto } from '../users/users.mapper.js';
import type { ExceptionDetailRow, ExceptionListRow } from './exceptions.includes.js';

type PrimaryAmount = { amountMinor: bigint; currency: string } | undefined;
type ExceptionBase = ReconciliationException & Pick<ExceptionListRow, 'assignee' | 'resolvedBy'>;

const toExceptionBaseDto = (row: ExceptionBase, primary: PrimaryAmount): ExceptionDto => ({
  id: row.id,
  number: row.number,
  type: row.type,
  severity: row.severity,
  status: row.status,
  title: row.title,
  amountMinor: primary ? toSafeNumber(primary.amountMinor) : null,
  currency: primary?.currency ?? null,
  assignee: row.assignee ? toUserSummaryDto(row.assignee) : null,
  resolvedBy: row.resolvedBy ? toUserSummaryDto(row.resolvedBy) : null,
  resolvedAt: row.resolvedAt?.toISOString() ?? null,
  resolutionReason: row.resolutionReason,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toExceptionDto = (row: ExceptionListRow): ExceptionDto =>
  toExceptionBaseDto(row, row.transactions[0]?.transaction);

const toExceptionTransactionDto = (
  link: ExceptionDetailRow['transactions'][number],
): ExceptionTransactionDto => ({
  role: link.role,
  transaction: toTransactionDto(link.transaction),
  match: link.transaction.match ? toMatchSummaryDto(link.transaction.match) : null,
});

const toActivityDto = (
  activity: ExceptionDetailRow['activities'][number],
): ExceptionActivityDto => ({
  id: activity.id,
  type: activity.type,
  actor: activity.actor ? toUserSummaryDto(activity.actor) : null,
  message: activity.message,
  data: activity.data,
  createdAt: activity.createdAt.toISOString(),
});

export const toExceptionDetailDto = (row: ExceptionDetailRow): ExceptionDetailDto => {
  const primary = row.transactions.find(
    (link) => link.role === ExceptionTransactionRole.SUBJECT,
  )?.transaction;
  return {
    ...toExceptionBaseDto(row, primary),
    details: row.details,
    transactions: row.transactions.map(toExceptionTransactionDto),
    activities: row.activities.map(toActivityDto),
  };
};
