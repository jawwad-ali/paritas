import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { RequireRole } from '@/components/layout/require-role';
import { EventsView } from '@/features/admin/events/events-view';

export const metadata: Metadata = { title: 'Inbound events' };

const EventsPage = () => (
  <PageContainer>
    <PageHeader
      title="Inbound events"
      description="Webhooks exactly as Stripe and the ledger sent them, signature-checked and stored before processing."
    />
    <RequireRole roles={['ADMIN', 'MANAGER']}>
      <Suspense fallback={<TableSkeleton columns={5} />}>
        <EventsView />
      </Suspense>
    </RequireRole>
  </PageContainer>
);

export default EventsPage;
