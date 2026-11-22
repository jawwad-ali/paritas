import { z } from 'zod';
import type { UserSummaryDto } from '../users/user.types.js';

/**
 * Bounds for editable matching rules. The database enforces the hard limits;
 * these add product guardrails (e.g. auto-matching below 0.5 is never sensible).
 */
export const MATCHING_CONFIG_LIMITS = {
  amountToleranceMinor: { min: 0, max: 1_000_000 },
  amountToleranceBps: { min: 0, max: 10_000 },
  timeWindowMinutes: { min: 1, max: 7 * 24 * 60 },
  autoMatchThreshold: { min: 0.5, max: 1 },
  candidateThreshold: { min: 0, max: 1 },
  missingAfterMinutes: { min: 1, max: 30 * 24 * 60 },
} as const;

export interface MatchingConfigDto {
  /** Absolute amount tolerance in minor units (absorbs fixed fees). */
  amountToleranceMinor: number;
  /** Relative amount tolerance in basis points (100 bps = 1%). */
  amountToleranceBps: number;
  /** Max distance between the two sides' timestamps for a fuzzy match. */
  timeWindowMinutes: number;
  /** Fuzzy matches scoring at or above this are confirmed automatically. */
  autoMatchThreshold: number;
  /** Fuzzy matches below this are not proposed at all. */
  candidateThreshold: number;
  /** A one-sided record older than this becomes MISSING. */
  missingAfterMinutes: number;
  updatedBy: UserSummaryDto | null;
  updatedAt: string;
}

const bounded = (limits: { min: number; max: number }, integer: boolean) =>
  (integer ? z.number().int() : z.number()).min(limits.min).max(limits.max);

const L = MATCHING_CONFIG_LIMITS;

export const updateMatchingConfigRequestSchema = z
  .object({
    amountToleranceMinor: bounded(L.amountToleranceMinor, true).optional(),
    amountToleranceBps: bounded(L.amountToleranceBps, true).optional(),
    timeWindowMinutes: bounded(L.timeWindowMinutes, true).optional(),
    autoMatchThreshold: bounded(L.autoMatchThreshold, false).optional(),
    candidateThreshold: bounded(L.candidateThreshold, false).optional(),
    missingAfterMinutes: bounded(L.missingAfterMinutes, true).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one rule to update.',
  })
  .refine(
    ({ autoMatchThreshold, candidateThreshold }) =>
      autoMatchThreshold === undefined ||
      candidateThreshold === undefined ||
      candidateThreshold <= autoMatchThreshold,
    {
      path: ['candidateThreshold'],
      message: 'The candidate threshold cannot be above the auto-match threshold.',
    },
  );
export type UpdateMatchingConfigRequest = z.infer<typeof updateMatchingConfigRequestSchema>;
