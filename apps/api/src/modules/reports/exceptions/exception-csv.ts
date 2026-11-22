import { EXCEPTION_TYPE_LABELS, formatExceptionNumber, toDecimalAmount } from '@paritas/shared';
import { csvRow } from '../csv/csv.js';
import type { ExceptionReportRow } from '../reports.types.js';

/** Timestamps are ISO-8601 UTC: unambiguous and sortable in a spreadsheet. */
export const EXCEPTION_CSV_HEADER = csvRow([
  'Exception',
  'Type',
  'Severity',
  'Status',
  'Title',
  'Amount',
  'Currency',
  'Gateway records',
  'Ledger records',
  'Detected at (UTC)',
  'Closed at (UTC)',
  'Closed by',
  'Resolution reason',
  'Assignee',
  'Hours open',
]);

export const toExceptionCsvLine = (row: ExceptionReportRow): string =>
  csvRow([
    formatExceptionNumber(row.number),
    EXCEPTION_TYPE_LABELS[row.type],
    row.severity,
    row.status,
    row.title,
    row.amountMinor === null || row.currency === null
      ? null
      : toDecimalAmount(row.amountMinor, row.currency),
    row.currency,
    row.gatewayRecords.join('; '),
    row.ledgerRecords.join('; '),
    row.detectedAt.toISOString(),
    row.closedAt?.toISOString(),
    row.closedBy,
    row.resolutionReason,
    row.assignee,
    row.hoursOpen,
  ]);
