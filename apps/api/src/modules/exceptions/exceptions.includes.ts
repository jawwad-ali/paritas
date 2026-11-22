import { ExceptionTransactionRole, type Prisma } from '../../generated/prisma/client.js';
import { USER_SUMMARY_SELECT } from '../users/users.mapper.js';

/** Gateway first, then ledger; stable within a side. */
const BY_SIDE: Prisma.ExceptionTransactionOrderByWithRelationInput[] = [
  { transaction: { source: { kind: 'asc' } } },
  { transactionId: 'asc' },
];

export const EXCEPTION_LIST_INCLUDE = {
  assignee: { select: USER_SUMMARY_SELECT },
  resolvedBy: { select: USER_SUMMARY_SELECT },
  // Only the first record at issue: its amount is shown in the list.
  transactions: {
    where: { role: ExceptionTransactionRole.SUBJECT },
    orderBy: BY_SIDE,
    take: 1,
    select: { role: true, transaction: { select: { amountMinor: true, currency: true } } },
  },
} satisfies Prisma.ReconciliationExceptionInclude;

export const EXCEPTION_DETAIL_INCLUDE = {
  assignee: { select: USER_SUMMARY_SELECT },
  resolvedBy: { select: USER_SUMMARY_SELECT },
  // Subjects before context records (enum order), gateway before ledger.
  transactions: {
    orderBy: [{ role: 'asc' }, ...BY_SIDE],
    include: { transaction: { include: { source: true, match: true } } },
  },
  activities: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { actor: { select: USER_SUMMARY_SELECT } },
  },
} satisfies Prisma.ReconciliationExceptionInclude;

export type ExceptionListRow = Prisma.ReconciliationExceptionGetPayload<{
  include: typeof EXCEPTION_LIST_INCLUDE;
}>;
export type ExceptionDetailRow = Prisma.ReconciliationExceptionGetPayload<{
  include: typeof EXCEPTION_DETAIL_INCLUDE;
}>;
