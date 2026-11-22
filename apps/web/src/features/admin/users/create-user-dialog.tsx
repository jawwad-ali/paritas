'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CreateUserRequest,
  createUserRequestSchema,
  PASSWORD_MIN_LENGTH,
  USER_ROLE_LABELS,
  USER_ROLES,
} from '@paritas/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/api/api-error';
import { createUser } from '@/lib/api/endpoints/admin';
import { queryKeys } from '@/lib/query/keys';

/** Adds a person with a role and a first password they should change on first sign-in. */
export const CreateUserDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<CreateUserRequest>({
    resolver: zodResolver(createUserRequestSchema),
    defaultValues: { email: '', name: '', role: 'OFFICER', password: '' },
  });
  const { errors } = form.formState;

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usersAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.assignees });
      toast.success(`${user.name} added as ${USER_ROLE_LABELS[user.role]}`);
      setOpen(false);
      form.reset();
    },
    onError: (error) =>
      form.setError('root', { message: errorMessage(error, 'The user could not be added.') }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus data-icon="inline-start" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
          noValidate
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Add a user</DialogTitle>
            <DialogDescription>
              Share the first password privately; it can be changed after signing in.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="user-name">Full name</FieldLabel>
              <Input
                id="user-name"
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
                {...form.register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="user-email">Work email</FieldLabel>
              <Input
                id="user-email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                {...form.register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-role">Role</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {USER_ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="user-password">First password</FieldLabel>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                {...form.register('password')}
              />
              <FieldDescription>At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
          </FieldGroup>
          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner data-icon="inline-start" />}
              Add user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
