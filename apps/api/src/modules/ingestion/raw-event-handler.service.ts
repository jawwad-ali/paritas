import { Injectable, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { RawEventStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { ReconciliationQueueService } from '../reconciliation/reconciliation-queue.service.js';
import { isSourceCode } from '../sources/sources.mapper.js';
import { InvalidEventPayloadError } from './ingestion.errors.js';
import { NormalizerRegistry } from './normalizer-registry.js';
import { TransactionWriter } from './transaction-writer.service.js';

const MAX_ERROR_LENGTH = 2_000;

const describe = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, MAX_ERROR_LENGTH);

/** Normalises one raw event into a transaction. Idempotent: safe to run more than once. */
@Injectable()
export class RawEventHandler {
  private readonly logger = new Logger(RawEventHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizers: NormalizerRegistry,
    private readonly writer: TransactionWriter,
    private readonly reconciliation: ReconciliationQueueService,
  ) {}

  /**
   * @param isFinalAttempt when true, a failure marks the event FAILED (no retries left).
   * @throws UnrecoverableError for invalid payloads, so the queue does not retry them.
   */
  async handle(rawEventId: string, isFinalAttempt: boolean): Promise<void> {
    const rawEvent = await this.prisma.rawEvent.findUnique({
      where: { id: rawEventId },
      include: { source: true },
    });
    if (rawEvent?.status !== RawEventStatus.RECEIVED) {
      return; // Unknown, or already handled by an earlier attempt.
    }
    if (!isSourceCode(rawEvent.source.code)) {
      throw new UnrecoverableError(`Unknown source "${rawEvent.source.code}".`);
    }

    try {
      const result = this.normalizers.get(rawEvent.source.code).normalize(rawEvent.payload);

      if (result.kind === 'ignored') {
        await this.markDone(rawEventId, RawEventStatus.IGNORED, result.reason);
        return;
      }

      const written = await this.prisma.$transaction(async (tx) => {
        const write = await this.writer.apply(
          tx,
          rawEvent.sourceId,
          rawEventId,
          result.transaction,
        );
        await tx.rawEvent.update({
          where: { id: rawEventId },
          data: { status: RawEventStatus.PROCESSED, processedAt: new Date(), error: null },
        });
        return write;
      });

      if (written.changed) {
        await this.enqueueMatchSafely(written.transactionId);
      }
    } catch (error) {
      if (error instanceof InvalidEventPayloadError) {
        await this.markDone(rawEventId, RawEventStatus.FAILED, error.message);
        throw new UnrecoverableError(error.message);
      }
      if (isFinalAttempt) {
        await this.markDone(rawEventId, RawEventStatus.FAILED, describe(error));
      }
      this.logger.warn({ err: error, rawEventId, isFinalAttempt }, 'Raw event processing failed.');
      throw error;
    }
  }

  /**
   * The transaction is already committed, so a queue hiccup must not fail (and
   * retry) the raw event. The matching engine's periodic sweep of unmatched
   * transactions picks up anything that missed its job.
   */
  private async enqueueMatchSafely(transactionId: string): Promise<void> {
    try {
      await this.reconciliation.enqueueMatch(transactionId);
    } catch (error) {
      this.logger.error({ err: error, transactionId }, 'Failed to enqueue matching job.');
    }
  }

  private async markDone(id: string, status: RawEventStatus, error: string | null): Promise<void> {
    await this.prisma.rawEvent.update({
      where: { id },
      data: { status, error, processedAt: new Date() },
    });
  }
}
