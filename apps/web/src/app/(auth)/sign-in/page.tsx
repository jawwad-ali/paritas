import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ParitasMark } from '@/components/brand/paritas-mark';
import { ProductCollage } from '@/components/sign-in/product-collage';
import { SignInForm } from '@/components/sign-in/sign-in-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Sign in' };

const FormSkeleton = () => (
  <div className="space-y-6" aria-hidden="true">
    <Skeleton className="h-16" />
    <Skeleton className="h-16" />
    <Skeleton className="h-12 xl:h-16" />
  </div>
);

/**
 * Three columns on a wide screen: what Paritas is, the product at work, and
 * the way in. Always on the flat ink ground, whatever the theme; the grain field
 * in the collage is the page's only colour. A phone stacks them, form first
 * after the headline.
 */
const SignInPage = () => (
  <div className="dark relative isolate min-h-svh overflow-hidden bg-background text-foreground [color-scheme:dark]">
    <div className="mx-auto flex min-h-svh w-full max-w-[1280px] flex-col px-4 sm:px-8 2xl:px-0">
      <header className="flex h-20 shrink-0 items-center gap-2.5 xl:h-24">
        <ParitasMark />
        <span className="text-lg font-bold tracking-tight">Paritas</span>
      </header>

      <main className="grid flex-1 grid-cols-1 content-start gap-x-6 gap-y-10 pb-10 md:grid-cols-12 md:content-center xl:grid-rows-[minmax(0,1fr)] xl:content-stretch xl:pb-4">
        <section
          aria-labelledby="product-heading"
          className="space-y-4 md:col-span-5 md:self-end xl:col-span-3 xl:row-start-1 xl:self-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
        >
          <h1
            id="product-heading"
            className="text-[2.5rem] leading-[1.04] font-medium tracking-tight text-balance xl:text-[3.25rem]"
          >
            Reconciliation for finance teams
          </h1>
          <div className="h-px w-16 bg-primary" />
          <p className="max-w-sm text-base leading-6 text-muted-foreground">
            Every Stripe payment is checked against your ledger as it arrives. Fee differences
            within 3% + 50¢ match on their own.
          </p>
        </section>

        <section
          aria-labelledby="sign-in-heading"
          className="space-y-6 md:col-span-5 md:col-start-1 md:self-start xl:col-span-3 xl:col-start-10 xl:row-start-1 xl:self-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-150 motion-safe:duration-500 motion-safe:fill-mode-backwards"
        >
          <div className="space-y-1">
            <h2 id="sign-in-heading" className="text-xl font-medium tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Use the work email your administrator invited.
            </p>
          </div>
          <Suspense fallback={<FormSkeleton />}>
            <SignInForm />
          </Suspense>
        </section>

        <ProductCollage className="aspect-[628/716] max-h-[540px] w-full md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:aspect-auto md:h-full md:max-h-none md:min-h-[560px] xl:col-span-6 xl:col-start-4 xl:row-span-1 xl:min-h-0" />
      </main>

      <footer className="shrink-0 py-6 text-xs text-muted-foreground">
        Test mode only: Paritas refuses live payment keys.
      </footer>
    </div>
  </div>
);

export default SignInPage;
