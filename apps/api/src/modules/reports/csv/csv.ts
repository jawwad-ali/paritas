/**
 * RFC 4180 CSV, safe to open in Excel / Google Sheets.
 * Formula injection: a text cell starting with = + - @ (or tab / CR) would run
 * as a formula in a spreadsheet, so it is prefixed with an apostrophe (OWASP).
 */
export type CsvValue = string | number | null | undefined;

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

/** Byte-order mark: makes Excel read the file as UTF-8 (names, currency symbols). */
export const CSV_BOM = '﻿';
export const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

export const csvCell = (value: CsvValue): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let text = String(value);
  if (typeof value === 'string' && FORMULA_TRIGGER.test(text)) {
    text = `'${text}`;
  }
  return NEEDS_QUOTING.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const csvRow = (cells: readonly CsvValue[]): string => `${cells.map(csvCell).join(',')}\r\n`;
