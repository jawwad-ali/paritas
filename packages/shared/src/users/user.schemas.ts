import { z } from 'zod';
import { emailSchema, newPasswordSchema } from '../auth/auth.schemas.js';
import { USER_ROLES } from '../auth/roles.js';
import { paginationQuerySchema } from '../pagination/pagination.schemas.js';
import { booleanQueryParam } from '../pagination/query-params.js';

const nameSchema = z.string().trim().min(1, 'Name is required.').max(100);

export const createUserRequestSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: z.enum(USER_ROLES),
  password: newPasswordSchema,
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z
  .object({
    name: nameSchema.optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one field to update.',
  });
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: booleanQueryParam.optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
