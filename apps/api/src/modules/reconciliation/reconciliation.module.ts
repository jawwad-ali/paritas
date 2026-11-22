import { Module } from '@nestjs/common';
import { ReconciliationQueueService } from './reconciliation-queue.service.js';

/** Matching engine. Phase 2 provides the producer; Phase 3 adds the worker. */
@Module({
  providers: [ReconciliationQueueService],
  exports: [ReconciliationQueueService],
})
export class ReconciliationModule {}
