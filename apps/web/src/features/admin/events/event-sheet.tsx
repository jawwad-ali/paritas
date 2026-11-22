'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { JsonBlock } from '@/components/data/json-block';
import { Identifier } from '@/components/domain/identifier';
import { ErrorState } from '@/components/layout/error-state';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/api/api-error';
import { replayRawEvent } from '@/lib/api/endpoints/admin';
import { hasRole } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/format/time';
import { queryKeys } from '@/lib/query/keys';
import { useRawEvent } from '../use-admin-queries';
import { EVENT_STATUS_LABELS } from './events.config';

interface EventSheetProps {
  id: string | undefined;
  onClose: () => void;
}

/** One webhook exactly as received; an admin can replay a failed or ignored one. */
export const EventSheet = ({ id, onClose }: EventSheetProps) => {
  const queryClient = useQueryClient();
  const query = useRawEvent(id);
  const admin = hasRole(useAuth().user, ['ADMIN']);
  const event = query.data;
  const replay = useMutation({
    mutationFn: () => replayRawEvent(id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rawEvents.all });
      toast.success('Event queued for processing again');
    },
    onError: (error) =>
      toast.error('The event could not be replayed', {
        description: errorMessage(error, 'Try again.'),
      }),
  });
  const replayable = event && (event.status === 'FAILED' || event.status === 'IGNORED');

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{event?.eventType ?? 'Inbound event'}</SheetTitle>
          <SheetDescription>
            {event
              ? `${event.source.name} · received ${formatDateTime(event.receivedAt)}`
              : 'Loading the event'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {query.isPending ? (
            <Skeleton className="h-64" />
          ) : query.isError ? (
            <ErrorState
              title="The event could not load"
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : event ? (
            <>
              <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="text-xs text-muted-foreground">Event id</dt>
                <dd>
                  <Identifier value={event.externalEventId} copyable />
                </dd>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>{EVENT_STATUS_LABELS[event.status]}</dd>
                <dt className="text-xs text-muted-foreground">Processed</dt>
                <dd>{event.processedAt ? formatDateTime(event.processedAt) : 'Not yet'}</dd>
                {event.error && (
                  <>
                    <dt className="text-xs text-muted-foreground">Error</dt>
                    <dd className="text-destructive">{event.error}</dd>
                  </>
                )}
              </dl>
              {admin && replayable && (
                <Button
                  variant="outline"
                  disabled={replay.isPending}
                  onClick={() => replay.mutate()}
                >
                  {replay.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RotateCcw data-icon="inline-start" />
                  )}
                  Replay event
                </Button>
              )}
              <JsonBlock value={event.payload} label="Event payload as received" />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
