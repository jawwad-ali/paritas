/**
 * Cookie-authenticated endpoints (refresh, logout) require this header. Browsers
 * cannot attach a custom header to a cross-site request without a CORS preflight,
 * which the API rejects for unknown origins, so this blocks CSRF.
 */
export const CSRF_HEADER = 'x-requested-by';
export const CSRF_HEADER_VALUE = 'paritas-web';

export const PASSWORD_MIN_LENGTH = 12;
/** Upper bound protects the password hasher from denial-of-service inputs. */
export const PASSWORD_MAX_LENGTH = 128;
