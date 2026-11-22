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
  SOURCE_UPDATED: 'source.update',
  RAW_EVENT_REPLAYED: 'raw_event.replay',
  SIMULATOR_RUN: 'simulator.run',
  EXCEPTION_NOTE_ADDED: 'exception.note',
  EXCEPTION_ASSIGNED: 'exception.assign',
  EXCEPTION_SEVERITY_CHANGED: 'exception.severity_change',
  EXCEPTION_INVESTIGATION_STARTED: 'exception.investigate',
  EXCEPTION_RESOLVED: 'exception.resolve',
  EXCEPTION_IGNORED: 'exception.ignore',
  EXCEPTION_REOPENED: 'exception.reopen',
  EXCEPTION_MANUALLY_MATCHED: 'exception.manual_match',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITY_TYPES = {
  USER: 'user',
  SOURCE: 'source',
  RAW_EVENT: 'raw_event',
  EXCEPTION: 'exception',
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];
