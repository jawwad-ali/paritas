import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

export const AppShell = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
    >
      Skip to content
    </a>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
);
