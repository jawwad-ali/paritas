import type { Metadata } from 'next';
import { Cable } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Sources' };

const SettingsSourcesPage = () => (
  <PlannedScreen
    title="Sources"
    description="Connected payment sources and their activity."
    icon={Cable}
    purpose="See volume and last activity per source; administrators can pause one."
  />
);

export default SettingsSourcesPage;
