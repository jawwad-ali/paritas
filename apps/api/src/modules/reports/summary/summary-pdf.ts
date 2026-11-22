import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_TYPES,
  type ReconciliationSummaryDto,
} from '@paritas/shared';
import { pdfMoney, pdfNumber, pdfPercent } from '../pdf/pdf-text.js';
import { ReportPdf } from '../pdf/report-pdf.js';
import { formatDay, formatDuration, formatInstant } from '../report-format.js';
import type { ReportAuthor } from '../reports.types.js';

const SOURCE_COLUMNS = [
  { header: 'Source', width: 0.28 },
  { header: 'Records', width: 0.12, align: 'right' },
  { header: 'Matched', width: 0.12, align: 'right' },
  { header: 'Unmatched', width: 0.12, align: 'right' },
  { header: 'In exception', width: 0.12, align: 'right' },
  { header: 'Excluded', width: 0.12, align: 'right' },
  { header: 'Match rate', width: 0.12, align: 'right' },
] as const;

const DAILY_COLUMNS = [
  { header: 'Date', width: 0.22 },
  { header: 'Records', width: 0.15, align: 'right' },
  { header: 'Matched', width: 0.15, align: 'right' },
  { header: 'Match rate', width: 0.16, align: 'right' },
  { header: 'Exceptions detected', width: 0.16, align: 'right' },
  { header: 'Exceptions closed', width: 0.16, align: 'right' },
] as const;

export const renderSummaryPdf = (
  summary: ReconciliationSummaryDto,
  author: ReportAuthor,
): PDFKit.PDFDocument => {
  const { period, transactions: t, exceptionFlow: flow } = summary;
  const pdf = new ReportPdf({
    title: 'Reconciliation summary',
    subtitle: `${formatDay(period.fromDate)} – ${formatDay(period.toDate)}`,
    meta: [
      `Time zone: ${period.timeZone}`,
      `Generated ${formatInstant(summary.generatedAt, period.timeZone)} by ${author.email}`,
    ],
    footer: 'Paritas reconciliation summary · Confidential',
  });

  pdf.kpis([
    { label: 'Records', value: pdfNumber(t.total) },
    { label: 'Match rate', value: pdfPercent(t.matchRate) },
    { label: 'Exceptions detected', value: pdfNumber(flow.opened) },
    { label: 'Still open', value: pdfNumber(summary.stillOpen) },
  ]);
  pdf.note(
    'Match rate = matched records / (all records - excluded records). Each side of a payment counts as one record.',
  );

  pdf
    .section('Records by source')
    .table(
      [...SOURCE_COLUMNS],
      [
        ...summary.bySource.map((s) => [
          s.source.name,
          pdfNumber(s.total),
          pdfNumber(s.matched),
          pdfNumber(s.unmatched),
          pdfNumber(s.exception),
          pdfNumber(s.excluded),
          pdfPercent(s.matchRate),
        ]),
        [
          'All sources',
          pdfNumber(t.total),
          pdfNumber(t.matched),
          pdfNumber(t.unmatched),
          pdfNumber(t.exception),
          pdfNumber(t.excluded),
          pdfPercent(t.matchRate),
        ],
      ],
    );

  pdf.section('Successful gateway payments').table(
    [
      { header: 'Currency', width: 0.34 },
      { header: 'Payments', width: 0.33, align: 'right' },
      { header: 'Volume', width: 0.33, align: 'right' },
    ],
    summary.volume.map((v) => [
      v.currency,
      pdfNumber(v.count),
      pdfMoney(v.amountMinor, v.currency),
    ]),
  );

  pdf.section('Matches made').table(
    [
      { header: 'Exact (shared reference)', width: 0.34, align: 'right' },
      { header: 'Fuzzy (scored)', width: 0.33, align: 'right' },
      { header: 'Manual (by a person)', width: 0.33, align: 'right' },
    ],
    [
      [
        pdfNumber(summary.matchesByMethod.EXACT),
        pdfNumber(summary.matchesByMethod.FUZZY),
        pdfNumber(summary.matchesByMethod.MANUAL),
      ],
    ],
  );

  pdf.section('Exceptions').kpis([
    { label: 'Resolved', value: pdfNumber(flow.resolved) },
    { label: 'Ignored', value: pdfNumber(flow.ignored) },
    { label: 'Auto-resolved', value: pdfNumber(flow.autoResolved) },
    {
      label: 'Median time to close',
      value: formatDuration(flow.medianHoursToClose),
    },
  ]);
  pdf.section('Exceptions detected by type and severity').table(
    [
      { header: 'Type', width: 0.4 },
      { header: 'Detected', width: 0.1, align: 'right' },
      { header: '', width: 0.1 },
      { header: 'Severity', width: 0.3 },
      { header: 'Detected', width: 0.1, align: 'right' },
    ],
    EXCEPTION_TYPES.map((type, index) => {
      const severity = [...EXCEPTION_SEVERITIES].reverse()[index];
      return [
        EXCEPTION_TYPE_LABELS[type],
        pdfNumber(flow.openedByType[type]),
        '',
        severity ?? '',
        severity ? pdfNumber(flow.openedBySeverity[severity]) : '',
      ];
    }),
  );

  pdf.section('Daily breakdown').table(
    [...DAILY_COLUMNS],
    summary.daily.map((d) => [
      formatDay(d.date),
      pdfNumber(d.transactions),
      pdfNumber(d.matched),
      pdfPercent(d.matchRate),
      pdfNumber(d.exceptionsOpened),
      pdfNumber(d.exceptionsClosed),
    ]),
  );

  return pdf.finish();
};
