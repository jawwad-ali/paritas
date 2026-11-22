import type { LoginRequest, UserDto } from '@paritas/shared';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: LoginRequest) => Promise<UserDto>;
  signOut: () => Promise<void>;
}
