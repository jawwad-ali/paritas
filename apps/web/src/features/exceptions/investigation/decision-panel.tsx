'use client';

import { type ExceptionDetailDto, formatExceptionNumber, type UserDto } from '@paritas/shared';
import { CircleCheck, CircleSlash, RotateCcw, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  changeSeverity,
  ignoreException,
  investigateException,
  matchException,
  reopenException,
  resolveException,
} from '@/lib/api/endpoints/exceptions';
import { hasRole, SUPERVISOR_ROLES } from '@/lib/auth/roles';
import { useExceptionAction } from '../use-exception-queries';
import { MatchDialog } from './match-dialog';
import { ReasonDialog } from './reason-dialog';
import { SeverityDialog } from './severity-dialog';

interface DecisionPanelProps {
  exception: ExceptionDetailDto;
  user: UserDto;
}

/** The decisions available in the exception's current state, for the current role. */
export const DecisionPanel = ({ exception, user }: DecisionPanelProps) => {
  const { id, status, severity } = exception;
  const label = formatExceptionNumber(exception.number);
  const open = status === 'OPEN' || status === 'INVESTIGATING';
  const supervisor = hasRole(user, SUPERVISOR_ROLES);
  const ignoreBlocked = severity === 'CRITICAL' && !supervisor;

  const options = (verb: string) => ({
    success: () => `${label} ${verb}`,
    failure: `Could not update ${label}`,
  });
  const investigate = useExceptionAction(id, {
    run: () => investigateException(id),
    ...options('is under investigation'),
  });
  const resolve = useExceptionAction(id, {
    run: (v: { reason: string; note?: string }) => resolveException(id, v),
    ...options('resolved'),
  });
  const ignore = useExceptionAction(id, {
    run: (v: { reason: string; note?: string }) => ignoreException(id, v),
    ...options('ignored'),
  });
  const reopen = useExceptionAction(id, {
    run: (v: { reason: string }) => reopenException(id, v),
    ...options('reopened'),
  });
  const match = useExceptionAction(id, {
    run: (v: Parameters<typeof matchException>[1]) => matchException(id, v),
    ...options('matched and resolved'),
  });
  const severityChange = useExceptionAction(id, {
    run: (v: Parameters<typeof changeSeverity>[1]) => changeSeverity(id, v),
    ...options('re-prioritised'),
  });

  if (!open) {
    return (
      <div className="space-y-2">
        <ReasonDialog
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <RotateCcw data-icon="inline-start" />
              Reopen…
            </Button>
          }
          title={`Reopen ${label}?`}
          description="It returns to the open queue and its records are held as exceptions again."
          confirmLabel="Reopen exception"
          reasonLabel="Why reopen it"
          reasonHint="For example: the journal entry was reversed."
          withNote={false}
          onConfirm={(values) => reopen.mutateAsync({ reason: values.reason })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MatchDialog exception={exception} onConfirm={(request) => match.mutateAsync(request)} />
      {status === 'OPEN' && (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={investigate.isPending}
          onClick={() => investigate.mutate(undefined)}
        >
          <SearchCheck data-icon="inline-start" />
          Start investigating
        </Button>
      )}
      <ReasonDialog
        trigger={
          <Button variant="outline" className="w-full justify-start">
            <CircleCheck data-icon="inline-start" />
            Resolve…
          </Button>
        }
        title={`Resolve ${label}`}
        description="Records without a match leave automatic reconciliation; a genuine counterpart arriving later still matches."
        confirmLabel="Resolve exception"
        reasonLabel="Resolution"
        reasonHint="What explains or fixes it, e.g. booked by hand as JE-2291."
        withNote
        onConfirm={(values) => resolve.mutateAsync(values)}
      />
      {ignoreBlocked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block" tabIndex={0}>
              <Button variant="outline" className="w-full justify-start" disabled>
                <CircleSlash data-icon="inline-start" />
                Ignore…
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Ignoring a critical exception needs a manager or an admin.
          </TooltipContent>
        </Tooltip>
      ) : (
        <ReasonDialog
          trigger={
            <Button variant="outline" className="w-full justify-start text-destructive">
              <CircleSlash data-icon="inline-start" />
              Ignore…
            </Button>
          }
          title={`Ignore ${label}?`}
          description={
            exception.type === 'LOW_CONFIDENCE_MATCH'
              ? 'Rejects the suggested pairing. Both records return to matching, and this pair is never proposed again.'
              : 'Accepts the discrepancy without a fix. The decision and its reason are recorded.'
          }
          confirmLabel="Ignore exception"
          reasonLabel="Why ignore it"
          reasonHint="For example: two separate purchases confirmed by the customer."
          withNote
          destructive
          onConfirm={(values) => ignore.mutateAsync(values)}
        />
      )}
      {supervisor && (
        <div className="pt-2">
          <SeverityDialog
            current={severity}
            onConfirm={(values) => severityChange.mutateAsync(values)}
          />
        </div>
      )}
    </div>
  );
};
