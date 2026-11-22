import {
  MANUAL_REVIEW_TOLERANCE_BPS,
  MANUAL_REVIEW_WINDOW_MINUTES,
} from '../reconciliation.constants.js';
import type { MatchingRules } from '../reconciliation.types.js';

/** The engine's rules, widened for a person's judgement (see MANUAL_REVIEW_* constants). */
export const relaxForReview = (rules: MatchingRules): MatchingRules => ({
  ...rules,
  timeWindowMinutes: Math.max(rules.timeWindowMinutes, MANUAL_REVIEW_WINDOW_MINUTES),
  amountToleranceBps: Math.max(rules.amountToleranceBps, MANUAL_REVIEW_TOLERANCE_BPS),
});
