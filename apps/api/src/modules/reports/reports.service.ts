import { Injectable, type StreamableFile, UnprocessableEntityException } from '@nestjs/common';
import {
  EXCEPTION_TYPE_LABELS,
  type ExceptionReportQuery,
  type ReconciliationSummaryDto,
  type ReconciliationSummaryQuery,
} from '@paritas/shared';
import { Readable } from 'node:stream';
import type { Prisma } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { AUDIT_ACTIONS } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { PeriodService } from '../metrics/period.service.js';
import { CSV_BOM, CSV_CONTENT_TYPE } from './csv/csv.js';
import { EXCEPTION_CSV_HEADER, toExceptionCsvLine } from './exceptions/exception-csv.js';
import { renderExceptionPdf } from './exceptions/exception-pdf.js';
import { ExceptionReportService } from './exceptions/exception-report.service.js';
import { PDF_CONTENT_TYPE } from './pdf/pdf-theme.js';
import { toReportFile } from './report-file.js';
import { reportFileName } from './report-format.js';
import { EXCEPTION_PDF_MAX_ROWS, REPORT_NAMES } from './reports.constants.js';
import type { ExceptionReportRow } from './reports.types.js';
import { ReconciliationSummaryService } from './summary/reconciliation-summary.service.js';
import { renderSummaryCsv } from './summary/summary-csv.js';
import { renderSummaryPdf } from './summary/summary-pdf.js';

type ExceptionWhere = Prisma.ReconciliationExceptionWhereInput;

interface ExportedQuery {
  from: string;
  to: string;
  timeZone: string;
  format: string;
}

const describeFilters = (query: ExceptionReportQuery): string[] =>
  [
    query.status && `Status: ${query.status.join(', ')}`,
    query.type && `Type: ${query.type.map((type) => EXCEPTION_TYPE_LABELS[type]).join(', ')}`,
    query.severity && `Severity: ${query.severity.join(', ')}`,
    query.source && `Source: ${query.source}`,
  ].filter((filter): filter is string => Boolean(filter));

/**
 * Generates reports in the requested format. Every generation is audited
 * (who exported what, for which period), since reports leave the system.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly periods: PeriodService,
    private readonly summaries: ReconciliationSummaryService,
    private readonly exceptionReports: ExceptionReportService,
    private readonly audit: AuditService,
  ) {}

  async summary(
    query: ReconciliationSummaryQuery,
    actor: RequestActor,
  ): Promise<ReconciliationSummaryDto | StreamableFile> {
    const summary = await this.summaries.build(query);
    await this.recordExport(REPORT_NAMES.SUMMARY, query, {});
    if (query.format === 'json') {
      return summary;
    }
    const name = reportFileName(REPORT_NAMES.SUMMARY, query.from, query.to, query.format);
    return query.format === 'csv'
      ? toReportFile(Readable.from([renderSummaryCsv(summary)]), CSV_CONTENT_TYPE, name)
      : toReportFile(renderSummaryPdf(summary, actor), PDF_CONTENT_TYPE, name);
  }

  async exceptions(query: ExceptionReportQuery, actor: RequestActor): Promise<StreamableFile> {
    const period = await this.periods.between(query.from, query.to, query.timeZone);
    const where = this.exceptionReports.whereFor(query, period, actor);
    const total = await this.exceptionReports.count(where);
    if (query.format === 'pdf' && total > EXCEPTION_PDF_MAX_ROWS) {
      throw new UnprocessableEntityException(
        `${total} exceptions match, more than a PDF report holds (${EXCEPTION_PDF_MAX_ROWS}). Narrow the filters or download the CSV.`,
      );
    }
    const filters = describeFilters(query);
    await this.recordExport(REPORT_NAMES.EXCEPTIONS, query, { rows: total, filters });

    const now = new Date();
    const name = reportFileName(REPORT_NAMES.EXCEPTIONS, query.from, query.to, query.format);
    if (query.format === 'csv') {
      return toReportFile(Readable.from(this.exceptionCsv(where, now)), CSV_CONTENT_TYPE, name);
    }
    const rows: ExceptionReportRow[] = [];
    for await (const batch of this.exceptionReports.batches(where, now)) {
      rows.push(...batch);
    }
    const pdf = renderExceptionPdf({ rows, period, filters, author: actor, generatedAt: now });
    return toReportFile(pdf, PDF_CONTENT_TYPE, name);
  }

  /** Streams the CSV batch by batch; memory stays flat however many rows match. */
  private async *exceptionCsv(where: ExceptionWhere, now: Date): AsyncGenerator<string> {
    yield CSV_BOM + EXCEPTION_CSV_HEADER;
    for await (const batch of this.exceptionReports.batches(where, now)) {
      yield batch.map(toExceptionCsvLine).join('');
    }
  }

  private recordExport(
    report: string,
    query: ExportedQuery,
    extra: Record<string, Prisma.InputJsonValue>,
  ): Promise<void> {
    return this.audit.record({
      action: AUDIT_ACTIONS.REPORT_EXPORTED,
      details: {
        report,
        format: query.format,
        from: query.from,
        to: query.to,
        timeZone: query.timeZone,
        ...extra,
      },
    });
  }
}
