import { z } from 'zod';
import { paginationQuerySchema } from '../pagination/pagination.schemas.js';
import { csvEnumParam, dateQueryParam } from '../pagination/query-params.js';
import {
  DATE_RANGE_ERROR,
  dateRangeIsOrdered,
  sourceCodeSchema,
} from '../transactions/transaction.schemas.js';
import {
  ASSIGNEE_FILTER_ME,
  ASSIGNEE_FILTER_UNASSIGNED,
  EXCEPTION_NOTE_MAX_LENGTH,
  EXCEPTION_REASON_MAX_LENGTH,
  EXCEPTION_REASON_MIN_LENGTH,
  EXCEPTION_SEVERITIES,
  EXCEPTION_SORTS,
  EXCEPTION_STATUSES,
  EXCEPTION_TYPES,
} from './exception.constants.js';

export const listExceptionsQuerySchema = paginationQuerySchema
  .extend({
    /** Comma-separated, e.g. `OPEN,INVESTIGATING`. */
    status: csvEnumParam(EXCEPTION_STATUSES).optional(),
    type: csvEnumParam(EXCEPTION_TYPES).optional(),
    severity: csvEnumParam(EXCEPTION_SEVERITIES).optional(),
    /** `me`, `unassigned`, or a user id. */
    assignee: z
      .union([z.literal(ASSIGNEE_FILTER_ME), z.literal(ASSIGNEE_FILTER_UNASSIGNED), z.uuid()])
      .optional(),
    /** Exceptions involving a record from this source. */
    source: sourceCodeSchema.optional(),
    /** Filters on detection time (`createdAt`). */
    from: dateQueryParam.optional(),
    to: dateQueryParam.optional(),
    /** Exception number (EX-1042 or 1042), title, or a linked record's reference, id or customer. */
    search: z.string().trim().min(1).max(100).optional(),
    sort: z.enum(EXCEPTION_SORTS).default('newest'),
  })
  .refine(dateRangeIsOrdered, DATE_RANGE_ERROR);
export type ListExceptionsQuery = z.infer<typeof listExceptionsQuerySchema>;

const reasonSchema = z
  .string()
  .trim()
  .min(EXCEPTION_REASON_MIN_LENGTH, 'Give a reason of at least 3 characters.')
  .max(EXCEPTION_REASON_MAX_LENGTH);

const noteSchema = z
  .string()
  .trim()
  .min(1, 'A note cannot be empty.')
  .max(EXCEPTION_NOTE_MAX_LENGTH);

export const addExceptionNoteRequestSchema = z.object({ message: noteSchema });
export type AddExceptionNoteRequest = z.infer<typeof addExceptionNoteRequestSchema>;

/** `null` unassigns. */
export const assignExceptionRequestSchema = z.object({ assigneeId: z.uuid().nullable() });
export type AssignExceptionRequest = z.infer<typeof assignExceptionRequestSchema>;

export const changeExceptionSeverityRequestSchema = z.object({
  severity: z.enum(EXCEPTION_SEVERITIES),
  reason: reasonSchema,
});
export type ChangeExceptionSeverityRequest = z.infer<typeof changeExceptionSeverityRequestSchema>;

/** Resolve or ignore: a reason is mandatory (audit), extra notes are optional. */
export const closeExceptionRequestSchema = z.object({
  reason: reasonSchema,
  note: noteSchema.optional(),
});
export type CloseExceptionRequest = z.infer<typeof closeExceptionRequestSchema>;

export const reopenExceptionRequestSchema = z.object({ reason: reasonSchema });
export type ReopenExceptionRequest = z.infer<typeof reopenExceptionRequestSchema>;

/** Link a gateway record and a ledger record as the same payment, closing the exception. */
export const manualMatchRequestSchema = z.object({
  gatewayTransactionId: z.uuid(),
  ledgerTransactionId: z.uuid(),
  reason: reasonSchema,
});
export type ManualMatchRequest = z.infer<typeof manualMatchRequestSchema>;
