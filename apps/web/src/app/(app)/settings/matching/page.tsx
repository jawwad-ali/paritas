import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { MatchingRulesView } from '@/features/admin/matching/matching-rules-view';

export const metadata: Metadata = { title: 'Matching rules' };

const MatchingRulesPage = () => (
  <PageContainer>
    <PageHeader
      title="Matching rules"
      description="Exact matches use the shared reference. Everything else is scored on amount (45%), customer (30%) and time (25%) within these limits."
    />
    <MatchingRulesView />
  </PageContainer>
);

export default MatchingRulesPage;
