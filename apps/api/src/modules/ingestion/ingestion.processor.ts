import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { INGESTION_JOBS, QUEUES } from '../../infrastructure/queue/queue.constants.js';
import type { ProcessRawEventJob } from './ingestion.types.js';
import { RawEventHandler } from './raw-event-handler.service.js';
import { RawEventSweeper } from './raw-event-sweeper.service.js';

const INGESTION_CONCURRENCY = 5;

const isProcessRawEventJob = (data: unknown): data is ProcessRawEventJob =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as Record<string, unknown>)['rawEventId'] === 'string';

/** BullMQ worker for the ingestion queue. Thin: dispatches to the handlers. */
@Processor(QUEUES.INGESTION, { concurrency: INGESTION_CONCURRENCY })
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly handler: RawEventHandler,
    private readonly sweeper: RawEventSweeper,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case INGESTION_JOBS.PROCESS_RAW_EVENT: {
        if (!isProcessRawEventJob(job.data)) {
          this.logger.error({ jobId: job.id }, 'Malformed process-raw-event job; dropping.');
          return;
        }
        // attemptsMade counts finished attempts, so this run is attempt attemptsMade + 1.
        const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
        await this.handler.handle(job.data.rawEventId, isFinalAttempt);
        return;
      }
      case INGESTION_JOBS.SWEEP_STUCK_RAW_EVENTS:
        await this.sweeper.sweep();
        return;
      default:
        this.logger.error({ jobId: job.id, name: job.name }, 'Unknown ingestion job; dropping.');
    }
  }
}
