import type { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Dashboard' };

const DashboardPage = () => (
  <PlannedScreen
    title="Dashboard"
    description="Reconciliation health for the last 7 or 30 days."
    icon={LayoutDashboard}
    purpose="Match rate, volumes, open and critical exceptions, and the daily trend, at a glance."
  />
);

export default DashboardPage;
