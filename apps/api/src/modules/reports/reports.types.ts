import type { ExceptionSeverity, ExceptionStatus, ExceptionType } from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';

/** Who generated a report, printed on it. */
export type ReportAuthor = Pick<RequestActor, 'email'>;

/** One line of the exception report, shared by the CSV and PDF renderers. */
export interface ExceptionReportRow {
  number: number;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  amountMinor: number | null;
  currency: string | null;
  /** External ids of the gateway-side records involved. */
  gatewayRecords: string[];
  ledgerRecords: string[];
  detectedAt: Date;
  closedAt: Date | null;
  /** A person's name, "Matching engine" for an automatic resolution, or null while open. */
  closedBy: string | null;
  resolutionReason: string | null;
  assignee: string | null;
  /** Detection to closure, or to the report time while still open. */
  hoursOpen: number;
}
