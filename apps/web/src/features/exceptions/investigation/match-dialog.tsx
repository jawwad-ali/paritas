'use client';

import {
  EXCEPTION_REASON_MAX_LENGTH,
  EXCEPTION_REASON_MIN_LENGTH,
  type ExceptionDetailDto,
  type ManualMatchRequest,
} from '@paritas/shared';
import { Link2, SearchX } from 'lucide-react';
import { useState } from 'react';
import { ErrorState } from '@/components/layout/error-state';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useMatchCandidates } from '../use-exception-queries';
import { MatchOptionRow } from './match-option-row';
import { buildMatchOptions, matchSubject } from './match-options';

interface MatchDialogProps {
  exception: ExceptionDetailDto;
  onConfirm: (request: ManualMatchRequest) => Promise<unknown>;
}

/**
 * Manual match: pick the counterpart (the engine's suggestions, ranked by its
 * own scoring) and say why. Matching asserts both records are one payment; the
 * engine re-checks the pair and still flags any real difference.
 */
export const MatchDialog = ({ exception, onConfirm }: MatchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const subject = matchSubject(exception);
  const candidates = useMatchCandidates(subject?.id, open);
  const options =
    subject && candidates.data ? buildMatchOptions(exception, subject, candidates.data) : [];
  const selected = options.find((option) => option.key === selectedKey) ?? options[0];
  const reasonOk = reason.trim().length >= EXCEPTION_REASON_MIN_LENGTH;

  const confirm = async (): Promise<void> => {
    if (!selected || !reasonOk) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        gatewayTransactionId: selected.gateway.id,
        ledgerTransactionId: selected.ledger.id,
        reason: reason.trim(),
      });
      setOpen(false);
      setReason('');
      setSelectedKey(null);
    } catch {
      // The action's toast explains it; the dialog stays open.
    } finally {
      setSubmitting(false);
    }
  };

  if (!subject) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start">
          <Link2 data-icon="inline-start" />
          Find a match
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Match {subject.externalId}</DialogTitle>
          <DialogDescription>
            Records from the other side in the same currency, within 3 days, best first.
          </DialogDescription>
        </DialogHeader>
        {candidates.isPending ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : candidates.isError ? (
          <ErrorState
            title="Candidates could not load"
            error={candidates.error}
            onRetry={() => void candidates.refetch()}
          />
        ) : options.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No likely counterpart</EmptyTitle>
              <EmptyDescription>
                Nothing unmatched on the other side comes close. If the payment was handled another
                way, resolve with the reason.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <fieldset className="space-y-2">
            <legend className="sr-only">Counterpart</legend>
            {options.map((option) => (
              <MatchOptionRow
                key={option.key}
                option={option}
                selected={option.key === selected?.key}
                onSelect={() => setSelectedKey(option.key)}
              />
            ))}
          </fieldset>
        )}
        {options.length > 0 && (
          <Field>
            <FieldLabel htmlFor="match-reason">Why these are the same payment</FieldLabel>
            <Textarea
              id="match-reason"
              rows={2}
              maxLength={EXCEPTION_REASON_MAX_LENGTH}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <FieldDescription>
              For example: same order number, confirmed with the customer.
            </FieldDescription>
          </Field>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void confirm()} disabled={!selected || !reasonOk || submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            Match records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
