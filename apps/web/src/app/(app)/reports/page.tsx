import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Reports' };

const ReportsPage = () => (
  <PlannedScreen
    title="Reports"
    description="Audit-ready summaries and exception detail for a date range."
    icon={FileText}
    purpose="Download the reconciliation summary or the exception report as CSV or PDF."
  />
);

export default ReportsPage;
