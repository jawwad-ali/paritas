'use client';

import { USER_ROLE_LABELS, type UserRole } from '@paritas/shared';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { hasRole } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/use-auth';

interface RequireRoleProps {
  roles: readonly UserRole[];
  children: ReactNode;
}

/** Says plainly who can use a screen. The API enforces the same rule on every request. */
export const RequireRole = ({ roles, children }: RequireRoleProps) => {
  const { user } = useAuth();
  if (!user) {
    return <Skeleton className="h-64" aria-label="Loading" />;
  }
  if (hasRole(user, roles)) {
    return children;
  }
  return (
    <Empty className="rounded-md border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>
          This screen is for {roles.map((role) => USER_ROLE_LABELS[role]).join(' and ')}s
        </EmptyTitle>
        <EmptyDescription>Ask an administrator if you need access.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
