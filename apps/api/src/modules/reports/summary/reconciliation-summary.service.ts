import { Injectable } from '@nestjs/common';
import type { ReconciliationSummaryDto, ReconciliationSummaryQuery } from '@paritas/shared';
import { PeriodService, toPeriodDto } from '../../metrics/period.service.js';
import { ReconciliationMetricsService } from '../../metrics/reconciliation-metrics.service.js';

/** Everything a reconciliation summary contains, for a date range. */
@Injectable()
export class ReconciliationSummaryService {
  constructor(
    private readonly periods: PeriodService,
    private readonly metrics: ReconciliationMetricsService,
  ) {}

  async build(query: ReconciliationSummaryQuery): Promise<ReconciliationSummaryDto> {
    const period = await this.periods.between(query.from, query.to, query.timeZone);
    const [totals, volume, matchesByMethod, exceptionFlow, stillOpen, daily] = await Promise.all([
      this.metrics.totals(period),
      this.metrics.volume(period),
      this.metrics.matchesByMethod(period),
      this.metrics.exceptionFlow(period),
      this.metrics.stillOpen(period),
      this.metrics.trend(period),
    ]);
    return {
      period: toPeriodDto(period),
      generatedAt: new Date().toISOString(),
      transactions: totals.overall,
      bySource: totals.bySource,
      volume,
      matchesByMethod,
      exceptionFlow,
      stillOpen,
      daily,
    };
  }
}
