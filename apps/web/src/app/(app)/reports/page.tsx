import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { ExceptionReportCard } from '@/features/reports/components/exception-report-card';
import { SummaryReportCard } from '@/features/reports/components/summary-report-card';

export const metadata: Metadata = { title: 'Reports' };

const ReportsPage = () => (
  <PageContainer>
    <PageHeader
      title="Reports"
      description="Audit-ready reports for any range of days. Every export is recorded in the audit log."
    />
    <div className="grid gap-6 xl:grid-cols-2">
      <SummaryReportCard />
      <ExceptionReportCard />
    </div>
  </PageContainer>
);

export default ReportsPage;
