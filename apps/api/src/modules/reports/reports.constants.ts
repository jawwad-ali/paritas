/** Rows fetched per round trip while streaming the exception report. */
export const EXCEPTION_REPORT_BATCH_SIZE = 500;

/**
 * A PDF is a document for people: past this many rows, use the CSV (which
 * streams any size) or narrow the filters. A silently truncated audit PDF
 * would be worse than a clear refusal.
 */
export const EXCEPTION_PDF_MAX_ROWS = 1_000;

export const REPORT_NAMES = {
  SUMMARY: 'reconciliation-summary',
  EXCEPTIONS: 'exceptions',
} as const;

/** Reports are expensive queries: 30 per user per minute is ample for people, not for scrapers. */
export const REPORTS_THROTTLE = { default: { limit: 30, ttl: 60_000 } };
