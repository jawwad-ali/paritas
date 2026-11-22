import type { UserRole } from '@paritas/shared';
import {
  ArrowLeftRight,
  Cable,
  FileText,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  ScrollText,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Visible only to these roles; omitted means everyone. Mirrors the API's own rules. */
  roles?: readonly UserRole[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Reconciliation',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Exceptions', href: '/exceptions', icon: TriangleAlert },
      { title: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { title: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Matching rules', href: '/settings/matching', icon: SlidersHorizontal },
      { title: 'Sources', href: '/settings/sources', icon: Cable },
      { title: 'Inbound events', href: '/events', icon: Inbox, roles: ['ADMIN', 'MANAGER'] },
      { title: 'Users', href: '/settings/users', icon: Users, roles: ['ADMIN'] },
      { title: 'Audit log', href: '/audit-log', icon: ScrollText, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
];

export const isActivePath = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

/** Pages reached from elsewhere (the user menu) still need a header title. */
const OTHER_TITLES: Record<string, string> = { '/design-system': 'Design system' };

/** The title of the section a path belongs to, for the header. */
export const titleForPath = (pathname: string): string | undefined =>
  NAV_SECTIONS.flatMap((section) => section.items).find((item) => isActivePath(pathname, item.href))
    ?.title ?? OTHER_TITLES[pathname];
