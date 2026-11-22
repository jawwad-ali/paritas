'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { createQueryClient } from '@/lib/query/query-client';

/** App-wide client context: data cache, session, tooltips and toasts. */
export const Providers = ({ children }: { children: ReactNode }) => {
  // One client per browser session; useState keeps it stable across renders.
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
