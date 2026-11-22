import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX } from '@paritas/shared';
import { publicEnv } from '@/config/env';

export const API_BASE_URL = `${publicEnv.NEXT_PUBLIC_API_URL}/${API_GLOBAL_PREFIX}/v${API_DEFAULT_VERSION}`;

/** Status 0: the request never got an HTTP answer (offline, DNS, CORS, API down). */
export const NETWORK_ERROR_STATUS = 0;
export const NETWORK_ERROR_MESSAGE =
  'Paritas could not reach the server. Check your connection and try again.';
export const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong on our side. Try again in a moment.';

/** Refresh the access token this long before it expires, so requests never race expiry. */
export const REFRESH_LEAD_MS = 60_000;
