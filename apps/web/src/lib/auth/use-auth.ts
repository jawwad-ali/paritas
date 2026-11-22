'use client';

import type { UserDto } from '@paritas/shared';
import { use } from 'react';
import { AuthContext } from './auth-provider';
import type { AuthContextValue } from './auth.types';

export const useAuth = (): AuthContextValue => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
};

/** For screens behind the auth gate, where a user is guaranteed. */
export const useCurrentUser = (): UserDto => {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useCurrentUser was called outside the signed-in area.');
  }
  return user;
};
