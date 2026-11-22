import { type AuthSessionResponse, CSRF_HEADER, CSRF_HEADER_VALUE } from '@paritas/shared';
import { API_BASE_URL } from './api.constants';
import { networkError } from './api-error';
import { parseError } from './response';

/**
 * The access token lives only in memory: never in localStorage, where any
 * injected script could read it. A reload restores it from the httpOnly
 * refresh cookie, which JavaScript cannot read at all.
 */
let accessToken: string | null = null;
let refreshInFlight: Promise<AuthSessionResponse> | null = null;
let onSessionEnded: (() => void) | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

/** The auth layer registers how to react when the session cannot be renewed. */
export const registerSessionEndedHandler = (handler: () => void): void => {
  onSessionEnded = handler;
};

export const endSession = (): void => {
  accessToken = null;
  onSessionEnded?.();
};

const requestRefresh = async (): Promise<AuthSessionResponse> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { [CSRF_HEADER]: CSRF_HEADER_VALUE },
    });
  } catch {
    throw networkError();
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  const session = (await response.json()) as AuthSessionResponse;
  accessToken = session.accessToken;
  return session;
};

/** Serialises refreshes across tabs: they share one cookie jar, so the next tab sends the rotated cookie. */
const REFRESH_LOCK = 'paritas-session-refresh';

const refreshAcrossTabs = async (): Promise<AuthSessionResponse> => {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return await navigator.locks.request(REFRESH_LOCK, requestRefresh);
  }
  return requestRefresh();
};

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers share
 * one request: the API rotates the cookie on every refresh and treats a reused
 * cookie as theft, so two parallel refreshes (in one tab or across tabs) would
 * sign the user out.
 */
export const refreshSession = (): Promise<AuthSessionResponse> => {
  refreshInFlight ??= refreshAcrossTabs().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};
