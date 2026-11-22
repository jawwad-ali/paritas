import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ParitasMark } from '@/components/brand/paritas-mark';
import { Button } from '@/components/ui/button';
import { HOME_PATH } from '@/lib/auth/auth.constants';

export const metadata: Metadata = { title: 'Page not found' };

/** Any URL the app does not have. Outside the signed-in shell, so it needs no session. */
const NotFound = () => (
  <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-2">
        <ParitasMark />
        <span className="text-lg font-bold tracking-tight">Paritas</span>
      </div>
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-2xl font-bold tracking-tight">This page does not exist</h1>
        <p className="text-muted-foreground">
          The link may be mistyped, or the page has moved. Records and exceptions keep their
          addresses, so a saved link to one still works.
        </p>
      </div>
      <Button asChild>
        <Link href={HOME_PATH}>
          <ArrowLeft data-icon="inline-start" />
          Back to the dashboard
        </Link>
      </Button>
    </div>
  </main>
);

export default NotFound;
