import { createHash, randomBytes } from 'node:crypto';
import { REFRESH_TOKEN_BYTES } from './sessions.constants.js';

export const generateRefreshToken = (): string =>
  randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');

/** Only this hash is stored, so a database leak does not leak usable tokens. */
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
