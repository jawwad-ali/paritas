import { Injectable } from '@nestjs/common';
import type { AuditLogDto, ListAuditLogsQuery, Paginated } from '@paritas/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { toPaginated, toSkipTake } from '../../common/pagination/pagination.js';
import { RequestContextService } from '../../common/request-context/request-context.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toAuditLogDto } from './audit.mapper.js';
import type { AuditEntry, AuditWriter } from './audit.types.js';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  /**
   * Appends an audit record. Pass the transaction client (`tx`) when auditing a
   * change made inside a transaction, so the change and its audit record commit
   * or roll back together.
   */
  async record(entry: AuditEntry, writer: AuditWriter = this.prisma): Promise<void> {
    const { requestId, ip, userAgent, actor: contextActor } = this.context.get();
    const actor = entry.actor ?? contextActor;

    await writer.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        changes: entry.changes,
        metadata: {
          ...entry.details,
          ...(requestId && { requestId }),
          ...(ip && { ip }),
          ...(userAgent && { userAgent }),
        },
      },
    });
  }

  async list(query: ListAuditLogsQuery): Promise<Paginated<AuditLogDto>> {
    const where: Prisma.AuditLogWhereInput = {
      action: query.action,
      actorId: query.actorId,
      entityType: query.entityType,
      entityId: query.entityId,
      createdAt: { gte: query.from, lte: query.to },
    };

    // Rows and count run in parallel on separate connections: under READ COMMITTED a
    // batch transaction would add no consistency, only serialise them on one.
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return toPaginated(rows.map(toAuditLogDto), total, query);
  }
}
