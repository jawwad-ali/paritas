import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { ExceptionQueue } from '@/features/exceptions/components/exception-queue';

export const metadata: Metadata = { title: 'Exceptions' };

const ExceptionsPage = () => (
  <PageContainer>
    <PageHeader
      title="Exceptions"
      description="Records the matching engine could not settle, most urgent first."
    />
    <Suspense fallback={<TableSkeleton />}>
      <ExceptionQueue />
    </Suspense>
  </PageContainer>
);

export default ExceptionsPage;
