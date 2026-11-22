import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { SourcesView } from '@/features/admin/sources/sources-view';

export const metadata: Metadata = { title: 'Sources' };

const SourcesPage = () => (
  <PageContainer>
    <PageHeader
      title="Sources"
      description="The two sides of every reconciliation: the payment gateway and the internal ledger."
    />
    <SourcesView />
  </PageContainer>
);

export default SourcesPage;
