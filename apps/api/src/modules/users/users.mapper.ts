import type { UserDto, UserSummaryDto } from '@paritas/shared';
import type { User } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';

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

/** Columns needed to show who did something; use as a Prisma `select`. */
export const USER_SUMMARY_SELECT = { id: true, name: true, email: true } as const;

export const toUserSummaryDto = (user: Pick<User, 'id' | 'name' | 'email'>): UserSummaryDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
});
