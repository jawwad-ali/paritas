import type { ProblemDetails, ProblemFieldError } from '@paritas/shared';
import { NETWORK_ERROR_MESSAGE, NETWORK_ERROR_STATUS } from './api.constants';

/** Every failed API call surfaces as this, carrying the server's RFC 9457 problem details. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ProblemFieldError[];
  readonly requestId?: string;

  constructor(status: number, message: string, problem?: Partial<ProblemDetails>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = problem?.errors ?? [];
    this.requestId = problem?.requestId;
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const networkError = (): ApiError =>
  new ApiError(NETWORK_ERROR_STATUS, NETWORK_ERROR_MESSAGE);

/** A message safe to show a person: the server's detail, never a stack trace. */
export const errorMessage = (error: unknown, fallback: string): string =>
  isApiError(error) && error.message ? error.message : fallback;
