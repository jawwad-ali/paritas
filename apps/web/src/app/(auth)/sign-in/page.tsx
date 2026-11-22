import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ParitasMark } from '@/components/brand/paritas-mark';
import { MatchPreview } from '@/components/sign-in/match-preview';
import { SignInForm } from '@/components/sign-in/sign-in-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Sign in' };

const FormSkeleton = () => (
  <div className="space-y-6" aria-hidden="true">
    <Skeleton className="h-16" />
    <Skeleton className="h-16" />
    <Skeleton className="h-10" />
  </div>
);

/**
 * Two panels: the product at work on ink (what Paritas does, one fact, the
 * matching engine shown live), and the sign-in form. On a phone the form comes first.
 */
const SignInPage = () => (
  <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
    <section
      aria-labelledby="product-heading"
      className="order-2 flex flex-col justify-between gap-12 bg-sidebar px-4 py-12 text-sidebar-foreground sm:px-12 lg:order-1 lg:px-16"
    >
      <div className="hidden items-center gap-2.5 lg:flex motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <ParitasMark />
        <span className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">
          Paritas
        </span>
      </div>
      <div className="max-w-xl space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <div className="space-y-4">
          <h1
            id="product-heading"
            className="text-3xl leading-tight font-bold tracking-tight text-balance text-sidebar-accent-foreground sm:text-4xl"
          >
            Stripe-to-ledger reconciliation for finance teams
          </h1>
          <p className="max-w-lg text-base leading-relaxed">
            Every Stripe payment is checked against your internal ledger as it arrives: an exact
            match by reference, otherwise a score on amount, customer and time. What does not match
            goes to one queue, both records side by side, and every decision is recorded.
          </p>
        </div>
        <MatchPreview />
      </div>
      <p className="text-xs text-sidebar-muted">
        Test mode only: Paritas refuses live payment keys.
      </p>
    </section>

    <main className="order-1 flex flex-col justify-center px-4 py-12 sm:px-12 lg:order-2 lg:px-16">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 lg:hidden">
            <ParitasMark />
            <span className="text-lg font-bold tracking-tight">Paritas</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to Paritas</h2>
          <p className="text-muted-foreground">Use the work email your administrator invited.</p>
        </div>
        <Suspense fallback={<FormSkeleton />}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  </div>
);

export default SignInPage;
