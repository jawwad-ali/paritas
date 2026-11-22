import type {
  MatchCandidateDto,
  Paginated,
  TransactionDetailDto,
  TransactionDto,
} from '@paritas/shared';
import { apiRequest } from '../api-client';
import type { TransactionListParams } from './params';

export const listTransactions = (
  params: TransactionListParams,
  signal?: AbortSignal,
): Promise<Paginated<TransactionDto>> =>
  apiRequest('/transactions', { query: { ...params }, signal });

export const getTransaction = (id: string, signal?: AbortSignal): Promise<TransactionDetailDto> =>
  apiRequest(`/transactions/${id}`, { signal });

export const listMatchCandidates = (
  id: string,
  signal?: AbortSignal,
): Promise<MatchCandidateDto[]> => apiRequest(`/transactions/${id}/match-candidates`, { signal });
