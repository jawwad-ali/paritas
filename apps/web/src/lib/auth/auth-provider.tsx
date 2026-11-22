'use client';

import type { AuthSessionResponse, LoginRequest, UserDto } from '@paritas/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { REFRESH_LEAD_MS } from '@/lib/api/api.constants';
import { login, logout } from '@/lib/api/auth-api';
import { endSession, refreshSession, registerSessionEndedHandler } from '@/lib/api/session';
import { MIN_RENEWAL_DELAY_MS } from './auth.constants';
import type { AuthContextValue, AuthStatus } from './auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session: restores it from the refresh cookie on load, renews the
 * access token shortly before it expires, and drops every cached query when
 * the session ends so one user's data never shows to the next.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSessionResponse | null>(null);

  const applySession = useCallback((next: AuthSessionResponse): UserDto => {
    setSession(next);
    setStatus('authenticated');
    return next.user;
  }, []);

  // Restore the session on load; register how the API layer ends it.
  useEffect(() => {
    registerSessionEndedHandler(() => {
      queryClient.clear();
      setSession(null);
      setStatus('unauthenticated');
    });
    refreshSession().then(applySession, () => setStatus('unauthenticated'));
  }, [applySession, queryClient]);

  // Each new session schedules its own renewal, shortly before the token expires.
  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const delay = Math.max(session.expiresIn * 1000 - REFRESH_LEAD_MS, MIN_RENEWAL_DELAY_MS);
    const timer = setTimeout(() => {
      refreshSession().then(applySession, endSession);
    }, delay);
    return () => clearTimeout(timer);
  }, [session, applySession]);

  const signIn = useCallback(
    async (credentials: LoginRequest): Promise<UserDto> => applySession(await login(credentials)),
    [applySession],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await logout();
    } finally {
      endSession();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, signIn, signOut }),
    [status, session, signIn, signOut],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
};
