import {
  type AuthSessionResponse,
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  type LoginRequest,
  type UserDto,
} from '@paritas/shared';
import { apiRequest } from './api-client';
import { setAccessToken } from './session';

const CSRF = { [CSRF_HEADER]: CSRF_HEADER_VALUE };

export const login = async (request: LoginRequest): Promise<AuthSessionResponse> => {
  const session = await apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: request,
    renewOnUnauthorized: false,
  });
  setAccessToken(session.accessToken);
  return session;
};

/** Ends the server session and clears the cookie; the local token goes either way. */
export const logout = async (): Promise<void> => {
  try {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      headers: CSRF,
      renewOnUnauthorized: false,
    });
  } finally {
    setAccessToken(null);
  }
};

export const fetchCurrentUser = (signal?: AbortSignal): Promise<UserDto> =>
  apiRequest<UserDto>('/auth/me', { signal });
