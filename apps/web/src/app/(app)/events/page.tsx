import type { Metadata } from 'next';
import { Inbox } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Inbound events' };

const EventsPage = () => (
  <PlannedScreen
    title="Inbound events"
    description="Webhook events exactly as each source sent them."
    icon={Inbox}
    purpose="Inspect raw events and replay one that failed."
  />
);

export default EventsPage;
