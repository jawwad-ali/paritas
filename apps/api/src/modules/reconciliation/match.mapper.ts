import type { MatchSummaryDto, ScoreBreakdownDto } from '@paritas/shared';
import type { Match } from '../../generated/prisma/client.js';

const BREAKDOWN_KEYS = [
  'score',
  'amount',
  'customer',
  'time',
  'amountDifferenceMinor',
  'timeDifferenceMinutes',
] as const satisfies ReadonlyArray<keyof ScoreBreakdownDto>;

const isScoreBreakdown = (value: unknown): value is ScoreBreakdownDto =>
  typeof value === 'object' &&
  value !== null &&
  BREAKDOWN_KEYS.every((key) => typeof (value as Record<string, unknown>)[key] === 'number');

/** Stored JSON is checked, not trusted: a malformed breakdown is shown as absent. */
export const toScoreBreakdownDto = (value: unknown): ScoreBreakdownDto | null => {
  if (!isScoreBreakdown(value)) {
    return null;
  }
  const { score, amount, customer, time, amountDifferenceMinor, timeDifferenceMinutes } = value;
  return { score, amount, customer, time, amountDifferenceMinor, timeDifferenceMinutes };
};

export const toMatchSummaryDto = (match: Match): MatchSummaryDto => ({
  id: match.id,
  method: match.method,
  status: match.status,
  confidence: match.confidence,
  scoreBreakdown: toScoreBreakdownDto(match.scoreBreakdown),
  note: match.note,
  createdAt: match.createdAt.toISOString(),
});
