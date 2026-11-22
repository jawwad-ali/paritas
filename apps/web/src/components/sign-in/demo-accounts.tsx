import type { UserRole } from '@paritas/shared';
import { Button } from '@/components/ui/button';

/** The seeded demo users (apps/api/prisma/seed.ts). */
const DEMO_ACCOUNTS: { email: string; role: UserRole; label: string }[] = [
  { email: 'admin@paritas.example.com', role: 'ADMIN', label: 'Admin' },
  { email: 'manager@paritas.example.com', role: 'MANAGER', label: 'Manager' },
  { email: 'officer@paritas.example.com', role: 'OFFICER', label: 'Officer' },
];

interface DemoAccountsProps {
  onPick: (email: string) => void;
}

/** Local and demo servers only: one tap fills the form with a seeded account of that role. */
export const DemoAccounts = ({ onPick }: DemoAccountsProps) => (
  <section aria-labelledby="demo-accounts" className="space-y-2">
    <h3 id="demo-accounts" className="text-xs font-medium text-muted-foreground">
      Fill in a demo account
    </h3>
    <ul className="grid grid-cols-3 gap-2">
      {DEMO_ACCOUNTS.map((account) => (
        <li key={account.email}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onPick(account.email)}
            aria-label={`Fill in the ${account.label} demo account, ${account.email}`}
            title={account.email}
          >
            {account.label}
          </Button>
        </li>
      ))}
    </ul>
  </section>
);
