import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { RequireRole } from '@/components/layout/require-role';
import { UsersView } from '@/features/admin/users/users-view';

export const metadata: Metadata = { title: 'Users' };

const UsersPage = () => (
  <PageContainer>
    <PageHeader
      title="Users"
      description="Officers work the queue; managers also assign, re-prioritise and approve; administrators manage users, sources and rules."
    />
    <RequireRole roles={['ADMIN']}>
      <Suspense fallback={<TableSkeleton rows={4} columns={5} />}>
        <UsersView />
      </Suspense>
    </RequireRole>
  </PageContainer>
);

export default UsersPage;
