'use client';

import type { SourceDto } from '@paritas/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, CirclePause } from 'lucide-react';
import { toast } from 'sonner';
import { SourceLabel } from '@/components/domain/source-label';
import { SOURCE_KIND_LABELS } from '@/components/domain/source-label';
import { ErrorState } from '@/components/layout/error-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api/api-error';
import { updateSource } from '@/lib/api/endpoints/admin';
import { hasRole } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/format/time';
import { queryKeys } from '@/lib/query/keys';
import { useSources } from '../use-admin-queries';

const NUMBER = new Intl.NumberFormat('en-US');

const ToggleSource = ({ source }: { source: SourceDto }) => {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => updateSource(source.id, { isActive: !source.isActive }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sources });
      toast.success(`${updated.name} ${updated.isActive ? 'resumed' : 'paused'}`);
    },
    onError: (error) =>
      toast.error(`Could not update ${source.name}`, {
        description: errorMessage(error, 'Try again.'),
      }),
  });
  const pausing = source.isActive;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={toggle.isPending}>
          {pausing ? 'Pause source' : 'Resume source'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pausing ? `Pause ${source.name}?` : `Resume ${source.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pausing
              ? 'Its events are still received and stored for audit, but not processed or matched until it is resumed.'
              : 'New events are processed and matched again. Events received while paused can be replayed from Inbound events.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={pausing ? 'destructive' : 'default'}
            onClick={() => toggle.mutate()}
          >
            {pausing ? 'Pause source' : 'Resume source'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/** Where records come from: each source's volume and last activity; admins pause or resume one. */
export const SourcesView = () => {
  const query = useSources();
  const admin = hasRole(useAuth().user, ['ADMIN']);

  if (query.isPending) {
    return <Skeleton className="h-48" aria-label="Loading sources" />;
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Sources could not load"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {query.data.map((source) => (
        <li key={source.id} className="space-y-4 rounded-md border bg-card p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <SourceLabel name={source.name} kind={source.kind} />
              <p className="text-xs text-muted-foreground">
                {SOURCE_KIND_LABELS[source.kind]} · code {source.code}
              </p>
            </div>
            <span
              className={
                source.isActive
                  ? 'inline-flex items-center gap-1.5 text-sm text-matched-fg'
                  : 'inline-flex items-center gap-1.5 text-sm text-sev-high-fg'
              }
            >
              {source.isActive ? (
                <CircleCheck className="size-4" aria-hidden="true" />
              ) : (
                <CirclePause className="size-4" aria-hidden="true" />
              )}
              {source.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Records</dt>
              <dd className="text-xl font-medium tabular-nums">
                {NUMBER.format(source.transactionCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last event received</dt>
              <dd>
                {source.lastEventReceivedAt
                  ? formatDateTime(source.lastEventReceivedAt)
                  : 'Nothing received yet'}
              </dd>
            </div>
          </dl>
          {admin && <ToggleSource source={source} />}
        </li>
      ))}
    </ul>
  );
};
