import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { ExceptionInvestigation } from '@/features/exceptions/investigation/exception-investigation';

export const metadata: Metadata = { title: 'Investigate exception' };

/** The shell is static; the exception loads in the browser once the session exists. */
const ExceptionPage = () => (
  <PageContainer>
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ExceptionInvestigation />
    </Suspense>
  </PageContainer>
);

export default ExceptionPage;
