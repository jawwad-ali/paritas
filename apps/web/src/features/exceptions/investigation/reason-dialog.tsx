'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CloseExceptionRequest, closeExceptionRequestSchema } from '@paritas/shared';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface ReasonDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  reasonLabel: string;
  reasonHint: string;
  /** Resolve and ignore take extra notes; reopen takes only a reason. */
  withNote: boolean;
  destructive?: boolean;
  onConfirm: (values: CloseExceptionRequest) => Promise<unknown>;
}

/** Every closing or reopening decision states its reason; the reason goes to the audit trail. */
export const ReasonDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  reasonLabel,
  reasonHint,
  withNote,
  destructive = false,
  onConfirm,
}: ReasonDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<CloseExceptionRequest>({
    resolver: zodResolver(closeExceptionRequestSchema),
    defaultValues: { reason: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await onConfirm({ reason: values.reason, ...(values.note && { note: values.note }) });
      setOpen(false);
      form.reset();
    } catch {
      // The action's own toast explains the failure; the dialog stays open to retry.
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.reason)}>
              <FieldLabel htmlFor="decision-reason">{reasonLabel}</FieldLabel>
              <Textarea
                id="decision-reason"
                rows={3}
                autoFocus
                aria-invalid={Boolean(errors.reason)}
                {...form.register('reason')}
              />
              <FieldDescription>{reasonHint}</FieldDescription>
              <FieldError errors={[errors.reason]} />
            </Field>
            {withNote && (
              <Field data-invalid={Boolean(errors.note)}>
                <FieldLabel htmlFor="decision-note">Notes (optional)</FieldLabel>
                <Textarea
                  id="decision-note"
                  rows={2}
                  {...form.register('note', { setValueAs: (v: string) => v.trim() || undefined })}
                />
                <FieldError errors={[errors.note]} />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={destructive ? 'destructive' : 'default'}
              disabled={isSubmitting}
            >
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
