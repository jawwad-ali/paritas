import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_SORTS,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_TYPES,
  type ExceptionSeverity,
  type ExceptionSort,
  type ExceptionStatsDto,
  type ExceptionType,
  SOURCE_CODES,
  type SourceCode,
} from '@paritas/shared';
import type { ExceptionListParams } from '@/lib/api/endpoints/params';
import { readEnum, readEnumList, readPage, readString } from '@/lib/url/search-params';

/** The queue's tabs: each is a fixed slice of status and ownership. */
export const QUEUE_VIEWS = ['open', 'mine', 'unassigned', 'closed', 'all'] as const;
export type QueueView = (typeof QUEUE_VIEWS)[number];

export const QUEUE_VIEW_LABELS: Record<QueueView, string> = {
  open: 'Open',
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
  closed: 'Closed',
  all: 'All',
};

export interface QueueFilters {
  view: QueueView;
  type?: ExceptionType[];
  severity?: ExceptionSeverity[];
  source?: SourceCode;
  search?: string;
  sort: ExceptionSort;
  page: number;
}

const SOURCE_VALUES = Object.values(SOURCE_CODES);

export const parseQueueFilters = (params: URLSearchParams): QueueFilters => ({
  view: readEnum(params, 'view', QUEUE_VIEWS) ?? 'open',
  type: readEnumList(params, 'type', EXCEPTION_TYPES),
  severity: readEnumList(params, 'severity', EXCEPTION_SEVERITIES),
  source: readEnum(params, 'source', SOURCE_VALUES),
  search: readString(params, 'search'),
  sort: readEnum(params, 'sort', EXCEPTION_SORTS) ?? 'priority',
  page: readPage(params),
});

const VIEW_PARAMS: Record<QueueView, Pick<ExceptionListParams, 'status' | 'assignee'>> = {
  open: { status: ['OPEN', 'INVESTIGATING'] },
  mine: { status: ['OPEN', 'INVESTIGATING'], assignee: 'me' },
  unassigned: { status: ['OPEN', 'INVESTIGATING'], assignee: 'unassigned' },
  closed: { status: ['RESOLVED', 'IGNORED'] },
  all: {},
};

export const toListParams = ({ view, ...rest }: QueueFilters): ExceptionListParams => ({
  ...rest,
  ...VIEW_PARAMS[view],
});

/** Tab badge counts, from the stats endpoint. */
export const viewCount = (view: QueueView, stats: ExceptionStatsDto): number | undefined => {
  const open = stats.byStatus.OPEN + stats.byStatus.INVESTIGATING;
  const counts: Record<QueueView, number | undefined> = {
    open,
    mine: stats.openAssignedToMe,
    unassigned: stats.openUnassigned,
    closed: stats.byStatus.RESOLVED + stats.byStatus.IGNORED,
    all: undefined,
  };
  return counts[view];
};

export const SEVERITY_LABELS: Record<ExceptionSeverity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const SORT_LABELS: Record<ExceptionSort, string> = {
  priority: 'Most urgent first',
  newest: 'Newest first',
  oldest: 'Oldest first',
};

export const SOURCE_LABELS: Record<SourceCode, string> = {
  stripe: 'Stripe',
  internal_ledger: 'Internal ledger',
};

export const TYPE_LABELS: Record<ExceptionType, string> = EXCEPTION_TYPE_LABELS;
/** Most severe first, the order people scan in. */
export const SEVERITY_OPTIONS = [...EXCEPTION_SEVERITIES].reverse() as ExceptionSeverity[];
