import type { DashboardPeriod } from '@paritas/shared';
import type {
  AuditListParams,
  ExceptionListParams,
  RawEventListParams,
  ReportRangeParams,
  TransactionListParams,
  UserListParams,
} from '@/lib/api/endpoints/params';

/**
 * One place for cache keys. Hierarchical, so invalidating `exceptions.all`
 * refreshes every list, count and detail after a change.
 */
export const queryKeys = {
  exceptions: {
    all: ['exceptions'] as const,
    list: (params: ExceptionListParams) => ['exceptions', 'list', params] as const,
    stats: ['exceptions', 'stats'] as const,
    detail: (id: string) => ['exceptions', 'detail', id] as const,
    assignees: ['exceptions', 'assignees'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (params: TransactionListParams) => ['transactions', 'list', params] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    candidates: (id: string) => ['transactions', 'candidates', id] as const,
  },
  dashboard: (period: DashboardPeriod, timeZone: string) =>
    ['dashboard', period, timeZone] as const,
  summaryReport: (params: ReportRangeParams) => ['reports', 'summary', params] as const,
  matchingRules: ['settings', 'matching'] as const,
  sources: ['sources'] as const,
  users: (params: UserListParams) => ['users', params] as const,
  usersAll: ['users'] as const,
  auditLogs: (params: AuditListParams) => ['audit-logs', params] as const,
  rawEvents: {
    all: ['raw-events'] as const,
    list: (params: RawEventListParams) => ['raw-events', 'list', params] as const,
    detail: (id: string) => ['raw-events', 'detail', id] as const,
  },
};
