import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ExceptionSeverity, type ExceptionStatus } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { SUPERVISOR_ROLES, type Transition } from './exceptions.constants.js';

/** Who may do what with an exception, beyond the route-level role checks. */

export const isSupervisor = (actor: RequestActor): boolean => SUPERVISOR_ROLES.includes(actor.role);

export const assertTransitionAllowed = (status: ExceptionStatus, transition: Transition): void => {
  if (!transition.from.includes(status)) {
    throw new ConflictException(
      `This exception is ${status}; it can be ${transition.verb} only when ${transition.from.join(' or ')}.`,
    );
  }
};

/** Officers may take an unassigned exception or release their own; supervisors may assign anyone. */
export const assertCanAssign = (
  actor: RequestActor,
  currentAssigneeId: string | null,
  nextAssigneeId: string | null,
): void => {
  if (isSupervisor(actor)) {
    return;
  }
  const takesUnassigned = currentAssigneeId === null && nextAssigneeId === actor.id;
  const releasesOwn = currentAssigneeId === actor.id && nextAssigneeId === null;
  if (!takesUnassigned && !releasesOwn) {
    throw new ForbiddenException(
      'Officers can only take unassigned exceptions or release their own.',
    );
  }
};

/** Writing off a critical discrepancy needs a second level of authority. */
export const assertCanIgnore = (actor: RequestActor, severity: ExceptionSeverity): void => {
  if (severity === ExceptionSeverity.CRITICAL && !isSupervisor(actor)) {
    throw new ForbiddenException('Ignoring a critical exception requires a manager or an admin.');
  }
};
