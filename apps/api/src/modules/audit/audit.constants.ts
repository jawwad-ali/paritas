/**
 * Every audited action, as a dotted verb. Keep this list the single source of
 * truth so audit queries and dashboards can rely on stable names.
 */
export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REFRESH_REUSE_DETECTED: 'auth.refresh_reuse_detected',
  AUTH_PASSWORD_CHANGED: 'auth.password_changed',
  USER_CREATED: 'user.create',
  USER_UPDATED: 'user.update',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITY_TYPES = {
  USER: 'user',
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];
