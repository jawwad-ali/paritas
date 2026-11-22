import type { UserRole } from '../auth/roles.js';

/** Public representation of a user. Never includes credentials. */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  /** ISO-8601 timestamps. */
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Who did something: enough to render a name, nothing more. */
export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
}

/** A user who can be given exceptions to work on. */
export interface AssigneeDto extends UserSummaryDto {
  role: UserRole;
}
