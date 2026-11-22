import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { SourceCode } from '@paritas/shared';
import type { Queue } from 'bullmq';
import { RawEventStatus } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../common/database/prisma-errors.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { INGESTION_JOBS, QUEUES } from '../../infrastructure/queue/queue.constants.js';
import { SourcesService } from '../sources/sources.service.js';
import type { InboundEvent, ProcessRawEventJob, ReceiveResult } from './ingestion.types.js';

const SOURCE_DISABLED_REASON = 'Source is disabled; event stored but not processed.';

/**
 * Entry point for every source. Receiving is deliberately minimal (persist the
 * raw event, enqueue it) so webhooks are acknowledged in milliseconds; all the
 * real work happens in the worker, with retries.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    @InjectQueue(QUEUES.INGESTION) private readonly queue: Queue,
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
      await this.enqueueSafely(rawEventId);
    }
    return { rawEventId, duplicate: false };
  }

  /**
   * jobId = rawEventId makes enqueueing idempotent: while a job for the event
   * exists, adding it again is a no-op.
   */
  async enqueue(rawEventId: string): Promise<void> {
    const job: ProcessRawEventJob = { rawEventId };
    await this.queue.add(INGESTION_JOBS.PROCESS_RAW_EVENT, job, { jobId: rawEventId });
  }

  /**
   * The raw event is already durable. If Redis is briefly unavailable we still
   * acknowledge the webhook; the sweeper re-enqueues the event shortly after.
   */
  private async enqueueSafely(rawEventId: string): Promise<void> {
    try {
      await this.enqueue(rawEventId);
    } catch (error) {
      this.logger.error(
        { err: error, rawEventId },
        'Failed to enqueue raw event; the sweeper will retry.',
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
