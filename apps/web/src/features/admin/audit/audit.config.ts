/** The API's audit actions (apps/api/src/modules/audit/audit.constants.ts), in words. */
export const AUDIT_ACTION_LABELS = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.logout': 'Signed out',
  'auth.refresh_reuse_detected': 'Session theft blocked',
  'auth.password_changed': 'Changed password',
  'user.create': 'Added a user',
  'user.update': 'Updated a user',
  'source.update': 'Paused or resumed a source',
  'raw_event.replay': 'Replayed an event',
  'simulator.run': 'Ran a simulation',
  'exception.note': 'Added a note',
  'exception.assign': 'Assigned an exception',
  'exception.severity_change': 'Changed severity',
  'exception.investigate': 'Started investigating',
  'exception.resolve': 'Resolved an exception',
  'exception.ignore': 'Ignored an exception',
  'exception.reopen': 'Reopened an exception',
  'exception.manual_match': 'Matched manually',
  'matching_config.update': 'Changed matching rules',
  'report.export': 'Exported a report',
} as const;

export const AUDIT_ACTIONS = Object.keys(
  AUDIT_ACTION_LABELS,
) as (keyof typeof AUDIT_ACTION_LABELS)[];

export const ENTITY_LABELS: Record<string, string> = {
  user: 'User',
  source: 'Source',
  raw_event: 'Raw event',
  exception: 'Exception',
  matching_config: 'Matching rules',
};

export const ENTITY_TYPES = [
  'exception',
  'user',
  'source',
  'raw_event',
  'matching_config',
] as const;
