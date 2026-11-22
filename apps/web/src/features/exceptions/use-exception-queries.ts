'use client';

import type { ExceptionDetailDto } from '@paritas/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage, isApiError } from '@/lib/api/api-error';
import {
  getException,
  getExceptionStats,
  listAssignees,
  listExceptions,
} from '@/lib/api/endpoints/exceptions';
import { listMatchCandidates } from '@/lib/api/endpoints/transactions';
import type { ExceptionListParams } from '@/lib/api/endpoints/params';
import { useAuth } from '@/lib/auth/use-auth';
import { queryKeys } from '@/lib/query/keys';

const ASSIGNEES_STALE_MS = 5 * 60_000;

/** Queries wait for the session; the static page shell renders before it exists. */
const useSessionReady = (): boolean => useAuth().status === 'authenticated';

export const useExceptionList = (params: ExceptionListParams) =>
  useQuery({
    queryKey: queryKeys.exceptions.list(params),
    queryFn: ({ signal }) => listExceptions(params, signal),
    enabled: useSessionReady(),
    // Keep the old page on screen while the next one loads: no flash between pages.
    placeholderData: keepPreviousData,
  });

export const useExceptionStats = () =>
  useQuery({
    queryKey: queryKeys.exceptions.stats,
    queryFn: ({ signal }) => getExceptionStats(signal),
    enabled: useSessionReady(),
  });

export const useException = (id: string) =>
  useQuery({
    queryKey: queryKeys.exceptions.detail(id),
    queryFn: ({ signal }) => getException(id, signal),
    enabled: useSessionReady(),
  });

export const useAssignees = () =>
  useQuery({
    queryKey: queryKeys.exceptions.assignees,
    queryFn: ({ signal }) => listAssignees(signal),
    enabled: useSessionReady(),
    staleTime: ASSIGNEES_STALE_MS,
  });

export const useMatchCandidates = (transactionId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.transactions.candidates(transactionId ?? ''),
    queryFn: ({ signal }) => listMatchCandidates(transactionId ?? '', signal),
    enabled: useSessionReady() && enabled && Boolean(transactionId),
  });

interface ActionOptions<V> {
  run: (variables: V) => Promise<ExceptionDetailDto>;
  success: (result: ExceptionDetailDto) => string;
  failure: string;
}

/**
 * A workflow action: on success the detail is replaced with the server's answer
 * and every list and count refreshes; on a conflict (someone else acted first)
 * the latest state is fetched so the person decides on current facts.
 */
export const useExceptionAction = <V>(id: string, { run, success, failure }: ActionOptions<V>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.exceptions.detail(id), result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      toast.success(success(result));
    },
    onError: (error) => {
      toast.error(failure, { description: errorMessage(error, 'Try again in a moment.') });
      if (isApiError(error) && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.detail(id) });
      }
    },
  });
};
