export const SIGN_IN_PATH = '/sign-in';
export const HOME_PATH = '/dashboard';
/** Query string key carrying where to return after signing in. */
export const NEXT_PARAM = 'next';
/** Never schedule a renewal sooner than this, whatever the token lifetime. */
export const MIN_RENEWAL_DELAY_MS = 5_000;
