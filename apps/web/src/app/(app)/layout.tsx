import { AppShell } from '@/components/app-shell/app-shell';
import { AuthGate } from '@/components/app-shell/auth-gate';

const SignedInLayout = ({ children }: LayoutProps<'/'>) => (
  <AuthGate>
    <AppShell>{children}</AppShell>
  </AuthGate>
);

export default SignedInLayout;
