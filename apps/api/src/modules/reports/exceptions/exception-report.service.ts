import { Injectable } from '@nestjs/common';
import type { ExceptionReportQuery } from '@paritas/shared';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { RequestActor } from '../../../common/request-context/request-context.types.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { buildExceptionWhere } from '../../exceptions/exceptions.filters.js';
import type { Period } from '../../metrics/metrics.types.js';
import { EXCEPTION_REPORT_BATCH_SIZE } from '../reports.constants.js';
import type { ExceptionReportRow } from '../reports.types.js';
import { EXCEPTION_REPORT_INCLUDE, toExceptionReportRow } from './exception-report.rows.js';

/**
 * Exceptions detected in a period, oldest first, read in keyset-paginated
 * batches so an export of any size streams with flat memory use.
 */
@Injectable()
export class ExceptionReportService {
  constructor(private readonly prisma: PrismaService) {}

  whereFor(
    query: ExceptionReportQuery,
    period: Period,
    actor: RequestActor,
  ): Prisma.ReconciliationExceptionWhereInput {
    return buildExceptionWhere(
      {
        status: query.status,
        type: query.type,
        severity: query.severity,
        source: query.source,
        createdAt: { gte: period.from, lt: period.to },
      },
      actor,
    );
  }

  count(where: Prisma.ReconciliationExceptionWhereInput): Promise<number> {
    return this.prisma.reconciliationException.count({ where });
  }

  async *batches(
    where: Prisma.ReconciliationExceptionWhereInput,
    now: Date,
  ): AsyncGenerator<ExceptionReportRow[]> {
    let cursor: string | undefined;
    for (;;) {
      const rows = await this.prisma.reconciliationException.findMany({
        where,
        include: EXCEPTION_REPORT_INCLUDE,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: EXCEPTION_REPORT_BATCH_SIZE,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      if (rows.length > 0) {
        yield rows.map((row) => toExceptionReportRow(row, now));
      }
      const last = rows.at(-1);
      if (!last || rows.length < EXCEPTION_REPORT_BATCH_SIZE) {
        return;
      }
      cursor = last.id;
    }
  }
}
