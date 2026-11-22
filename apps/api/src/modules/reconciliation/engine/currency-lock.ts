import type { Prisma } from '../../../generated/prisma/client.js';
import { LOCK_KEY_PREFIX } from '../reconciliation.constants.js';

/**
 * Serialises every decision about the given currencies (engine and people alike)
 * with Postgres transaction-scoped advisory locks, released at commit/rollback.
 * Locks are taken in sorted order so two callers can never deadlock.
 */
export const lockCurrencies = async (
  tx: Prisma.TransactionClient,
  currencies: Iterable<string>,
): Promise<void> => {
  for (const currency of [...new Set(currencies)].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${LOCK_KEY_PREFIX + currency}))`;
  }
};
