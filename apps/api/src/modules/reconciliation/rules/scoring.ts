import type { Transaction } from '../../../generated/prisma/client.js';
import {
  AMOUNT_SCORE_AT_TOLERANCE,
  SCORE_WEIGHTS,
  UNKNOWN_CUSTOMER_SCORE,
} from '../reconciliation.constants.js';
import type { MatchingRules, ScoreBreakdown } from '../reconciliation.types.js';

const BASIS_POINTS = 10_000n;
const MS_PER_MINUTE = 60_000;

const abs = (value: bigint): bigint => (value < 0n ? -value : value);
const max = (a: bigint, b: bigint): bigint => (a > b ? a : b);
const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

/** Allowed difference for an amount: the larger of the fixed and the relative tolerance. */
export const amountTolerance = (amountMinor: bigint, rules: MatchingRules): bigint =>
  max(
    BigInt(rules.amountToleranceMinor),
    (amountMinor * BigInt(rules.amountToleranceBps)) / BASIS_POINTS,
  );

export const amountDifference = (a: bigint, b: bigint): bigint => abs(a - b);

/** Tolerance is taken on the larger amount, so the check is symmetric. */
export const isAmountWithinTolerance = (a: bigint, b: bigint, rules: MatchingRules): boolean =>
  amountDifference(a, b) <= amountTolerance(max(a, b), rules);

export const minutesBetween = (a: Date, b: Date): number =>
  Math.abs(a.getTime() - b.getTime()) / MS_PER_MINUTE;

const amountSignal = (difference: bigint, tolerance: bigint): number => {
  if (difference === 0n) {
    return 1;
  }
  // Linear from 1 (identical) down to AMOUNT_SCORE_AT_TOLERANCE at the tolerance edge.
  return 1 - (1 - AMOUNT_SCORE_AT_TOLERANCE) * (Number(difference) / Number(tolerance));
};

const customerSignal = (a: string | null, b: string | null): number => {
  if (!a || !b) {
    return UNKNOWN_CUSTOMER_SCORE;
  }
  return a === b ? 1 : 0;
};

/**
 * Scores how likely two transactions from different sources are the same
 * payment. Returns null when they cannot be (different currency, amount outside
 * tolerance, or too far apart in time).
 */
export const scoreCandidate = (
  subject: Transaction,
  candidate: Transaction,
  rules: MatchingRules,
): ScoreBreakdown | null => {
  if (subject.currency !== candidate.currency) {
    return null;
  }
  const difference = amountDifference(subject.amountMinor, candidate.amountMinor);
  const tolerance = amountTolerance(max(subject.amountMinor, candidate.amountMinor), rules);
  if (difference > tolerance) {
    return null;
  }
  const minutes = minutesBetween(subject.occurredAt, candidate.occurredAt);
  if (minutes > rules.timeWindowMinutes) {
    return null;
  }

  const amount = amountSignal(difference, tolerance);
  const customer = customerSignal(subject.customerRef, candidate.customerRef);
  const time = 1 - minutes / rules.timeWindowMinutes;
  const score =
    SCORE_WEIGHTS.amount * amount + SCORE_WEIGHTS.customer * customer + SCORE_WEIGHTS.time * time;

  return {
    score: round4(score),
    amount: round4(amount),
    customer: round4(customer),
    time: round4(time),
    amountDifferenceMinor: Number(difference),
    timeDifferenceMinutes: round4(minutes),
  };
};
