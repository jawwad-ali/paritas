'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getMatchingRules,
  getRawEvent,
  listAuditLogs,
  listRawEvents,
  listSources,
  listUsers,
} from '@/lib/api/endpoints/admin';
import type {
  AuditListParams,
  RawEventListParams,
  UserListParams,
} from '@/lib/api/endpoints/params';
import { useAuth } from '@/lib/auth/use-auth';
import { queryKeys } from '@/lib/query/keys';

const useReady = (): boolean => useAuth().status === 'authenticated';

export const useMatchingRules = () =>
  useQuery({
    queryKey: queryKeys.matchingRules,
    queryFn: ({ signal }) => getMatchingRules(signal),
    enabled: useReady(),
  });

export const useSources = () =>
  useQuery({
    queryKey: queryKeys.sources,
    queryFn: ({ signal }) => listSources(signal),
    enabled: useReady(),
  });

export const useUsers = (params: UserListParams) =>
  useQuery({
    queryKey: queryKeys.users(params),
    queryFn: ({ signal }) => listUsers(params, signal),
    enabled: useReady(),
    placeholderData: keepPreviousData,
  });

export const useAuditLogs = (params: AuditListParams) =>
  useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: ({ signal }) => listAuditLogs(params, signal),
    enabled: useReady(),
    placeholderData: keepPreviousData,
  });

export const useRawEvents = (params: RawEventListParams) =>
  useQuery({
    queryKey: queryKeys.rawEvents.list(params),
    queryFn: ({ signal }) => listRawEvents(params, signal),
    enabled: useReady(),
    placeholderData: keepPreviousData,
  });

export const useRawEvent = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.rawEvents.detail(id ?? ''),
    queryFn: ({ signal }) => getRawEvent(id ?? '', signal),
    enabled: useReady() && Boolean(id),
  });
