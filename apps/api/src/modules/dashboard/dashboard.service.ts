import { Injectable } from '@nestjs/common';
import {
  DASHBOARD_PERIODS,
  type DashboardOverviewDto,
  type DashboardQuery,
  OPEN_EXCEPTION_STATUSES,
  type OpenExceptionsDto,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { ExceptionsQueryService } from '../exceptions/exceptions-query.service.js';
import { PeriodService, toPeriodDto } from '../metrics/period.service.js';
import { ReconciliationMetricsService } from '../metrics/reconciliation-metrics.service.js';

/** How many of the most urgent open exceptions the dashboard lists. */
const PRIORITY_EXCEPTIONS_SHOWN = 5;

/** Reconciliation health at a glance: one request, everything the dashboard renders. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly periods: PeriodService,
    private readonly metrics: ReconciliationMetricsService,
    private readonly exceptions: ExceptionsQueryService,
  ) {}

  async overview(query: DashboardQuery, actor: RequestActor): Promise<DashboardOverviewDto> {
    const period = await this.periods.lastDays(DASHBOARD_PERIODS[query.period], query.timeZone);
    const [totals, volume, exceptionFlow, trend, stats, priority] = await Promise.all([
      this.metrics.totals(period),
      this.metrics.volume(period),
      this.metrics.exceptionFlow(period),
      this.metrics.trend(period),
      this.exceptions.stats(actor),
      this.exceptions.list(
        {
          page: 1,
          pageSize: PRIORITY_EXCEPTIONS_SHOWN,
          sort: 'priority',
          status: [...OPEN_EXCEPTION_STATUSES],
        },
        actor,
      ),
    ]);

    const openExceptions: OpenExceptionsDto = {
      total: OPEN_EXCEPTION_STATUSES.reduce((sum, status) => sum + stats.byStatus[status], 0),
      critical: stats.openBySeverity.CRITICAL,
      unassigned: stats.openUnassigned,
      bySeverity: stats.openBySeverity,
      byType: stats.openByType,
    };
    return {
      period: toPeriodDto(period),
      transactions: totals.overall,
      bySource: totals.bySource,
      volume,
      exceptionFlow,
      openExceptions,
      trend,
      priorityExceptions: priority.data,
    };
  }
}
