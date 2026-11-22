import { Controller, Get, Header, Query, type StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  type ExceptionReportQuery,
  exceptionReportQuerySchema,
  type ReconciliationSummaryDto,
  type ReconciliationSummaryQuery,
  reconciliationSummaryQuerySchema,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { REPORTS_THROTTLE } from './reports.constants.js';
import { ReportsService } from './reports.service.js';

/** Reports contain financial data, so they are never cached by browsers or proxies. */
@ApiTags('Reports')
@ApiBearerAuth()
@Throttle(REPORTS_THROTTLE)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reconciliation-summary')
  @Header('Cache-Control', 'no-store')
  @ApiProduces('application/json', 'text/csv', 'application/pdf')
  @ApiOperation({ summary: 'Reconciliation summary for a date range (JSON, CSV or PDF)' })
  summary(
    @Query({ schema: reconciliationSummaryQuerySchema }) query: ReconciliationSummaryQuery,
    @CurrentUser() actor: RequestActor,
  ): Promise<ReconciliationSummaryDto | StreamableFile> {
    return this.reports.summary(query, actor);
  }

  @Get('exceptions')
  @Header('Cache-Control', 'no-store')
  @ApiProduces('text/csv', 'application/pdf')
  @ApiOperation({ summary: 'Detailed exception report for a date range (CSV streams any size)' })
  exceptions(
    @Query({ schema: exceptionReportQuerySchema }) query: ExceptionReportQuery,
    @CurrentUser() actor: RequestActor,
  ): Promise<StreamableFile> {
    return this.reports.exceptions(query, actor);
  }
}
