import type { UserRole } from '@paritas/shared';
import { ExceptionStatus } from '../../generated/prisma/client.js';
import { AUDIT_ACTIONS, type AuditAction } from '../audit/audit.constants.js';

export const OPEN_STATUSES: readonly ExceptionStatus[] = [
  ExceptionStatus.OPEN,
  ExceptionStatus.INVESTIGATING,
];
export const CLOSED_STATUSES: readonly ExceptionStatus[] = [
  ExceptionStatus.RESOLVED,
  ExceptionStatus.IGNORED,
];

export type WorkflowAction = 'investigate' | 'resolve' | 'ignore' | 'reopen' | 'match';

export interface Transition {
  /** Statuses the action is allowed from. */
  from: readonly ExceptionStatus[];
  to: ExceptionStatus;
  audit: AuditAction;
  /** Past tense, for messages ("can be resolved only when…"). */
  verb: string;
}

/**
 * The exception state machine. Anything not listed is rejected with 409.
 *
 *   OPEN ──investigate──► INVESTIGATING
 *   OPEN | INVESTIGATING ──resolve | match──► RESOLVED
 *   OPEN | INVESTIGATING ──ignore──► IGNORED
 *   RESOLVED | IGNORED ──reopen──► OPEN
 */
export const TRANSITIONS: Record<WorkflowAction, Transition> = {
  investigate: {
    from: [ExceptionStatus.OPEN],
    to: ExceptionStatus.INVESTIGATING,
    audit: AUDIT_ACTIONS.EXCEPTION_INVESTIGATION_STARTED,
    verb: 'put under investigation',
  },
  resolve: {
    from: OPEN_STATUSES,
    to: ExceptionStatus.RESOLVED,
    audit: AUDIT_ACTIONS.EXCEPTION_RESOLVED,
    verb: 'resolved',
  },
  ignore: {
    from: OPEN_STATUSES,
    to: ExceptionStatus.IGNORED,
    audit: AUDIT_ACTIONS.EXCEPTION_IGNORED,
    verb: 'ignored',
  },
  reopen: {
    from: CLOSED_STATUSES,
    to: ExceptionStatus.OPEN,
    audit: AUDIT_ACTIONS.EXCEPTION_REOPENED,
    verb: 'reopened',
  },
  match: {
    from: OPEN_STATUSES,
    to: ExceptionStatus.RESOLVED,
    audit: AUDIT_ACTIONS.EXCEPTION_MANUALLY_MATCHED,
    verb: 'manually matched',
  },
};

/** Roles that may override: assign anyone, change severity, ignore critical exceptions. */
export const SUPERVISOR_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export const ACTIVITY_MESSAGES = {
  INVESTIGATION_STARTED: 'Investigation started.',
  UNASSIGNED: 'Unassigned.',
  SELF_ASSIGNED: 'Self-assigned on starting the investigation.',
  assignedTo: (name: string): string => `Assigned to ${name}.`,
} as const;

export const CONCURRENT_CHANGE_MESSAGE =
  'The exception was changed by someone else. Reload it and try again.';

/** "EX-1042" or "1042" as typed into a search box. */
export const EXCEPTION_NUMBER_PATTERN = /^(?:EX-?)?(\d{1,9})$/i;
