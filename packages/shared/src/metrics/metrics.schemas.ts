import { z } from 'zod';
import {
  EXCEPTION_SEVERITIES,
  EXCEPTION_STATUSES,
  EXCEPTION_TYPES,
} from '../exceptions/exception.constants.js';
import { csvEnumParam, timeZoneParam } from '../pagination/query-params.js';
import { sourceCodeSchema } from '../transactions/transaction.schemas.js';

/** Dashboard windows: the last N days, today included. */
export const DASHBOARD_PERIODS = { '7d': 7, '30d': 30 } as const;
export type DashboardPeriod = keyof typeof DASHBOARD_PERIODS;

export const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d']).default('30d'),
  timeZone: timeZoneParam,
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/** Longest report window, so one request cannot scan years of data. */
export const MAX_REPORT_DAYS = 366;
const MS_PER_DAY = 86_400_000;

const reportRangeSchema = z.object({
  /** First day, inclusive (YYYY-MM-DD), in `timeZone`. */
  from: z.iso.date(),
  /** Last day, inclusive (YYYY-MM-DD), in `timeZone`. */
  to: z.iso.date(),
  timeZone: timeZoneParam,
});

const checkRange = (query: { from: string; to: string }, ctx: z.RefinementCtx): void => {
  if (query.from > query.to) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: '`to` must be on or after `from`.' });
    return;
  }
  const days = (Date.parse(query.to) - Date.parse(query.from)) / MS_PER_DAY + 1;
  if (days > MAX_REPORT_DAYS) {
    ctx.addIssue({
      code: 'custom',
      path: ['to'],
      message: `A report can cover at most ${MAX_REPORT_DAYS} days.`,
    });
  }
};

export const REPORT_FORMATS = ['json', 'csv', 'pdf'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const reconciliationSummaryQuerySchema = reportRangeSchema
  .extend({ format: z.enum(REPORT_FORMATS).default('json') })
  .superRefine(checkRange);
export type ReconciliationSummaryQuery = z.infer<typeof reconciliationSummaryQuerySchema>;

/** Exceptions detected in the range, optionally narrowed like the exception list. */
export const exceptionReportQuerySchema = reportRangeSchema
  .extend({
    status: csvEnumParam(EXCEPTION_STATUSES).optional(),
    type: csvEnumParam(EXCEPTION_TYPES).optional(),
    severity: csvEnumParam(EXCEPTION_SEVERITIES).optional(),
    source: sourceCodeSchema.optional(),
    format: z.enum(['csv', 'pdf']).default('csv'),
  })
  .superRefine(checkRange);
export type ExceptionReportQuery = z.infer<typeof exceptionReportQuerySchema>;
