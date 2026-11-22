import type { Prisma } from '../../generated/prisma/client.js';

/** An exception as read under its currency locks: the basis for every workflow decision. */
export type LockedException = Prisma.ReconciliationExceptionGetPayload<{
  include: { transactions: { select: { transactionId: true; role: true } } };
}>;

/** Optional free-text fields that accompany a status change. */
export interface TransitionInput {
  reason?: string;
  note?: string;
}
