import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_TYPES,
  MATCH_METHODS,
  type ReconciliationSummaryDto,
  toDecimalAmount,
} from '@paritas/shared';
import { CSV_BOM, csvRow, type CsvValue } from '../csv/csv.js';
import { formatRate } from '../report-format.js';

const section = (title: string, header: CsvValue[], rows: CsvValue[][]): string =>
  [csvRow([title]), csvRow(header), ...rows.map(csvRow), '\r\n'].join('');

/** The summary as one CSV with titled sections, readable in any spreadsheet. */
export const renderSummaryCsv = (summary: ReconciliationSummaryDto): string => {
  const { period, transactions: t, exceptionFlow: flow } = summary;
  return [
    CSV_BOM,
    section(
      'Paritas reconciliation summary',
      ['From', 'To', 'Time zone', 'Generated at (UTC)'],
      [[period.fromDate, period.toDate, period.timeZone, summary.generatedAt]],
    ),
    section(
      'Records',
      ['Total', 'Matched', 'Unmatched', 'In exception', 'Excluded', 'Match rate'],
      [[t.total, t.matched, t.unmatched, t.exception, t.excluded, formatRate(t.matchRate)]],
    ),
    section(
      'Records by source',
      ['Source', 'Total', 'Matched', 'Unmatched', 'In exception', 'Excluded', 'Match rate'],
      summary.bySource.map((s) => [
        s.source.name,
        s.total,
        s.matched,
        s.unmatched,
        s.exception,
        s.excluded,
        formatRate(s.matchRate),
      ]),
    ),
    section(
      'Successful gateway payments',
      ['Currency', 'Payments', 'Volume'],
      summary.volume.map((v) => [v.currency, v.count, toDecimalAmount(v.amountMinor, v.currency)]),
    ),
    section(
      'Matches made',
      ['Method', 'Matches'],
      MATCH_METHODS.map((method) => [method, summary.matchesByMethod[method]]),
    ),
    section(
      'Exceptions',
      ['Detected', 'Resolved', 'Ignored', 'Auto-resolved', 'Still open', 'Median hours to close'],
      [
        [
          flow.opened,
          flow.resolved,
          flow.ignored,
          flow.autoResolved,
          summary.stillOpen,
          flow.medianHoursToClose,
        ],
      ],
    ),
    section(
      'Exceptions detected by type',
      ['Type', 'Detected'],
      EXCEPTION_TYPES.map((type) => [EXCEPTION_TYPE_LABELS[type], flow.openedByType[type]]),
    ),
    section(
      'Exceptions detected by severity',
      ['Severity', 'Detected'],
      EXCEPTION_SEVERITIES.map((severity) => [severity, flow.openedBySeverity[severity]]),
    ),
    section(
      'Daily',
      ['Date', 'Records', 'Matched', 'Match rate', 'Exceptions detected', 'Exceptions closed'],
      summary.daily.map((d) => [
        d.date,
        d.transactions,
        d.matched,
        formatRate(d.matchRate),
        d.exceptionsOpened,
        d.exceptionsClosed,
      ]),
    ),
  ].join('');
};
