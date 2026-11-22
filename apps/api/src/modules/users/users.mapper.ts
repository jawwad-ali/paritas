import type { UserDto, UserRole as SharedUserRole } from '@paritas/shared';
import type { User, UserRole as DbUserRole } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';

/**
 * Compile-time guard: the shared contract's roles and the database enum must be
 * identical. If someone adds a role to one and not the other, this line fails to compile.
 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const ROLES_IN_SYNC: Exact<SharedUserRole, DbUserRole> = true;

/** Strips credentials and converts dates; the only way a user leaves the API. */
export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export const toRequestActor = (user: Pick<User, 'id' | 'email' | 'role'>): RequestActor => ({
  id: user.id,
  email: user.email,
  role: user.role,
});
