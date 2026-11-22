'use client';

import type { UserDto } from '@paritas/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { hasRole } from '@/lib/auth/roles';
import { isActivePath, NAV_SECTIONS } from './nav.config';

interface NavGroupsProps {
  /** Null while the session is restored: role-restricted items wait until the role is known. */
  user: UserDto | null;
  /** Null before the URL is known (prerender): nothing is highlighted yet. */
  pathname: string | null;
}

export const NavGroups = ({ user, pathname }: NavGroupsProps) => (
  <nav aria-label="Main">
    {NAV_SECTIONS.map((section) => {
      const items = section.items.filter((item) => !item.roles || hasRole(user, item.roles));
      if (items.length === 0) {
        return null;
      }
      return (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel className="text-sidebar-muted">{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname !== null && isActivePath(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-active:text-sidebar-primary"
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
);

/** The same navigation once the URL is known, with the current section highlighted. */
export const ActiveNavGroups = ({ user }: { user: UserDto | null }) => (
  <NavGroups user={user} pathname={usePathname()} />
);
