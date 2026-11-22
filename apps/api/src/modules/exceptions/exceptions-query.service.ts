import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type AssigneeDto,
  EXCEPTION_SEVERITIES,
  EXCEPTION_STATUSES,
  EXCEPTION_TYPES,
  type ExceptionDetailDto,
  type ExceptionDto,
  type ExceptionStatsDto,
  type ListExceptionsQuery,
  type Paginated,
} from '@paritas/shared';
import { toPaginated, toSkipTake } from '../../common/pagination/pagination.js';
import { countsBy } from '../../common/utils/counts.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { OPEN_STATUSES } from './exceptions.constants.js';
import { buildExceptionWhere, EXCEPTION_ORDER_BY } from './exceptions.filters.js';
import { EXCEPTION_DETAIL_INCLUDE, EXCEPTION_LIST_INCLUDE } from './exceptions.includes.js';
import { toExceptionDetailDto, toExceptionDto } from './exceptions.mapper.js';

/** Read side of exception management: the queue, the counts, and the investigation view. */
@Injectable()
export class ExceptionsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListExceptionsQuery, actor: RequestActor): Promise<Paginated<ExceptionDto>> {
    const where = buildExceptionWhere(
      { ...query, createdAt: { gte: query.from, lte: query.to } },
      actor,
    );
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.reconciliationException.findMany({
        where,
        include: EXCEPTION_LIST_INCLUDE,
        orderBy: EXCEPTION_ORDER_BY[query.sort],
        ...toSkipTake(query),
      }),
      this.prisma.reconciliationException.count({ where }),
    ]);
    return toPaginated(rows.map(toExceptionDto), total, query);
  }

  async getById(id: string): Promise<ExceptionDetailDto> {
    const row = await this.prisma.reconciliationException.findUnique({
      where: { id },
      include: EXCEPTION_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`Exception ${id} not found.`);
    }
    return toExceptionDetailDto(row);
  }

  async stats(actor: RequestActor): Promise<ExceptionStatsDto> {
    const open = { status: { in: [...OPEN_STATUSES] } };
    const exceptions = this.prisma.reconciliationException;
    const [byStatus, bySeverity, byType, assignedToMe, unassigned] = await Promise.all([
      exceptions.groupBy({ by: ['status'], _count: { _all: true } }),
      exceptions.groupBy({ by: ['severity'], where: open, _count: { _all: true } }),
      exceptions.groupBy({ by: ['type'], where: open, _count: { _all: true } }),
      exceptions.count({ where: { ...open, assigneeId: actor.id } }),
      exceptions.count({ where: { ...open, assigneeId: null } }),
    ]);
    return {
      byStatus: countsBy(
        EXCEPTION_STATUSES,
        byStatus.map((row) => ({ key: row.status, count: row._count._all })),
      ),
      openBySeverity: countsBy(
        EXCEPTION_SEVERITIES,
        bySeverity.map((row) => ({ key: row.severity, count: row._count._all })),
      ),
      openByType: countsBy(
        EXCEPTION_TYPES,
        byType.map((row) => ({ key: row.type, count: row._count._all })),
      ),
      openAssignedToMe: assignedToMe,
      openUnassigned: unassigned,
    };
  }

  /** Active users, for the "assign to" picker. */
  async assignees(): Promise<AssigneeDto[]> {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }
}
