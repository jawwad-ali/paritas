import type { MatchSummaryDto } from '../matches/match.types.js';
import type { TransactionDto } from '../transactions/transaction.types.js';
import type { UserSummaryDto } from '../users/user.types.js';
import type {
  ExceptionActivityType,
  ExceptionSeverity,
  ExceptionStatus,
  ExceptionTransactionRole,
  ExceptionType,
} from './exception.constants.js';

export interface ExceptionDto {
  id: string;
  /** Human-friendly sequence; render with `formatExceptionNumber` (EX-1042). */
  number: number;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  /** Amount of the first record at issue, for display and scanning. */
  amountMinor: number | null;
  currency: string | null;
  assignee: UserSummaryDto | null;
  /** Null with a RESOLVED status means the matching engine closed it. */
  resolvedBy: UserSummaryDto | null;
  resolvedAt: string | null;
  resolutionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExceptionTransactionDto {
  role: ExceptionTransactionRole;
  transaction: TransactionDto;
  /** The match this record belongs to, if any. */
  match: MatchSummaryDto | null;
}

export interface ExceptionActivityDto {
  id: string;
  type: ExceptionActivityType;
  /** Null when the matching engine acted. */
  actor: UserSummaryDto | null;
  message: string | null;
  data: unknown;
  createdAt: string;
}

export interface ExceptionDetailDto extends ExceptionDto {
  /** Type-specific facts captured at detection (amounts, scores, snapshots). */
  details: unknown;
  transactions: ExceptionTransactionDto[];
  /** Oldest first: the investigation timeline. */
  activities: ExceptionActivityDto[];
}

/** Counts for queue tabs and badges. */
export interface ExceptionStatsDto {
  byStatus: Record<ExceptionStatus, number>;
  openBySeverity: Record<ExceptionSeverity, number>;
  openByType: Record<ExceptionType, number>;
  openAssignedToMe: number;
  openUnassigned: number;
}
