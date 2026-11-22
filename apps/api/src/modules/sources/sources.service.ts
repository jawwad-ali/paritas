import { Injectable, NotFoundException } from '@nestjs/common';
import type { SourceCode, SourceDto, UpdateSourceRequest } from '@paritas/shared';
import type { Source } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { toSourceDto } from './sources.mapper.js';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Throws if the source was never seeded: a deployment error, not a client error. */
  async getByCode(code: SourceCode): Promise<Source> {
    const source = await this.prisma.source.findUnique({ where: { code } });
    if (!source) {
      throw new Error(`Source "${code}" is not configured. Run the database seed.`);
    }
    return source;
  }

  async list(): Promise<SourceDto[]> {
    const [sources, transactionCounts, lastEvents] = await Promise.all([
      this.prisma.source.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.transaction.groupBy({ by: ['sourceId'], _count: { _all: true } }),
      this.prisma.rawEvent.groupBy({ by: ['sourceId'], _max: { receivedAt: true } }),
    ]);

    const countBySource = new Map(transactionCounts.map((row) => [row.sourceId, row._count._all]));
    const lastEventBySource = new Map(lastEvents.map((row) => [row.sourceId, row._max.receivedAt]));

    return sources.map((source) =>
      toSourceDto(source, {
        transactionCount: countBySource.get(source.id) ?? 0,
        lastEventReceivedAt: lastEventBySource.get(source.id) ?? null,
      }),
    );
  }

  /** A disabled source still has its events stored (for audit) but they are not processed. */
  async update(id: string, request: UpdateSourceRequest): Promise<SourceDto> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.source.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Source ${id} not found.`);
      }
      await tx.source.update({ where: { id }, data: { isActive: request.isActive } });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.SOURCE_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.SOURCE,
          entityId: id,
          changes: {
            before: { isActive: existing.isActive },
            after: { isActive: request.isActive },
          },
        },
        tx,
      );
    });

    const updated = (await this.list()).find((source) => source.id === id);
    if (!updated) {
      throw new NotFoundException(`Source ${id} not found.`);
    }
    return updated;
  }
}
