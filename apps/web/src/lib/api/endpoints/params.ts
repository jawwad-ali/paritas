import type {
  ExceptionSeverity,
  ExceptionSort,
  ExceptionStatus,
  ExceptionType,
  RawEventStatus,
  ReconciliationStatus,
  SourceCode,
  TransactionStatus,
  UserRole,
} from '@paritas/shared';

/** Query parameters as the browser sends them (strings and lists; the API validates). */
interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface ExceptionListParams extends PageParams {
  status?: ExceptionStatus[];
  type?: ExceptionType[];
  severity?: ExceptionSeverity[];
  /** `me`, `unassigned` or a user id. */
  assignee?: string;
  source?: SourceCode;
  from?: string;
  to?: string;
  search?: string;
  sort?: ExceptionSort;
}

export interface TransactionListParams extends PageParams {
  source?: SourceCode;
  status?: TransactionStatus;
  reconciliationStatus?: ReconciliationStatus;
  from?: string;
  to?: string;
  search?: string;
}

export interface RawEventListParams extends PageParams {
  source?: SourceCode;
  status?: RawEventStatus;
  eventType?: string;
}

export interface UserListParams extends PageParams {
  search?: string;
  role?: UserRole;
  isActive?: 'true' | 'false';
}

export interface AuditListParams extends PageParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

/** Reports cover whole days (YYYY-MM-DD, inclusive) in a time zone. */
export interface ReportRangeParams {
  from: string;
  to: string;
  timeZone: string;
}

export interface ExceptionReportParams extends ReportRangeParams {
  status?: ExceptionStatus[];
  type?: ExceptionType[];
  severity?: ExceptionSeverity[];
  source?: SourceCode;
}
