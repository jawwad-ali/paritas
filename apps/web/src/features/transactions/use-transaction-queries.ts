'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTransaction, listTransactions } from '@/lib/api/endpoints/transactions';
import type { TransactionListParams } from '@/lib/api/endpoints/params';
import { useAuth } from '@/lib/auth/use-auth';
import { queryKeys } from '@/lib/query/keys';

export const useTransactionList = (params: TransactionListParams) =>
  useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: ({ signal }) => listTransactions(params, signal),
    enabled: useAuth().status === 'authenticated',
    placeholderData: keepPreviousData,
  });

export const useTransaction = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.transactions.detail(id ?? ''),
    queryFn: ({ signal }) => getTransaction(id ?? '', signal),
    enabled: useAuth().status === 'authenticated' && Boolean(id),
  });
