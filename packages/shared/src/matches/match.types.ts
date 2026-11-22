import type { MatchMethod, MatchStatus } from '../exceptions/exception.constants.js';
import type { TransactionDto } from '../transactions/transaction.types.js';

/** Why two records scored what they did; every signal is 0..1. */
export interface ScoreBreakdownDto {
  score: number;
  amount: number;
  customer: number;
  time: number;
  amountDifferenceMinor: number;
  timeDifferenceMinutes: number;
}

export interface MatchSummaryDto {
  id: string;
  method: MatchMethod;
  status: MatchStatus;
  /** 0..1. Exact and manual matches are 1. */
  confidence: number;
  scoreBreakdown: ScoreBreakdownDto | null;
  note: string | null;
  createdAt: string;
}

/** A record on the other side that could be the same payment, for manual matching. */
export interface MatchCandidateDto {
  transaction: TransactionDto;
  /** Both records carry the same reference id. */
  referenceMatches: boolean;
  /**
   * Scored with relaxed rules (wider window and tolerance) so a person can judge.
   * Null for a reference match too far apart to score.
   */
  breakdown: ScoreBreakdownDto | null;
}
