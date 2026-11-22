import { Module } from '@nestjs/common';
import { ReconciliationModule } from '../reconciliation/reconciliation.module.js';
import { ExceptionActionsController } from './exception-actions.controller.js';
import { ExceptionLifecycle } from './exception-lifecycle.service.js';
import { ExceptionManualMatchService } from './exception-manual-match.service.js';
import { ExceptionTransitionsService } from './exception-transitions.service.js';
import { ExceptionWorkflowService } from './exception-workflow.service.js';
import { ExceptionsController } from './exceptions.controller.js';
import { ExceptionsQueryService } from './exceptions-query.service.js';

/**
 * Exception management: the work queue people use to investigate and settle
 * what the matching engine could not.
 *   read: list, stats, assignees, detail     (ExceptionsQueryService)
 *   notes, assignment, severity              (ExceptionWorkflowService)
 *   investigate, resolve, ignore, reopen     (ExceptionTransitionsService)
 *   manual match                             (ExceptionManualMatchService)
 * Status changes share ExceptionLifecycle: currency locks and transaction effects.
 */
@Module({
  imports: [ReconciliationModule],
  controllers: [ExceptionsController, ExceptionActionsController],
  providers: [
    ExceptionsQueryService,
    ExceptionWorkflowService,
    ExceptionTransitionsService,
    ExceptionManualMatchService,
    ExceptionLifecycle,
  ],
  exports: [ExceptionsQueryService],
})
export class ExceptionsModule {}
