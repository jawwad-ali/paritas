import { Injectable, Logger } from '@nestjs/common';
import type { SourceCode } from '@paritas/shared';
import { RawEventStatus } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../common/database/prisma-errors.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { SourcesService } from '../sources/sources.service.js';
import type { InboundEvent, ReceiveResult } from './ingestion.types.js';
import { RawEventDispatcher } from './raw-event-dispatcher.js';

const SOURCE_DISABLED_REASON = 'Source is disabled; event stored but not processed.';

/**
 * Entry point for every source. Receiving is deliberately minimal (persist the
 * raw event, dispatch it) so webhooks are acknowledged in milliseconds; with the
 * queue runner all the real work happens in the worker, with retries.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    private readonly dispatcher: RawEventDispatcher,
  ) {}

  async receive(sourceCode: SourceCode, event: InboundEvent): Promise<ReceiveResult> {
    const source = await this.sources.getByCode(sourceCode);

    let rawEventId: string;
    try {
      const stored = await this.prisma.rawEvent.create({
        data: {
          sourceId: source.id,
          externalEventId: event.externalEventId,
          eventType: event.eventType,
          payload: event.payload,
          status: source.isActive ? RawEventStatus.RECEIVED : RawEventStatus.IGNORED,
          error: source.isActive ? null : SOURCE_DISABLED_REASON,
        },
        select: { id: true },
      });
      rawEventId = stored.id;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return this.duplicateOf(source.id, event.externalEventId);
      }
      throw error;
    }

    if (source.isActive) {
      await this.dispatchSafely(rawEventId);
    }
    return { rawEventId, duplicate: false };
  }

  /**
   * The raw event is already durable. If Redis is briefly unavailable we still
   * acknowledge the webhook; the sweeper dispatches the event again shortly after.
   */
  private async dispatchSafely(rawEventId: string): Promise<void> {
    try {
      await this.dispatcher.dispatch(rawEventId);
    } catch (error) {
      this.logger.error(
        { err: error, rawEventId },
        'Failed to dispatch raw event; the sweeper will retry.',
      );
    }
  }

  private async duplicateOf(sourceId: string, externalEventId: string): Promise<ReceiveResult> {
    const existing = await this.prisma.rawEvent.findUniqueOrThrow({
      where: { sourceId_externalEventId: { sourceId, externalEventId } },
      select: { id: true },
    });
    return { rawEventId: existing.id, duplicate: true };
  }
}
