import type {
  AddExceptionNoteRequest,
  AssigneeDto,
  AssignExceptionRequest,
  ChangeExceptionSeverityRequest,
  CloseExceptionRequest,
  ExceptionDetailDto,
  ExceptionDto,
  ExceptionStatsDto,
  ManualMatchRequest,
  Paginated,
  ReopenExceptionRequest,
} from '@paritas/shared';
import { apiRequest } from '../api-client';
import type { ExceptionListParams } from './params';

const BASE = '/exceptions';

export const listExceptions = (
  params: ExceptionListParams,
  signal?: AbortSignal,
): Promise<Paginated<ExceptionDto>> => apiRequest(BASE, { query: { ...params }, signal });

export const getExceptionStats = (signal?: AbortSignal): Promise<ExceptionStatsDto> =>
  apiRequest(`${BASE}/stats`, { signal });

export const listAssignees = (signal?: AbortSignal): Promise<AssigneeDto[]> =>
  apiRequest(`${BASE}/assignees`, { signal });

export const getException = (id: string, signal?: AbortSignal): Promise<ExceptionDetailDto> =>
  apiRequest(`${BASE}/${id}`, { signal });

/** Every workflow action answers with the updated exception. */
const act = (
  id: string,
  action: string,
  method: 'POST' | 'PATCH',
  body?: unknown,
): Promise<ExceptionDetailDto> => apiRequest(`${BASE}/${id}/${action}`, { method, body });

export const addNote = (id: string, body: AddExceptionNoteRequest) =>
  act(id, 'notes', 'POST', body);
export const assignException = (id: string, body: AssignExceptionRequest) =>
  act(id, 'assignee', 'PATCH', body);
export const changeSeverity = (id: string, body: ChangeExceptionSeverityRequest) =>
  act(id, 'severity', 'PATCH', body);
export const investigateException = (id: string) => act(id, 'investigate', 'POST');
export const resolveException = (id: string, body: CloseExceptionRequest) =>
  act(id, 'resolve', 'POST', body);
export const ignoreException = (id: string, body: CloseExceptionRequest) =>
  act(id, 'ignore', 'POST', body);
export const reopenException = (id: string, body: ReopenExceptionRequest) =>
  act(id, 'reopen', 'POST', body);
export const matchException = (id: string, body: ManualMatchRequest) =>
  act(id, 'match', 'POST', body);
