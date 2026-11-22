import { API_BASE_URL } from './api.constants';
import { networkError } from './api-error';
import { fileNameFrom, parseError } from './response';
import { endSession, getAccessToken, refreshSession } from './session';

type QueryValue = string | number | boolean | readonly string[] | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Arrays become comma-separated (the API's `?status=OPEN,INVESTIGATING`). */
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Extra headers, e.g. the CSRF header on cookie-authenticated calls. */
  headers?: Record<string, string>;
  /**
   * Renew the session and retry once on 401 (default). Off for sign-in and
   * sign-out, where a 401 means wrong credentials, not an expired token.
   */
  renewOnUnauthorized?: boolean;
}

export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

const buildUrl = (path: string, query?: RequestOptions['query']): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const search = params.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ''}`;
};

const send = async (path: string, options: RequestOptions): Promise<Response> => {
  const token = getAccessToken();
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw networkError();
  }
};

/**
 * Sends a request; on 401 renews the session once and retries. When renewal
 * fails too, the session has ended and the app returns to sign-in.
 */
const sendAuthenticated = async (path: string, options: RequestOptions): Promise<Response> => {
  const response = await send(path, options);
  if (response.status !== 401 || options.renewOnUnauthorized === false) {
    return response;
  }
  try {
    await refreshSession();
  } catch {
    endSession();
    return response;
  }
  return send(path, options);
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await sendAuthenticated(path, options);
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

/** For report exports: the body as a file, named the way the server named it. */
export const apiDownload = async (
  path: string,
  options: RequestOptions,
  fallbackName: string,
): Promise<DownloadedFile> => {
  const response = await sendAuthenticated(path, options);
  if (!response.ok) {
    throw await parseError(response);
  }
  return { blob: await response.blob(), fileName: fileNameFrom(response, fallbackName) };
};
