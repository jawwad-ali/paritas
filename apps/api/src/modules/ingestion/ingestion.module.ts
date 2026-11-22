import { Module } from '@nestjs/common';
import { ReconciliationModule } from '../reconciliation/reconciliation.module.js';
import { SourcesModule } from '../sources/sources.module.js';
import { IngestionProcessor } from './ingestion.processor.js';
import { IngestionService } from './ingestion.service.js';
import { LedgerNormalizer } from './ledger/ledger.normalizer.js';
import { NormalizerRegistry } from './normalizer-registry.js';
import { RawEventHandler } from './raw-event-handler.service.js';
import { RawEventSweeper } from './raw-event-sweeper.service.js';
import { RawEventsController } from './raw-events.controller.js';
import { RawEventsService } from './raw-events.service.js';
import { StripeNormalizer } from './stripe/stripe.normalizer.js';
import { TransactionWriter } from './transaction-writer.service.js';
import { LedgerWebhookController } from './webhooks/ledger-webhook.controller.js';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller.js';

/**
 * Sources → raw events → normalised transactions.
 *   webhook ─► IngestionService.receive ─► raw_events + queue ─► IngestionProcessor
 *     ─► normaliser ─► TransactionWriter ─► reconciliation queue
 */
@Module({
  imports: [SourcesModule, ReconciliationModule],
  controllers: [StripeWebhookController, LedgerWebhookController, RawEventsController],
  providers: [
    IngestionService,
    IngestionProcessor,
    RawEventHandler,
    RawEventSweeper,
    RawEventsService,
    TransactionWriter,
    NormalizerRegistry,
    StripeNormalizer,
    LedgerNormalizer,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
