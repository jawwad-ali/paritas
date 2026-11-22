import { TransactionStatus } from '../../../generated/prisma/client.js';
import type { MatchingRules, Pair, PairVerdict } from '../reconciliation.types.js';
import { amountDifference, isAmountWithinTolerance } from './scoring.js';

/**
 * Decides whether two records of the same payment agree. Checks run from the
 * most to the least fundamental difference, and the first one found wins.
 */
export const comparePair = ({ gateway, ledger }: Pair, rules: MatchingRules): PairVerdict => {
  if (gateway.currency !== ledger.currency) {
    return { kind: 'currency_mismatch' };
  }
  // A side still in flight is not a disagreement yet; time decides (DELAYED).
  if (gateway.status === TransactionStatus.PENDING || ledger.status === TransactionStatus.PENDING) {
    return { kind: 'pending' };
  }
  if (gateway.status !== ledger.status) {
    return { kind: 'status_conflict' };
  }
  if (!isAmountWithinTolerance(gateway.amountMinor, ledger.amountMinor, rules)) {
    return {
      kind: 'amount_mismatch',
      differenceMinor: amountDifference(gateway.amountMinor, ledger.amountMinor),
    };
  }
  return { kind: 'agree' };
};
