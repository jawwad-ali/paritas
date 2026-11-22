import { EXCEPTION_TYPE_LABELS, formatExceptionNumber } from '@paritas/shared';
import type { PdfColumn } from '../pdf/report-pdf.js';
import { pdfMoney, pdfNumber } from '../pdf/pdf-text.js';
import { ReportPdf } from '../pdf/report-pdf.js';
import { formatDay, formatInstant } from '../report-format.js';
import type { ExceptionReportRow, ReportAuthor } from '../reports.types.js';
import type { Period } from '../../metrics/metrics.types.js';

const COLUMNS: PdfColumn[] = [
  { header: 'Exception', width: 0.07 },
  { header: 'Type', width: 0.1 },
  { header: 'Severity', width: 0.07 },
  { header: 'Status', width: 0.08 },
  { header: 'Title', width: 0.23 },
  { header: 'Amount', width: 0.09, align: 'right' },
  { header: 'Detected', width: 0.11 },
  { header: 'Closed', width: 0.11 },
  { header: 'Closed by · reason', width: 0.14 },
];

export interface ExceptionPdfInput {
  rows: ExceptionReportRow[];
  period: Period;
  /** Human description of the filters applied, e.g. "Status: OPEN". */
  filters: string[];
  author: ReportAuthor;
  generatedAt: Date;
}

export const renderExceptionPdf = ({
  rows,
  period,
  filters,
  author,
  generatedAt,
}: ExceptionPdfInput): PDFKit.PDFDocument => {
  const tz = period.timeZone;
  const count = (status: string): number => rows.filter((row) => row.status === status).length;
  const pdf = new ReportPdf({
    title: 'Exception report',
    subtitle: `Exceptions detected ${formatDay(period.fromDate)} – ${formatDay(period.toDate)}`,
    meta: [
      `Time zone: ${tz}`,
      filters.length > 0 ? `Filters: ${filters.join('; ')}` : 'All exceptions',
      `Generated ${formatInstant(generatedAt, tz)} by ${author.email}`,
    ],
    landscape: true,
    footer: 'Paritas exception report · Confidential',
  });

  pdf.kpis([
    { label: 'Exceptions', value: pdfNumber(rows.length) },
    { label: 'Open', value: pdfNumber(count('OPEN')) },
    { label: 'Investigating', value: pdfNumber(count('INVESTIGATING')) },
    { label: 'Resolved', value: pdfNumber(count('RESOLVED')) },
    { label: 'Ignored', value: pdfNumber(count('IGNORED')) },
  ]);

  pdf.section('Exceptions').table(
    COLUMNS,
    rows.map((row) => [
      formatExceptionNumber(row.number),
      EXCEPTION_TYPE_LABELS[row.type],
      row.severity,
      row.status,
      row.title,
      row.amountMinor === null || row.currency === null
        ? '—'
        : pdfMoney(row.amountMinor, row.currency),
      formatInstant(row.detectedAt, tz),
      row.closedAt ? formatInstant(row.closedAt, tz) : `Open ${row.hoursOpen} h`,
      [row.closedBy, row.resolutionReason].filter(Boolean).join(' · '),
    ]),
  );
  return pdf.finish();
};
