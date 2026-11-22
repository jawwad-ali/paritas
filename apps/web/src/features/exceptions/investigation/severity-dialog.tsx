'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ChangeExceptionSeverityRequest,
  changeExceptionSeverityRequestSchema,
  type ExceptionSeverity,
} from '@paritas/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { SEVERITY_LABELS, SEVERITY_OPTIONS } from '../exception-filters';

interface SeverityDialogProps {
  current: ExceptionSeverity;
  onConfirm: (values: ChangeExceptionSeverityRequest) => Promise<unknown>;
}

/** Managers and admins re-prioritise, always with a reason. */
export const SeverityDialog = ({ current, onConfirm }: SeverityDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<ChangeExceptionSeverityRequest>({
    resolver: zodResolver(changeExceptionSeverityRequestSchema),
    defaultValues: { severity: current, reason: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await onConfirm(values);
      setOpen(false);
      form.reset({ severity: values.severity, reason: '' });
    } catch {
      // Explained by the action's toast; keep the dialog open.
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change severity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>Change severity</DialogTitle>
            <DialogDescription>
              Severity sets the queue order. The change and its reason are recorded.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="severity-select">Severity</FieldLabel>
              <Controller
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="severity-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {SEVERITY_LABELS[severity]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field data-invalid={Boolean(errors.reason)}>
              <FieldLabel htmlFor="severity-reason">Reason</FieldLabel>
              <Textarea
                id="severity-reason"
                rows={2}
                aria-invalid={Boolean(errors.reason)}
                {...form.register('reason')}
              />
              <FieldError errors={[errors.reason]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Save severity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
