import type {
  AuditLogDto,
  CreateUserRequest,
  MatchingConfigDto,
  Paginated,
  RawEventDetailDto,
  RawEventDto,
  SourceDto,
  UpdateMatchingConfigRequest,
  UpdateSourceRequest,
  UpdateUserRequest,
  UserDto,
} from '@paritas/shared';
import { apiRequest } from '../api-client';
import type { AuditListParams, RawEventListParams, UserListParams } from './params';

export const getMatchingRules = (signal?: AbortSignal): Promise<MatchingConfigDto> =>
  apiRequest('/settings/matching', { signal });
export const updateMatchingRules = (
  body: UpdateMatchingConfigRequest,
): Promise<MatchingConfigDto> => apiRequest('/settings/matching', { method: 'PATCH', body });

export const listSources = (signal?: AbortSignal): Promise<SourceDto[]> =>
  apiRequest('/sources', { signal });
export const updateSource = (id: string, body: UpdateSourceRequest): Promise<SourceDto> =>
  apiRequest(`/sources/${id}`, { method: 'PATCH', body });

export const listUsers = (
  params: UserListParams,
  signal?: AbortSignal,
): Promise<Paginated<UserDto>> => apiRequest('/users', { query: { ...params }, signal });
export const createUser = (body: CreateUserRequest): Promise<UserDto> =>
  apiRequest('/users', { method: 'POST', body });
export const updateUser = (id: string, body: UpdateUserRequest): Promise<UserDto> =>
  apiRequest(`/users/${id}`, { method: 'PATCH', body });

export const listAuditLogs = (
  params: AuditListParams,
  signal?: AbortSignal,
): Promise<Paginated<AuditLogDto>> => apiRequest('/audit-logs', { query: { ...params }, signal });

export const listRawEvents = (
  params: RawEventListParams,
  signal?: AbortSignal,
): Promise<Paginated<RawEventDto>> => apiRequest('/raw-events', { query: { ...params }, signal });
export const getRawEvent = (id: string, signal?: AbortSignal): Promise<RawEventDetailDto> =>
  apiRequest(`/raw-events/${id}`, { signal });
export const replayRawEvent = (id: string): Promise<RawEventDto> =>
  apiRequest(`/raw-events/${id}/replay`, { method: 'POST' });
