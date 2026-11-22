import type { ChangePasswordRequest, LoginRequest, UserDto } from '@paritas/shared';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: LoginRequest) => Promise<UserDto>;
  signOut: () => Promise<void>;
  /** Other devices are signed out; this one continues on the new session. */
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
}
