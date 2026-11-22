import type { Metadata } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Matching rules' };

const SettingsMatchingPage = () => (
  <PlannedScreen
    title="Matching rules"
    description="The tolerances and thresholds the matching engine applies."
    icon={SlidersHorizontal}
    purpose="See every rule the engine uses; administrators can change them without a deploy."
  />
);

export default SettingsMatchingPage;
