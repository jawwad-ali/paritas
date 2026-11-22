import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service.js';
import { DEFAULT_JOB_OPTIONS, QUEUE_PREFIX, QUEUES } from './queue.constants.js';

/**
 * BullMQ on Redis. Queues decouple fast webhook acknowledgement from slower
 * processing, give retries with backoff, and let workers scale horizontally.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        prefix: QUEUE_PREFIX,
        // BullMQ workers block on Redis; they require maxRetriesPerRequest = null.
        connection: { url: config.get('REDIS_URL'), maxRetriesPerRequest: null },
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    }),
    BullModule.registerQueue({ name: QUEUES.INGESTION }, { name: QUEUES.RECONCILIATION }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
