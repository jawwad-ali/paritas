'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginRequest, loginRequestSchema } from '@paritas/shared';
import { TriangleAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/forms/password-input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { publicEnv } from '@/config/env';
import { errorMessage } from '@/lib/api/api-error';
import { NEXT_PARAM } from '@/lib/auth/auth.constants';
import { safeNextPath } from '@/lib/auth/redirect';
import { useAuth } from '@/lib/auth/use-auth';
import { DemoAccounts } from './demo-accounts';

const SIGN_IN_FAILED = 'Could not sign you in. Try again in a moment.';

export const SignInForm = () => {
  const { status, signIn } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get(NEXT_PARAM));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  // Already signed in (another tab, a restored session): go straight in.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(next);
    }
  }, [status, router, next]);

  const onSubmit = form.handleSubmit(async (credentials) => {
    setSubmitError(null);
    try {
      await signIn(credentials);
    } catch (error) {
      setSubmitError(errorMessage(error, SIGN_IN_FAILED));
      form.setFocus('password');
    }
  });

  const fillDemoAccount = (email: string): void => {
    form.setValue('email', email, { shouldValidate: true });
    form.setValue('password', publicEnv.NEXT_PUBLIC_DEMO_PASSWORD ?? '', { shouldValidate: true });
    form.setFocus('password');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {submitError && (
        <Alert variant="destructive" aria-live="assertive">
          <TriangleAlert />
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            className="h-10"
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            groupClassName="h-10"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base xl:h-16 xl:text-xl"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner data-icon="inline-start" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
      {publicEnv.NEXT_PUBLIC_DEMO_PASSWORD && <DemoAccounts onPick={fillDemoAccount} />}
    </form>
  );
};
