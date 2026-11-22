/** Mirrors the `UserRole` enum in the API's Prisma schema (checked at compile time there). */
export const USER_ROLES = ['ADMIN', 'MANAGER', 'OFFICER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Operations Manager',
  OFFICER: 'Reconciliation Officer',
};
