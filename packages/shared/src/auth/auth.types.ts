import type { UserDto } from '../users/user.types.js';

/** Returned by login and refresh. The refresh token travels only in an httpOnly cookie. */
export interface AuthSessionResponse {
  accessToken: string;
  /** Seconds until `accessToken` expires. */
  expiresIn: number;
  user: UserDto;
}
