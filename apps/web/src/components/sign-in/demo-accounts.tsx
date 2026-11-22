import { USER_ROLE_LABELS, type UserRole } from '@paritas/shared';
import { Button } from '@/components/ui/button';

/** The seeded demo users (apps/api/prisma/seed.ts). */
const DEMO_ACCOUNTS: { email: string; role: UserRole }[] = [
  { email: 'admin@paritas.example.com', role: 'ADMIN' },
  { email: 'manager@paritas.example.com', role: 'MANAGER' },
  { email: 'officer@paritas.example.com', role: 'OFFICER' },
];

interface DemoAccountsProps {
  onPick: (email: string) => void;
}

export const DemoAccounts = ({ onPick }: DemoAccountsProps) => (
  <section
    aria-labelledby="demo-accounts"
    className="space-y-2 rounded-md border border-dashed p-3"
  >
    <h2 id="demo-accounts" className="text-xs font-medium text-muted-foreground">
      Demo accounts on this server
    </h2>
    <ul className="space-y-1">
      {DEMO_ACCOUNTS.map((account) => (
        <li key={account.email} className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium">{USER_ROLE_LABELS[account.role]}</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {account.email}
            </span>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => onPick(account.email)}>
            Use this account
          </Button>
        </li>
      ))}
    </ul>
  </section>
);
