import { HOME_PATH, NEXT_PARAM, SIGN_IN_PATH } from './auth.constants';

/**
 * Only same-site paths are honoured after sign-in. `//evil.example`, `/\evil.example`
 * (browsers read it as `//`) and absolute URLs would make sign-in an open redirect.
 */
export const safeNextPath = (value: string | null): string =>
  value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : HOME_PATH;

export const signInPathFor = (returnTo: string): string =>
  returnTo === HOME_PATH || returnTo === '/'
    ? SIGN_IN_PATH
    : `${SIGN_IN_PATH}?${NEXT_PARAM}=${encodeURIComponent(returnTo)}`;
