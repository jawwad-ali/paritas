import { ConflictException, Injectable } from '@nestjs/common';
import type { ExceptionDetailDto } from '@paritas/shared';
import {
  ExceptionActivityType,
  ExceptionStatus,
  type Prisma,
} from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import {
  ACTIVITY_MESSAGES,
  CLOSED_STATUSES,
  CONCURRENT_CHANGE_MESSAGE,
  TRANSITIONS,
} from './exceptions.constants.js';
import { assertCanIgnore, assertTransitionAllowed } from './exceptions.policy.js';
import type { LockedException, TransitionInput } from './exceptions.types.js';
import { appendActivities } from './exception-activities.js';
import { ExceptionLifecycle } from './exception-lifecycle.service.js';
import { ExceptionsQueryService } from './exceptions-query.service.js';

type Tx = Prisma.TransactionClient;
type StatusAction = 'investigate' | 'resolve' | 'ignore' | 'reopen';

/** Moves an exception through its state machine (see TRANSITIONS). */
@Injectable()
export class ExceptionTransitionsService {
  constructor(
    private readonly audit: AuditService,
    private readonly lifecycle: ExceptionLifecycle,
    private readonly query: ExceptionsQueryService,
  ) {}

  async transition(
    id: string,
    action: StatusAction,
    input: TransitionInput,
    actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    const transition = TRANSITIONS[action];
    const freed = await this.lifecycle.withLockedException(id, async (tx, exception) => {
      assertTransitionAllowed(exception.status, transition);
      if (action === 'ignore') {
        assertCanIgnore(actor, exception.severity);
      }
      const autoAssign = action === 'investigate' && exception.assigneeId === null;

      const { count } = await tx.reconciliationException.updateMany({
        // Conditional on what was read: a concurrent change makes this a no-op (409).
        where: { id, status: exception.status, ...(autoAssign && { assigneeId: null }) },
        data: this.statusData(transition.to, input.reason, actor, autoAssign),
      });
      if (count === 0) {
        throw new ConflictException(CONCURRENT_CHANGE_MESSAGE);
      }
      await this.recordActivities(tx, exception, action, input, actor, autoAssign);
      await this.audit.record(
        {
          action: transition.audit,
          entityType: AUDIT_ENTITY_TYPES.EXCEPTION,
          entityId: id,
          changes: { before: { status: exception.status }, after: { status: transition.to } },
          details: { ...(input.reason && { reason: input.reason }) },
        },
        tx,
      );

      if (action === 'reopen') {
        await this.lifecycle.applyReopen(tx, exception);
        return [];
      }
      return CLOSED_STATUSES.includes(transition.to)
        ? this.lifecycle.applyClosure(tx, exception)
        : [];
    });

    await this.lifecycle.release(freed);
    return this.query.getById(id);
  }

  /** Closing stamps who/when/why; reopening clears it (a DB CHECK enforces the pairing). */
  private statusData(
    to: ExceptionStatus,
    reason: string | undefined,
    actor: RequestActor,
    autoAssign: boolean,
  ): Prisma.ReconciliationExceptionUncheckedUpdateManyInput {
    if (CLOSED_STATUSES.includes(to)) {
      return {
        status: to,
        resolvedAt: new Date(),
        resolvedById: actor.id,
        resolutionReason: reason ?? null,
      };
    }
    if (to === ExceptionStatus.OPEN) {
      return { status: to, resolvedAt: null, resolvedById: null, resolutionReason: null };
    }
    return { status: to, ...(autoAssign && { assigneeId: actor.id }) };
  }

  private async recordActivities(
    tx: Tx,
    exception: LockedException,
    action: StatusAction,
    input: TransitionInput,
    actor: RequestActor,
    autoAssign: boolean,
  ): Promise<void> {
    const base = { exceptionId: exception.id, actorId: actor.id };
    const to = TRANSITIONS[action].to;
    const activities: Prisma.ExceptionActivityCreateManyInput[] = [
      {
        ...base,
        type:
          action === 'reopen'
            ? ExceptionActivityType.REOPENED
            : ExceptionActivityType.STATUS_CHANGED,
        message: input.reason ?? ACTIVITY_MESSAGES.INVESTIGATION_STARTED,
        data: { from: exception.status, to },
      },
    ];
    if (autoAssign) {
      activities.push({
        ...base,
        type: ExceptionActivityType.ASSIGNED,
        message: ACTIVITY_MESSAGES.SELF_ASSIGNED,
        data: { from: null, to: actor.id },
      });
    }
    if (input.note) {
      activities.push({ ...base, type: ExceptionActivityType.NOTE_ADDED, message: input.note });
    }
    await appendActivities(tx, activities);
  }
}
