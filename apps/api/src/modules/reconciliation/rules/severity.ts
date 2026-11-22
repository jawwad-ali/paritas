import { ExceptionSeverity } from '../../../generated/prisma/client.js';
import {
  HIGH_VALUE_MINOR,
  LARGE_AMOUNT_DIFFERENCE_MINOR,
  LARGE_AMOUNT_DIFFERENCE_RATIO,
} from '../reconciliation.constants.js';

const ORDER: readonly ExceptionSeverity[] = [
  ExceptionSeverity.LOW,
  ExceptionSeverity.MEDIUM,
  ExceptionSeverity.HIGH,
  ExceptionSeverity.CRITICAL,
];

/** High-value payments are escalated one level: they matter more to the books. */
export const escalateForValue = (
  severity: ExceptionSeverity,
  amountMinor: bigint,
): ExceptionSeverity => {
  if (amountMinor < HIGH_VALUE_MINOR) {
    return severity;
  }
  const next = ORDER[Math.min(ORDER.indexOf(severity) + 1, ORDER.length - 1)];
  return next ?? severity;
};

export const amountMismatchSeverity = (
  differenceMinor: bigint,
  amountMinor: bigint,
): ExceptionSeverity => {
  const ratio = amountMinor === 0n ? 1 : Number(differenceMinor) / Number(amountMinor);
  return differenceMinor >= LARGE_AMOUNT_DIFFERENCE_MINOR || ratio >= LARGE_AMOUNT_DIFFERENCE_RATIO
    ? ExceptionSeverity.HIGH
    : ExceptionSeverity.MEDIUM;
};
