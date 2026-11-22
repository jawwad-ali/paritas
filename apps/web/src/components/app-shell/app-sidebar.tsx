'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ParitasMark } from '@/components/brand/paritas-mark';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth/use-auth';
import { hasRole } from '@/lib/auth/roles';
import { isActivePath, NAV_SECTIONS } from './nav.config';
import { UserMenu } from './user-menu';

/** The ink rail: Paritas's one committed field of colour, carrying navigation by role. */
export const AppSidebar = () => {
  const pathname = usePathname();
  // Null while the session is restored: role-restricted items wait until the role is known.
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
        <nav aria-label="Main">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.roles || hasRole(user, item.roles));
            if (items.length === 0) {
              return null;
            }
            return (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="text-sidebar-muted">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.title}
                            className="data-active:text-sidebar-primary data-active:shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                          >
                            <Link href={item.href} aria-current={active ? 'page' : undefined}>
                              <item.icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </nav>
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
