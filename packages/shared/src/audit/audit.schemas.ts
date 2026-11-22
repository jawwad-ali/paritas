import { z } from 'zod';
import { paginationQuerySchema } from '../pagination/pagination.schemas.js';
import { dateQueryParam } from '../pagination/query-params.js';

export const listAuditLogsQuerySchema = paginationQuerySchema
  .extend({
    action: z.string().trim().min(1).max(100).optional(),
    actorId: z.uuid().optional(),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: z.string().trim().min(1).max(100).optional(),
    from: dateQueryParam.optional(),
    to: dateQueryParam.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    path: ['to'],
    message: '`to` must be on or after `from`.',
  });
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
