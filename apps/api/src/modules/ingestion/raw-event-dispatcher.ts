import { getQueueToken } from '@nestjs/bullmq';
import { Logger, type Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { AppConfigService } from '../../config/app-config.service.js';
import { INGESTION_JOBS, QUEUES } from '../../infrastructure/queue/queue.constants.js';
import type { ProcessRawEventJob } from './ingestion.types.js';
import { RawEventHandler } from './raw-event-handler.service.js';

/**
 * Hands a stored raw event to the normaliser. The queue runner does it on a
 * BullMQ worker (retries with backoff); the inline runner does it inside the
 * request that received the event, for hosts with no long-running worker.
 */
export abstract class RawEventDispatcher {
  /** First attempt, right after the webhook stored the event. */
  abstract dispatch(rawEventId: string): Promise<void>;
  /** The stuck-event sweep: the event is still RECEIVED a while after it arrived. */
  abstract retry(rawEventId: string): Promise<void>;
  /** An admin replay of a FAILED or IGNORED event (already reset to RECEIVED). */
  abstract replay(rawEventId: string): Promise<void>;
}

class QueueRawEventDispatcher extends RawEventDispatcher {
  constructor(private readonly queue: Queue) {
    super();
  }

  /** jobId = rawEventId: while a job for the event exists, adding it again is a no-op. */
  async dispatch(rawEventId: string): Promise<void> {
    const job: ProcessRawEventJob = { rawEventId };
    await this.queue.add(INGESTION_JOBS.PROCESS_RAW_EVENT, job, { jobId: rawEventId });
  }

  retry(rawEventId: string): Promise<void> {
    return this.dispatch(rawEventId);
  }

  async replay(rawEventId: string): Promise<void> {
    // A retained failed job with the same id would make the new add a no-op.
    await this.queue.remove(rawEventId);
    await this.dispatch(rawEventId);
  }
}

class InlineRawEventDispatcher extends RawEventDispatcher {
  private readonly logger = new Logger(InlineRawEventDispatcher.name);

  /** Resolved on first use: the handler is built in the same module as this dispatcher. */
  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  /** Not the last chance: a failure leaves the event RECEIVED for the sweep to retry. */
  dispatch(rawEventId: string): Promise<void> {
    return this.run(rawEventId, false);
  }

  /** The sweep's attempt is the last one: a failure marks the event FAILED, open to replay. */
  retry(rawEventId: string): Promise<void> {
    return this.run(rawEventId, true);
  }

  replay(rawEventId: string): Promise<void> {
    return this.run(rawEventId, true);
  }

  /** The event is already stored; a processing error is recorded on it, never thrown to the caller. */
  private async run(rawEventId: string, isFinalAttempt: boolean): Promise<void> {
    try {
      await this.moduleRef.get(RawEventHandler).handle(rawEventId, isFinalAttempt);
    } catch (error) {
      this.logger.warn(
        { err: error, rawEventId, isFinalAttempt },
        'Inline raw event processing failed.',
      );
    }
  }
}

export const rawEventDispatcherProvider: Provider = {
  provide: RawEventDispatcher,
  inject: [AppConfigService, ModuleRef],
  useFactory: (config: AppConfigService, moduleRef: ModuleRef): RawEventDispatcher =>
    config.runsJobsInline
      ? new InlineRawEventDispatcher(moduleRef)
      : new QueueRawEventDispatcher(
          moduleRef.get<Queue>(getQueueToken(QUEUES.INGESTION), { strict: false }),
        ),
};
