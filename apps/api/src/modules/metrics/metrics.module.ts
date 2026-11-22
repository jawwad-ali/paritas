import { Module } from '@nestjs/common';
import { PeriodService } from './period.service.js';
import { ReconciliationMetricsService } from './reconciliation-metrics.service.js';

/** Shared, read-only aggregation used by the dashboard and the reports. */
@Module({
  providers: [PeriodService, ReconciliationMetricsService],
  exports: [PeriodService, ReconciliationMetricsService],
})
export class MetricsModule {}
