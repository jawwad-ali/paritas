import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The one page frame: equal side edges, a wide measure for tables, one vertical rhythm. */
export const PageContainer = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn('mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8', className)}
  >
    {children}
  </div>
);
