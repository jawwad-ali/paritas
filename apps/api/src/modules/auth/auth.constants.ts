import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX } from '@paritas/shared';

export const JWT_ALGORITHM = 'HS256';
export const JWT_ISSUER = 'paritas-api';
export const JWT_AUDIENCE = 'paritas';

export const REFRESH_COOKIE_NAME = 'paritas_rt';
/** The browser only sends the refresh cookie to auth endpoints, nowhere else. */
export const REFRESH_COOKIE_PATH = `/${API_GLOBAL_PREFIX}/v${API_DEFAULT_VERSION}/auth`;

/** Per client IP. Slows online password guessing without hurting real users. */
export const LOGIN_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const ROLES_KEY = 'auth:roles';

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'This account is disabled. Contact an administrator.',
  MISSING_BEARER_TOKEN: 'Missing bearer token.',
  INVALID_ACCESS_TOKEN: 'Access token is invalid or expired.',
  INVALID_REFRESH_TOKEN: 'Session expired. Please sign in again.',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect.',
  MISSING_CSRF_HEADER: 'Missing or invalid CSRF protection header.',
} as const;
