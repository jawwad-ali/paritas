import type { ProblemDetails } from '@paritas/shared';
import { UNEXPECTED_ERROR_MESSAGE } from './api.constants';
import { ApiError } from './api-error';

const isProblem = (value: unknown): value is Partial<ProblemDetails> =>
  typeof value === 'object' && value !== null && ('detail' in value || 'title' in value);

/** Turns any non-2xx response into an ApiError, preferring the server's own wording. */
export const parseError = async (response: Response): Promise<ApiError> => {
  const body: unknown = await response.json().catch(() => null);
  if (!isProblem(body)) {
    return new ApiError(response.status, UNEXPECTED_ERROR_MESSAGE);
  }
  const message =
    response.status >= 500 ? UNEXPECTED_ERROR_MESSAGE : (body.detail ?? body.title ?? '');
  return new ApiError(response.status, message, body);
};

/** File name from `Content-Disposition: attachment; filename="..."`. */
export const fileNameFrom = (response: Response, fallback: string): string => {
  const header = response.headers.get('content-disposition') ?? '';
  return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback;
};
