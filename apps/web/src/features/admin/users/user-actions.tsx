'use client';

import {
  type UpdateUserRequest,
  USER_ROLE_LABELS,
  USER_ROLES,
  type UserDto,
} from '@paritas/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { errorMessage } from '@/lib/api/api-error';
import { updateUser } from '@/lib/api/endpoints/admin';
import { queryKeys } from '@/lib/query/keys';

interface UserActionsProps {
  user: UserDto;
  /** Admins cannot demote or deactivate themselves (the API refuses it too). */
  isSelf: boolean;
}

/** Change a person's role or switch their access on and off; deactivating signs them out everywhere. */
export const UserActions = ({ user, isSelf }: UserActionsProps) => {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (body: UpdateUserRequest) => updateUser(user.id, body),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usersAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.assignees });
      toast.success(`${updated.name} updated`);
    },
    onError: (error) =>
      toast.error(`Could not update ${user.name}`, {
        description: errorMessage(error, 'Try again.'),
      }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${user.name}`}
          disabled={update.isPending}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Role</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={user.role}
          onValueChange={(value) => {
            const role = USER_ROLES.find((option) => option === value);
            if (role && role !== user.role) {
              update.mutate({ role });
            }
          }}
        >
          {USER_ROLES.map((role) => (
            <DropdownMenuRadioItem key={role} value={role} disabled={isSelf}>
              {USER_ROLE_LABELS[role]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSelf}
          variant={user.isActive ? 'destructive' : 'default'}
          onSelect={() => update.mutate({ isActive: !user.isActive })}
        >
          {user.isActive ? 'Deactivate and sign out' : 'Reactivate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
