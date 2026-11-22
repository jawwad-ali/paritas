import type { Metadata } from 'next';
import { TriangleAlert } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Exceptions' };

const ExceptionsPage = () => (
  <PlannedScreen
    title="Exceptions"
    description="Everything the matching engine could not settle, most urgent first."
    icon={TriangleAlert}
    purpose="Work the queue: investigate records side by side, match manually, resolve or ignore with a reason."
  />
);

export default ExceptionsPage;
