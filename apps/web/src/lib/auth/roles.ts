import type { UserDto, UserRole } from '@paritas/shared';

export const hasRole = (user: Pick<UserDto, 'role'> | null, roles: readonly UserRole[]): boolean =>
  user !== null && roles.includes(user.role);

/** Managers and admins: assign anyone, change severity, ignore critical exceptions. */
export const SUPERVISOR_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];
export const ADMIN_ROLES: readonly UserRole[] = ['ADMIN'];
