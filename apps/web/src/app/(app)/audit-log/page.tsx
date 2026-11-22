import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { RequireRole } from '@/components/layout/require-role';
import { AuditView } from '@/features/admin/audit/audit-view';

export const metadata: Metadata = { title: 'Audit log' };

const AuditLogPage = () => (
  <PageContainer>
    <PageHeader
      title="Audit log"
      description="Every important action, newest first. Entries cannot be edited or deleted, not even by the application."
    />
    <RequireRole roles={['ADMIN', 'MANAGER']}>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <AuditView />
      </Suspense>
    </RequireRole>
  </PageContainer>
);

export default AuditLogPage;
