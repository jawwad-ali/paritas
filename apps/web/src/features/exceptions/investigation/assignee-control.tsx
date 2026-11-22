'use client';

import type { ExceptionDetailDto, UserDto } from '@paritas/shared';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assignException } from '@/lib/api/endpoints/exceptions';
import { hasRole, SUPERVISOR_ROLES } from '@/lib/auth/roles';
import { useAssignees, useExceptionAction } from '../use-exception-queries';

const UNASSIGNED = '__none__';

interface AssigneeControlProps {
  exception: ExceptionDetailDto;
  user: UserDto;
  /** Closed exceptions keep their owner but cannot be reassigned. */
  editable: boolean;
}

/**
 * Managers and admins assign anyone. Officers take an unassigned exception or
 * release their own, the same rule the API enforces.
 */
export const AssigneeControl = ({ exception, user, editable }: AssigneeControlProps) => {
  const supervisor = hasRole(user, SUPERVISOR_ROLES);
  const assignees = useAssignees();
  const assign = useExceptionAction(exception.id, {
    run: (assigneeId: string | null) => assignException(exception.id, { assigneeId }),
    success: (result) => (result.assignee ? `Assigned to ${result.assignee.name}` : 'Unassigned'),
    failure: 'Could not change the assignee',
  });
  const current = exception.assignee;

  if (editable && supervisor) {
    return (
      <Select
        value={current?.id ?? UNASSIGNED}
        disabled={assign.isPending}
        onValueChange={(value) => assign.mutate(value === UNASSIGNED ? null : value)}
      >
        <SelectTrigger aria-label="Assignee" className="w-full">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {(assignees.data ?? []).map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
            </SelectItem>
          ))}
          {current && !assignees.data?.some((person) => person.id === current.id) && (
            <SelectItem value={current.id}>{current.name}</SelectItem>
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate">
        {current?.name ?? <span className="text-muted-foreground">Unassigned</span>}
      </span>
      {editable && !current && (
        <Button
          size="sm"
          variant="outline"
          disabled={assign.isPending}
          onClick={() => assign.mutate(user.id)}
        >
          Take it
        </Button>
      )}
      {editable && current?.id === user.id && (
        <Button
          size="sm"
          variant="ghost"
          disabled={assign.isPending}
          onClick={() => assign.mutate(null)}
        >
          Release
        </Button>
      )}
    </div>
  );
};
