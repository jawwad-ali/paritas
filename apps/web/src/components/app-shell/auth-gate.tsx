'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { signInPathFor } from '@/lib/auth/redirect';
import { useAuth } from '@/lib/auth/use-auth';

/**
 * Sends anyone without a session to sign-in. Pages always render, so their
 * static shell prerenders and navigates instantly; their data loads only once
 * the session exists, and the API authorises every request on its own.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Read here, not via usePathname(): URL hooks would stop every page from prerendering.
      const { pathname, search } = window.location;
      router.replace(signInPathFor(`${pathname}${search}`));
    }
  }, [status, router]);

  return children;
};
