import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Users' };

const SettingsUsersPage = () => (
  <PlannedScreen
    title="Users"
    description="People who can sign in, and what each may do."
    icon={Users}
    purpose="Invite users, assign roles and deactivate accounts."
  />
);

export default SettingsUsersPage;
