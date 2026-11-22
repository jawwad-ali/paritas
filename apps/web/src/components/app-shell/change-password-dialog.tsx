'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordRequestSchema, PASSWORD_MIN_LENGTH } from '@paritas/shared';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordInput } from '@/components/forms/password-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage, isApiError } from '@/lib/api/api-error';
import { useAuth } from '@/lib/auth/use-auth';

/** The API's rules, plus typing the new password twice (checked only here). */
const formSchema = changePasswordRequestSchema
  .safeExtend({ confirmPassword: z.string() })
  .refine((value) => value.confirmPassword === value.newPassword, {
    path: ['confirmPassword'],
    message: 'The two new passwords do not match.',
  });
type ChangePasswordForm = z.infer<typeof formSchema>;

/** Fields the API validates; its errors for them show under the field. */
const isServerField = (path: string): path is 'currentPassword' | 'newPassword' =>
  path === 'currentPassword' || path === 'newPassword';

const EMPTY: ChangePasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

interface ChangePasswordDialogProps {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Changing a password signs out every other session; this device carries on. */
export const ChangePasswordDialog = ({ email, open, onOpenChange }: ChangePasswordDialogProps) => {
  const { changePassword } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
  });
  const { errors, isSubmitting } = form.formState;

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      form.reset(EMPTY);
      setSubmitError(null);
    }
    onOpenChange(next);
  };

  const submit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    setSubmitError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      handleOpenChange(false);
      toast.success('Password changed', {
        description: 'Every other device you were signed in on has been signed out.',
      });
    } catch (error) {
      let shownOnField = false;
      for (const fieldError of isApiError(error) ? error.fieldErrors : []) {
        if (isServerField(fieldError.path)) {
          form.setError(fieldError.path, { message: fieldError.message }, { shouldFocus: true });
          shownOnField = true;
        }
      }
      if (!shownOnField) {
        setSubmitError(errorMessage(error, 'Your password was not changed. Try again.'));
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Other devices signed in to your account will be signed out.
            </DialogDescription>
          </DialogHeader>
          {submitError && (
            <Alert variant="destructive" aria-live="assertive">
              <TriangleAlert />
              <AlertTitle>Password not changed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          {/* Lets password managers file the new password under the right account. */}
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={email}
            readOnly
            hidden
          />
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword)}>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                autoFocus
                aria-invalid={Boolean(errors.currentPassword)}
                {...form.register('currentPassword')}
              />
              <FieldError errors={[errors.currentPassword]} />
            </Field>
            <Field data-invalid={Boolean(errors.newPassword)}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby="new-password-hint"
                {...form.register('newPassword')}
              />
              <FieldDescription id="new-password-hint">
                At least {PASSWORD_MIN_LENGTH} characters. A short phrase is easier to remember than
                symbols.
              </FieldDescription>
              <FieldError errors={[errors.newPassword]} />
            </Field>
            <Field data-invalid={Boolean(errors.confirmPassword)}>
              <FieldLabel htmlFor="confirm-password">Repeat new password</FieldLabel>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...form.register('confirmPassword')}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Change password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
