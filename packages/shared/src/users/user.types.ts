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
