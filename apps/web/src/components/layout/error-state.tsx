'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorMessage, isApiError } from '@/lib/api/api-error';

interface ErrorStateProps {
  title: string;
  error: unknown;
  onRetry?: () => void;
}

/** A failed load: what failed, the server's reason, a retry, and the request id for support. */
export const ErrorState = ({ title, error, onRetry }: ErrorStateProps) => (
  <Alert variant="destructive">
    <TriangleAlert />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="flex flex-col items-start gap-3">
      <p>{errorMessage(error, 'An unexpected error occurred.')}</p>
      {isApiError(error) && error.requestId && (
        <p className="font-mono text-xs">Request {error.requestId}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);
