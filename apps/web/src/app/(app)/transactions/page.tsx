import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { TransactionsView } from '@/features/transactions/components/transactions-view';

export const metadata: Metadata = { title: 'Transactions' };

const TransactionsPage = () => (
  <PageContainer>
    <PageHeader
      title="Transactions"
      description="Every record from Stripe and the internal ledger, in one normalised format."
    />
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsView />
    </Suspense>
  </PageContainer>
);

export default TransactionsPage;
