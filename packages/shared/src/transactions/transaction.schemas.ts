import { z } from 'zod';
import { paginationQuerySchema } from '../pagination/pagination.schemas.js';
import { dateQueryParam } from '../pagination/query-params.js';
import {
  RAW_EVENT_STATUSES,
  RECONCILIATION_STATUSES,
  SOURCE_CODES,
  TRANSACTION_STATUSES,
} from './transaction.constants.js';

export const sourceCodeSchema = z.enum([SOURCE_CODES.STRIPE, SOURCE_CODES.INTERNAL_LEDGER]);

export const dateRangeIsOrdered = (query: { from?: Date; to?: Date }): boolean =>
  !query.from || !query.to || query.from <= query.to;
export const DATE_RANGE_ERROR = { path: ['to'], message: '`to` must be on or after `from`.' };

export const listTransactionsQuerySchema = paginationQuerySchema
  .extend({
    source: sourceCodeSchema.optional(),
    status: z.enum(TRANSACTION_STATUSES).optional(),
    reconciliationStatus: z.enum(RECONCILIATION_STATUSES).optional(),
    /** Filters on `occurredAt`. */
    from: dateQueryParam.optional(),
    to: dateQueryParam.optional(),
    /** Matches reference, external id or customer, case-insensitively. */
    search: z.string().trim().min(1).max(100).optional(),
  })
  .refine(dateRangeIsOrdered, DATE_RANGE_ERROR);
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export const listRawEventsQuerySchema = paginationQuerySchema
  .extend({
    source: sourceCodeSchema.optional(),
    status: z.enum(RAW_EVENT_STATUSES).optional(),
    eventType: z.string().trim().min(1).max(100).optional(),
    from: dateQueryParam.optional(),
    to: dateQueryParam.optional(),
  })
  .refine(dateRangeIsOrdered, DATE_RANGE_ERROR);
export type ListRawEventsQuery = z.infer<typeof listRawEventsQuerySchema>;

export const updateSourceRequestSchema = z.object({
  isActive: z.boolean(),
});
export type UpdateSourceRequest = z.infer<typeof updateSourceRequestSchema>;
