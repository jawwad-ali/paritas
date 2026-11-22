'use client';

import { Inbox } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/api-error';

const SAMPLE_ERROR = new ApiError(
  503,
  'The reconciliation service is restarting. Try again in a minute.',
  {
    requestId: '0b8e2f4a-91c3-4d55-a2e0-6f1c7d9b3e10',
  },
);

export const StatesShowcase = () => (
  <div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-3 rounded-md border bg-card p-4" aria-label="Loading example">
      <div className="text-xs font-medium text-muted-foreground">
        Loading: the content&apos;s shape
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
    <Empty className="rounded-md border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No exceptions match these filters</EmptyTitle>
        <EmptyDescription>Clear a filter or widen the date range.</EmptyDescription>
      </EmptyHeader>
    </Empty>
    <ErrorState title="Exceptions could not load" error={SAMPLE_ERROR} onRetry={() => undefined} />
    <div className="flex flex-wrap gap-3 lg:col-span-3">
      <Button
        variant="outline"
        onClick={() =>
          toast.success('EX-1042 resolved', {
            description: 'Both records are now excluded from matching.',
          })
        }
      >
        Show a success toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Could not resolve EX-1042', {
            description: 'Someone else changed it. Reload and try again.',
          })
        }
      >
        Show an error toast
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Ignore a critical exception</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ignore EX-1042?</AlertDialogTitle>
            <AlertDialogDescription>
              The ledger entry LED-7Q2K9 ($4,812.50) leaves reconciliation and is recorded as
              ignored by you. You can reopen it later from the exception.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it open</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Ignore exception</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
);
