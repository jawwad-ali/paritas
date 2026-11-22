'use client';

import { EXCEPTION_NOTE_MAX_LENGTH, formatExceptionNumber } from '@paritas/shared';
import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { addNote } from '@/lib/api/endpoints/exceptions';
import { useExceptionAction } from '../use-exception-queries';

interface NoteFormProps {
  exceptionId: string;
  number: number;
}

/** Notes record the investigation as it happens; Ctrl/Cmd + Enter adds one. */
export const NoteForm = ({ exceptionId, number }: NoteFormProps) => {
  const [message, setMessage] = useState('');
  const mutation = useExceptionAction(exceptionId, {
    run: (text: string) => addNote(exceptionId, { message: text }),
    success: () => `Note added to ${formatExceptionNumber(number)}`,
    failure: 'Could not add the note',
  });
  const text = message.trim();

  const submit = (event?: FormEvent): void => {
    event?.preventDefault();
    if (!text || mutation.isPending) {
      return;
    }
    mutation.mutate(text, { onSuccess: () => setMessage('') });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Field>
        <FieldLabel htmlFor="note">Add a note</FieldLabel>
        <Textarea
          id="note"
          rows={3}
          value={message}
          maxLength={EXCEPTION_NOTE_MAX_LENGTH}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="What you checked, who you asked, what you found."
        />
        <FieldDescription>
          Notes are permanent and visible to everyone on the exception.
        </FieldDescription>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={!text || mutation.isPending}>
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          Add note
        </Button>
      </div>
    </form>
  );
};
