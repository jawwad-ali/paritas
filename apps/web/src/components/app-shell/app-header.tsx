'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { titleForPath } from './nav.config';

/** Top bar: the sidebar toggle and where you are. Page actions live in each page's header. */
export const AppHeader = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" />
      <Separator
        orientation="vertical"
        className="mr-1 data-vertical:h-4 data-vertical:self-center"
      />
      <span className="truncate text-sm font-medium text-muted-foreground">
        {titleForPath(pathname) ?? 'Paritas'}
      </span>
    </header>
  );
};
