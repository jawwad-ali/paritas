'use client';

import { USER_ROLE_LABELS, USER_ROLES, type UserRole } from '@paritas/shared';
import { PaginationBar } from '@/components/data/pagination-bar';
import { SearchBox } from '@/components/data/search-box';
import { SelectFilter } from '@/components/data/select-filter';
import { TableSkeleton } from '@/components/data/table-skeleton';
import { ErrorState } from '@/components/layout/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSearchState } from '@/hooks/use-search-state';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/format/time';
import { readEnum, readPage, readString } from '@/lib/url/search-params';
import { useUsers } from '../use-admin-queries';
import { CreateUserDialog } from './create-user-dialog';
import { UserActions } from './user-actions';

interface UserFilters {
  search?: string;
  role?: UserRole;
  page: number;
}

const parse = (params: URLSearchParams): UserFilters => ({
  search: readString(params, 'search'),
  role: readEnum(params, 'role', USER_ROLES),
  page: readPage(params),
});

/** Who can sign in and what each person may do. */
export const UsersView = () => {
  const [filters, setFilters] = useSearchState(parse);
  const query = useUsers(filters);
  const me = useAuth().user;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox
          label="Search users"
          placeholder="Name or email"
          value={filters.search}
          onChange={(search) => setFilters({ search })}
        />
        <SelectFilter
          label="Role"
          allLabel="All roles"
          options={USER_ROLES}
          labels={USER_ROLE_LABELS}
          value={filters.role}
          onChange={(role) => setFilters({ role })}
        />
        <div className="sm:ml-auto">
          <CreateUserDialog />
        </div>
      </div>
      {query.isPending ? (
        <TableSkeleton rows={4} columns={5} />
      ) : query.isError ? (
        <ErrorState
          title="Users could not load"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.data.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.isActive ? undefined : 'text-muted-foreground'}
                >
                  <TableCell className="pl-4">
                    <span className="block font-medium">
                      {user.name}
                      {user.id === me?.id && <span className="text-muted-foreground"> (you)</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
                  <TableCell>{user.isActive ? 'Active' : 'Deactivated'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <UserActions user={user} isSelf={user.id === me?.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {query.data && query.data.meta.totalItems > 0 && (
        <PaginationBar
          meta={query.data.meta}
          noun="users"
          onPageChange={(page) => setFilters({ page })}
        />
      )}
    </div>
  );
};
