'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ParitasMark } from '@/components/brand/paritas-mark';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth/use-auth';
import { ActiveNavGroups, NavGroups } from './nav-groups';
import { UserMenu } from './user-menu';

/** The ink rail: Paritas's one committed field of colour, carrying navigation by role. */
export const AppSidebar = () => {
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <ParitasMark />
                <span className="grid leading-tight">
                  <span className="text-base font-bold tracking-tight text-sidebar-accent-foreground">
                    Paritas
                  </span>
                  <span className="text-xs text-sidebar-muted">Reconciliation</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* URL hooks sit behind Suspense, so every page keeps a prerendered shell. */}
        <Suspense fallback={<NavGroups user={user} pathname={null} />}>
          <ActiveNavGroups user={user} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
