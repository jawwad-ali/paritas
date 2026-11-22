import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  AddExceptionNoteRequest,
  AssignExceptionRequest,
  ChangeExceptionSeverityRequest,
  ExceptionDetailDto,
} from '@paritas/shared';
import {
  ExceptionActivityType,
  type Prisma,
  type ReconciliationException,
  type User,
} from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import {
  ACTIVITY_MESSAGES,
  CONCURRENT_CHANGE_MESSAGE,
  OPEN_STATUSES,
} from './exceptions.constants.js';
import { assertCanAssign } from './exceptions.policy.js';
import { ExceptionsQueryService } from './exceptions-query.service.js';

type Tx = Prisma.TransactionClient;
type ExceptionHead = Pick<ReconciliationException, 'id' | 'status' | 'severity' | 'assigneeId'>;

/**
 * Notes, assignment and severity: changes that do not touch transactions.
 * Every change appends to the exception's timeline and to the audit log, in
 * the same database transaction.
 */
@Injectable()
export class ExceptionWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly query: ExceptionsQueryService,
  ) {}

  async addNote(
    id: string,
    request: AddExceptionNoteRequest,
    actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      await this.findOrThrow(tx, id);
      await tx.exceptionActivity.create({
        data: {
          exceptionId: id,
          actorId: actor.id,
          type: ExceptionActivityType.NOTE_ADDED,
          message: request.message,
        },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.EXCEPTION_NOTE_ADDED,
          entityType: AUDIT_ENTITY_TYPES.EXCEPTION,
          entityId: id,
          changes: { note: request.message },
        },
        tx,
      );
    });
    return this.query.getById(id);
  }

  async assign(
    id: string,
    { assigneeId }: AssignExceptionRequest,
    actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      const exception = await this.findOpenOrThrow(tx, id, 'assigned');
      if (exception.assigneeId === assigneeId) {
        return; // Already so: nothing to record.
      }
      assertCanAssign(actor, exception.assigneeId, assigneeId);
      const assignee = assigneeId ? await this.findActiveUser(tx, assigneeId) : null;

      const { count } = await tx.reconciliationException.updateMany({
        where: { id, assigneeId: exception.assigneeId, status: { in: [...OPEN_STATUSES] } },
        data: { assigneeId },
      });
      if (count === 0) {
        throw new ConflictException(CONCURRENT_CHANGE_MESSAGE);
      }
      await tx.exceptionActivity.create({
        data: {
          exceptionId: id,
          actorId: actor.id,
          type: ExceptionActivityType.ASSIGNED,
          message: assignee
            ? ACTIVITY_MESSAGES.assignedTo(assignee.name)
            : ACTIVITY_MESSAGES.UNASSIGNED,
          data: { from: exception.assigneeId, to: assigneeId },
        },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.EXCEPTION_ASSIGNED,
          entityType: AUDIT_ENTITY_TYPES.EXCEPTION,
          entityId: id,
          changes: { before: { assigneeId: exception.assigneeId }, after: { assigneeId } },
        },
        tx,
      );
    });
    return this.query.getById(id);
  }

  async changeSeverity(
    id: string,
    { severity, reason }: ChangeExceptionSeverityRequest,
    actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    await this.prisma.$transaction(async (tx) => {
      const exception = await this.findOpenOrThrow(tx, id, 're-prioritised');
      if (exception.severity === severity) {
        return;
      }
      const { count } = await tx.reconciliationException.updateMany({
        where: { id, severity: exception.severity, status: { in: [...OPEN_STATUSES] } },
        data: { severity },
      });
      if (count === 0) {
        throw new ConflictException(CONCURRENT_CHANGE_MESSAGE);
      }
      await tx.exceptionActivity.create({
        data: {
          exceptionId: id,
          actorId: actor.id,
          type: ExceptionActivityType.SEVERITY_CHANGED,
          message: reason,
          data: { from: exception.severity, to: severity },
        },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.EXCEPTION_SEVERITY_CHANGED,
          entityType: AUDIT_ENTITY_TYPES.EXCEPTION,
          entityId: id,
          changes: { before: { severity: exception.severity }, after: { severity } },
          details: { reason },
        },
        tx,
      );
    });
    return this.query.getById(id);
  }

  private async findOrThrow(tx: Tx, id: string): Promise<ExceptionHead> {
    const exception = await tx.reconciliationException.findUnique({
      where: { id },
      select: { id: true, status: true, severity: true, assigneeId: true },
    });
    if (!exception) {
      throw new NotFoundException(`Exception ${id} not found.`);
    }
    return exception;
  }

  private async findOpenOrThrow(tx: Tx, id: string, verb: string): Promise<ExceptionHead> {
    const exception = await this.findOrThrow(tx, id);
    if (!OPEN_STATUSES.includes(exception.status)) {
      throw new ConflictException(
        `This exception is ${exception.status}; only open exceptions can be ${verb}. Reopen it first.`,
      );
    }
    return exception;
  }

  private async findActiveUser(tx: Tx, userId: string): Promise<Pick<User, 'id' | 'name'>> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, isActive: true },
    });
    if (!user?.isActive) {
      throw new UnprocessableEntityException('Exceptions can only be assigned to an active user.');
    }
    return user;
  }
}
