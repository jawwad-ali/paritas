'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(signInPathFor(pathname));
    }
  }, [status, router, pathname]);

  return children;
};
