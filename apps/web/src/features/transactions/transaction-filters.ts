import {
  RECONCILIATION_STATUSES,
  type ReconciliationStatus,
  SOURCE_CODES,
  type SourceCode,
  TRANSACTION_STATUSES,
  type TransactionStatus,
} from '@paritas/shared';
import { dayRangeToInstants } from '@/components/data/date-range-filter';
import {
  RECONCILIATION_STATUS_STYLES,
  TRANSACTION_STATUS_LABELS,
} from '@/components/domain/status.config';
import type { TransactionListParams } from '@/lib/api/endpoints/params';
import { readEnum, readPage, readString } from '@/lib/url/search-params';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export interface TransactionFilters {
  source?: SourceCode;
  status?: TransactionStatus;
  reconciliationStatus?: ReconciliationStatus;
  /** Calendar days (YYYY-MM-DD) in the viewer's time zone. */
  from?: string;
  to?: string;
  search?: string;
  /** The record open in the detail panel. */
  id?: string;
  page: number;
}

const readDay = (params: URLSearchParams, key: string): string | undefined => {
  const value = params.get(key);
  return value && DAY.test(value) ? value : undefined;
};

export const parseTransactionFilters = (params: URLSearchParams): TransactionFilters => ({
  source: readEnum(params, 'source', Object.values(SOURCE_CODES)),
  status: readEnum(params, 'status', TRANSACTION_STATUSES),
  reconciliationStatus: readEnum(params, 'reconciliationStatus', RECONCILIATION_STATUSES),
  from: readDay(params, 'from'),
  to: readDay(params, 'to'),
  search: readString(params, 'search'),
  id: readString(params, 'id'),
  page: readPage(params),
});

/** The API's list parameters: days become instants; the open record (`id`) is UI state only. */
export const toTransactionParams = (filters: TransactionFilters): TransactionListParams => ({
  source: filters.source,
  status: filters.status,
  reconciliationStatus: filters.reconciliationStatus,
  search: filters.search,
  page: filters.page,
  ...dayRangeToInstants(filters.from, filters.to),
});

export const RECONCILIATION_LABELS: Record<ReconciliationStatus, string> = Object.fromEntries(
  RECONCILIATION_STATUSES.map((status) => [status, RECONCILIATION_STATUS_STYLES[status].label]),
) as Record<ReconciliationStatus, string>;

export { TRANSACTION_STATUS_LABELS };
