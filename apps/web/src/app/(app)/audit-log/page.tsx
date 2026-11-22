import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Audit log' };

const AuditLogPage = () => (
  <PlannedScreen
    title="Audit log"
    description="Every important action, append-only."
    icon={ScrollText}
    purpose="Search who did what, and when, across the whole system."
  />
);

export default AuditLogPage;
