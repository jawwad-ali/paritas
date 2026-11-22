import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';

export const metadata: Metadata = { title: 'Dashboard' };

const DashboardPage = () => (
  <PageContainer>
    <Suspense fallback={<Skeleton className="h-96" />}>
      <DashboardView />
    </Suspense>
  </PageContainer>
);

export default DashboardPage;
