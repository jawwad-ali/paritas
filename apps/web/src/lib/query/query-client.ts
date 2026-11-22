import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/api-error';

const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

/** A client error (4xx) will fail the same way again; only network and 5xx errors are retried. */
const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < MAX_RETRIES && (!isApiError(error) || error.isNetworkError || error.status >= 500);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
