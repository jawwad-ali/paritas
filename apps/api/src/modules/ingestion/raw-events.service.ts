import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListRawEventsQuery,
  Paginated,
  RawEventDetailDto,
  RawEventDto,
} from '@paritas/shared';
import { type Prisma, RawEventStatus } from '../../generated/prisma/client.js';
import { toPaginated, toSkipTake } from '../../common/pagination/pagination.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { toRawEventDetailDto, toRawEventDto } from '../transactions/transactions.mapper.js';
import { RawEventDispatcher } from './raw-event-dispatcher.js';

/** Only events that did not produce a transaction can be replayed. */
const REPLAYABLE_STATUSES: readonly RawEventStatus[] = [
  RawEventStatus.FAILED,
  RawEventStatus.IGNORED,
];

@Injectable()
export class RawEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: RawEventDispatcher,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListRawEventsQuery): Promise<Paginated<RawEventDto>> {
    const where: Prisma.RawEventWhereInput = {
      source: query.source ? { code: query.source } : undefined,
      status: query.status,
      eventType: query.eventType,
      receivedAt: { gte: query.from, lte: query.to },
    };
    // Rows and count run in parallel on separate connections: under READ COMMITTED a
    // batch transaction would add no consistency, only serialise them on one.
    const [rows, total] = await Promise.all([
      this.prisma.rawEvent.findMany({
        where,
        include: { source: true },
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
      }),
      this.prisma.rawEvent.count({ where }),
    ]);
    return toPaginated(rows.map(toRawEventDto), total, query);
  }

  async getById(id: string): Promise<RawEventDetailDto> {
    const event = await this.prisma.rawEvent.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!event) {
      throw new NotFoundException(`Raw event ${id} not found.`);
    }
    return toRawEventDetailDto(event);
  }

  /** Re-processes a failed or ignored event, e.g. after a normaliser fix or re-enabling a source. */
  async replay(id: string): Promise<RawEventDetailDto> {
    const event = await this.prisma.rawEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Raw event ${id} not found.`);
    }
    if (!REPLAYABLE_STATUSES.includes(event.status)) {
      throw new ConflictException(
        `Only FAILED or IGNORED events can be replayed (this one is ${event.status}).`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rawEvent.update({
        where: { id },
        data: { status: RawEventStatus.RECEIVED, error: null, processedAt: null },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.RAW_EVENT_REPLAYED,
          entityType: AUDIT_ENTITY_TYPES.RAW_EVENT,
          entityId: id,
          changes: { before: { status: event.status, error: event.error } },
        },
        tx,
      );
    });

    await this.dispatcher.replay(id);
    return this.getById(id);
  }
}
