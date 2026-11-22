import type {
  ExceptionSeverity,
  ExceptionType,
  MatchMethod,
} from '../exceptions/exception.constants.js';
import type { ExceptionDto } from '../exceptions/exception.types.js';
import type { SourceSummaryDto } from '../transactions/transaction.types.js';

/** A reporting window: whole days in `timeZone`, `to` exclusive. */
export interface PeriodDto {
  /** First day, inclusive (YYYY-MM-DD). */
  fromDate: string;
  /** Last day, inclusive (YYYY-MM-DD). */
  toDate: string;
  timeZone: string;
  /** The same window as instants (ISO-8601); `to` is exclusive. */
  from: string;
  to: string;
}

/** Records by reconciliation status. Match rate ignores EXCLUDED records (nothing to reconcile). */
export interface ReconciliationTotalsDto {
  total: number;
  matched: number;
  unmatched: number;
  exception: number;
  excluded: number;
  /** matched / (total − excluded), 0..1; null when there is nothing to reconcile. */
  matchRate: number | null;
}

export interface SourceTotalsDto extends ReconciliationTotalsDto {
  source: SourceSummaryDto;
}

/** Successful gateway payments, per currency (amounts in different currencies never add up). */
export interface VolumeDto {
  currency: string;
  amountMinor: number;
  count: number;
}

export interface TrendPointDto {
  /** Day in the period's time zone (YYYY-MM-DD). */
  date: string;
  transactions: number;
  matched: number;
  matchRate: number | null;
  exceptionsOpened: number;
  exceptionsClosed: number;
}

/** Exceptions detected and closed within the period. */
export interface ExceptionFlowDto {
  opened: number;
  openedByType: Record<ExceptionType, number>;
  openedBySeverity: Record<ExceptionSeverity, number>;
  resolved: number;
  ignored: number;
  /** Resolved by the matching engine because the records came to agree. */
  autoResolved: number;
  /** Median time from detection to closure, for exceptions closed in the period. */
  medianHoursToClose: number | null;
}

/** What is waiting for people right now, regardless of period. */
export interface OpenExceptionsDto {
  total: number;
  critical: number;
  unassigned: number;
  bySeverity: Record<ExceptionSeverity, number>;
  byType: Record<ExceptionType, number>;
}

export interface DashboardOverviewDto {
  period: PeriodDto;
  transactions: ReconciliationTotalsDto;
  bySource: SourceTotalsDto[];
  volume: VolumeDto[];
  exceptionFlow: ExceptionFlowDto;
  openExceptions: OpenExceptionsDto;
  trend: TrendPointDto[];
  /** The most urgent open exceptions (severity, then age). */
  priorityExceptions: ExceptionDto[];
}

export interface ReconciliationSummaryDto {
  period: PeriodDto;
  generatedAt: string;
  transactions: ReconciliationTotalsDto;
  bySource: SourceTotalsDto[];
  volume: VolumeDto[];
  /** Matches made in the period, by how they were made. */
  matchesByMethod: Record<MatchMethod, number>;
  exceptionFlow: ExceptionFlowDto;
  /** Exceptions detected in the period that are still open. */
  stillOpen: number;
  daily: TrendPointDto[];
}
