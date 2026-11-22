import { Module } from '@nestjs/common';
import { CandidateFinder } from './engine/candidate-finder.js';
import { DecisionHandlers } from './engine/decision-handlers.js';
import { ExceptionWriter } from './engine/exception-writer.js';
import { MatchWriter } from './engine/match-writer.js';
import { MatchingConfigService } from './engine/matching-config.service.js';
import { MatchingEngine } from './engine/matching-engine.service.js';
import { StatusRecalculator } from './engine/status-recalculator.js';
import { MatchCandidatesService } from './match-candidates.service.js';
import { reconciliationQueueProvider } from './reconciliation-queue.provider.js';
import { ReconciliationQueueService } from './reconciliation-queue.service.js';
import { ReconciliationProcessor } from './reconciliation.processor.js';
import { ReconciliationSweeper } from './reconciliation-sweeper.service.js';

/**
 * The matching engine.
 *   transaction changed ─► queue (or inline) ─► MatchingEngine.evaluate (per-currency lock)
 *     ─► exact (reference) → fuzzy (score) → verdict ─► match | exception | wait
 *   every minute: sweeper ─► evaluate unmatched in "sweep" mode (MISSING / DELAYED)
 */
@Module({
  providers: [
    reconciliationQueueProvider,
    ReconciliationProcessor,
    ReconciliationSweeper,
    MatchingEngine,
    MatchingConfigService,
    CandidateFinder,
    DecisionHandlers,
    ExceptionWriter,
    MatchWriter,
    StatusRecalculator,
    MatchCandidatesService,
  ],
  exports: [
    ReconciliationQueueService,
    MatchingEngine,
    MatchingConfigService,
    StatusRecalculator,
    MatchCandidatesService,
    ReconciliationSweeper,
  ],
})
export class ReconciliationModule {}
