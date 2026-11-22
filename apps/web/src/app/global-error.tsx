'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import './globals.css';

interface GlobalErrorProps {
  error: unknown;
  retry: () => void;
}

/**
 * Last resort: the root layout itself failed, so this page brings its own
 * document. The stylesheet still applies; it follows the OS colour scheme.
 */
const GlobalError = ({ error, retry }: GlobalErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <title>Paritas is unavailable</title>
        <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Paritas could not load</h1>
            <p className="text-muted-foreground">
              The application failed to start in this tab. Your data is unaffected. Try again; if it
              keeps failing, the service may be restarting.
            </p>
            <Button onClick={retry}>Try again</Button>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
