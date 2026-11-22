'use client';

import { USER_ROLE_LABELS } from '@paritas/shared';
import { ChevronsUpDown, LogOut, Monitor, Moon, Palette, Sun } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuSkeleton, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth/use-auth';
import { isThemePreference, THEME_LABELS, THEME_PREFERENCES } from '@/lib/theme/theme.constants';
import { useTheme } from '@/lib/theme/use-theme';

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const { isMobile } = useSidebar();

  if (!user) {
    return <SidebarMenuSkeleton showIcon className="h-12" />;
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch {
      toast.error('You were signed out on this device', {
        description: 'The server could not be reached to end the session everywhere.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-sidebar-accent text-xs font-bold text-sidebar-primary">
            {initialsOf(user.name)}
          </span>
          <span className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate font-medium text-sidebar-accent-foreground">{user.name}</span>
            <span className="truncate text-xs text-sidebar-muted">
              {USER_ROLE_LABELS[user.role]}
            </span>
          </span>
          <ChevronsUpDown className="ml-auto size-4 text-sidebar-muted" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel className="grid gap-0.5 font-normal">
          <span className="font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => isThemePreference(value) && setPreference(value)}
        >
          {THEME_PREFERENCES.map((option) => {
            const Icon = THEME_ICONS[option];
            return (
              <DropdownMenuRadioItem key={option} value={option}>
                <Icon className="size-4" />
                {THEME_LABELS[option]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/design-system">
              <Palette />
              Design system
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
