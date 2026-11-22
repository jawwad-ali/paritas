'use client';

import { LayoutDashboard, RefreshCw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HOME_PATH } from '@/lib/auth/auth.constants';

interface ScreenErrorProps {
  error: unknown;
  retry: () => void;
}

/** The digest ties what the person sees to the server log; client errors have none. */
const digestOf = (error: unknown): string | undefined =>
  error instanceof Error && 'digest' in error && typeof error.digest === 'string'
    ? error.digest
    : undefined;

/**
 * A screen failed to render. The sidebar and header stay, so the person can
 * retry or go elsewhere; the error itself is never shown, it may hold internals.
 */
const ScreenError = ({ error, retry }: ScreenErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = digestOf(error);

  return (
    <PageContainer>
      <Alert variant="destructive" className="max-w-2xl">
        <TriangleAlert />
        <AlertTitle>This screen could not be shown</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>
            Something went wrong while drawing it. Your data is unaffected: no decision or change
            was lost. Try again, and if it keeps failing, report the reference below.
          </p>
          {digest && <p className="font-mono text-xs">Reference {digest}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={retry}>
              <RefreshCw data-icon="inline-start" />
              Try again
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={HOME_PATH}>
                <LayoutDashboard data-icon="inline-start" />
                Go to the dashboard
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
};

export default ScreenError;
