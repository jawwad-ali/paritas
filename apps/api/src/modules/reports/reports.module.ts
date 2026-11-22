import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ExceptionReportService } from './exceptions/exception-report.service.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReconciliationSummaryService } from './summary/reconciliation-summary.service.js';

/** Audit-ready reports: reconciliation summary and exception detail, as JSON, CSV or PDF. */
@Module({
  imports: [MetricsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReconciliationSummaryService, ExceptionReportService],
})
export class ReportsModule {}
