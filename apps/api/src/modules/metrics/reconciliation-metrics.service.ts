import { Injectable } from '@nestjs/common';
import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_TYPES,
  type ExceptionFlowDto,
  MATCH_METHODS,
  type MatchMethod,
  RECONCILIATION_STATUSES,
  type ReconciliationStatus,
  type ReconciliationTotalsDto,
  type SourceTotalsDto,
  type TrendPointDto,
  type VolumeDto,
} from '@paritas/shared';
import {
  ExceptionStatus,
  MatchStatus,
  SourceKind,
  TransactionStatus,
} from '../../generated/prisma/client.js';
import { countsBy, ratio } from '../../common/utils/counts.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toSourceSummaryDto } from '../sources/sources.mapper.js';
import { toSafeNumber } from '../transactions/transactions.mapper.js';
import { dailyTrend, medianHoursToClose } from './metrics.sql.js';
import type { Period } from './metrics.types.js';

const OPEN = [ExceptionStatus.OPEN, ExceptionStatus.INVESTIGATING];
const CLOSED = [ExceptionStatus.RESOLVED, ExceptionStatus.IGNORED];

const toTotals = (counts: Record<ReconciliationStatus, number>): ReconciliationTotalsDto => {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return {
    total,
    matched: counts.MATCHED,
    unmatched: counts.UNMATCHED,
    exception: counts.EXCEPTION,
    excluded: counts.EXCLUDED,
    matchRate: ratio(counts.MATCHED, total - counts.EXCLUDED),
  };
};

/**
 * The numbers behind the dashboard and the reports. Records count by payment
 * date (`occurredAt`); exceptions by detection (`createdAt`) and closure
 * (`resolvedAt`). Each record of a payment counts once per side.
 */
@Injectable()
export class ReconciliationMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async totals(
    period: Period,
  ): Promise<{ overall: ReconciliationTotalsDto; bySource: SourceTotalsDto[] }> {
    const [sources, rows] = await Promise.all([
      this.prisma.source.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.transaction.groupBy({
        by: ['sourceId', 'reconciliationStatus'],
        where: { occurredAt: { gte: period.from, lt: period.to } },
        _count: { _all: true },
      }),
    ]);
    const statusCounts = (subset: typeof rows): Record<ReconciliationStatus, number> =>
      countsBy(
        RECONCILIATION_STATUSES,
        subset.map((row) => ({ key: row.reconciliationStatus, count: row._count._all })),
      );
    return {
      overall: toTotals(statusCounts(rows)),
      bySource: sources.map((source) => ({
        source: toSourceSummaryDto(source),
        ...toTotals(statusCounts(rows.filter((row) => row.sourceId === source.id))),
      })),
    };
  }

  async volume(period: Period): Promise<VolumeDto[]> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['currency'],
      where: {
        occurredAt: { gte: period.from, lt: period.to },
        status: TransactionStatus.SUCCEEDED,
        source: { kind: SourceKind.PAYMENT_GATEWAY },
      },
      _sum: { amountMinor: true },
      _count: { _all: true },
      orderBy: { currency: 'asc' },
    });
    return rows.map((row) => ({
      currency: row.currency,
      amountMinor: toSafeNumber(row._sum.amountMinor ?? 0n),
      count: row._count._all,
    }));
  }

  async trend(period: Period): Promise<TrendPointDto[]> {
    const rows = await dailyTrend(this.prisma, period);
    return rows.map((row) => ({
      date: row.day,
      transactions: row.transactions,
      matched: row.matched,
      matchRate: ratio(row.matched, row.transactions - row.excluded),
      exceptionsOpened: row.exceptionsOpened,
      exceptionsClosed: row.exceptionsClosed,
    }));
  }

  async exceptionFlow(period: Period): Promise<ExceptionFlowDto> {
    const detected = { createdAt: { gte: period.from, lt: period.to } };
    const closed = { resolvedAt: { gte: period.from, lt: period.to }, status: { in: CLOSED } };
    const exceptions = this.prisma.reconciliationException;
    const [byType, bySeverity, byClosure, autoResolved, medianHours] = await Promise.all([
      exceptions.groupBy({ by: ['type'], where: detected, _count: { _all: true } }),
      exceptions.groupBy({ by: ['severity'], where: detected, _count: { _all: true } }),
      exceptions.groupBy({ by: ['status'], where: closed, _count: { _all: true } }),
      exceptions.count({
        where: { ...closed, status: ExceptionStatus.RESOLVED, resolvedById: null },
      }),
      medianHoursToClose(this.prisma, period),
    ]);
    const closedCount = (status: ExceptionStatus): number =>
      byClosure.find((row) => row.status === status)?._count._all ?? 0;
    return {
      opened: byType.reduce((sum, row) => sum + row._count._all, 0),
      openedByType: countsBy(
        EXCEPTION_TYPES,
        byType.map((row) => ({ key: row.type, count: row._count._all })),
      ),
      openedBySeverity: countsBy(
        EXCEPTION_SEVERITIES,
        bySeverity.map((row) => ({ key: row.severity, count: row._count._all })),
      ),
      resolved: closedCount(ExceptionStatus.RESOLVED),
      ignored: closedCount(ExceptionStatus.IGNORED),
      autoResolved,
      medianHoursToClose: medianHours,
    };
  }

  async matchesByMethod(period: Period): Promise<Record<MatchMethod, number>> {
    const rows = await this.prisma.match.groupBy({
      by: ['method'],
      where: { createdAt: { gte: period.from, lt: period.to }, status: MatchStatus.ACTIVE },
      _count: { _all: true },
    });
    return countsBy(
      MATCH_METHODS,
      rows.map((row) => ({ key: row.method, count: row._count._all })),
    );
  }

  /** Exceptions detected in the period that nobody (and nothing) has closed yet. */
  stillOpen(period: Period): Promise<number> {
    return this.prisma.reconciliationException.count({
      where: { createdAt: { gte: period.from, lt: period.to }, status: { in: OPEN } },
    });
  }
}
