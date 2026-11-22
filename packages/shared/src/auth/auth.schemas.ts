import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth.constants.js';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

/** Policy for new passwords (NIST 800-63B: length over composition rules). */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);

/** Login only bounds the length; the policy is enforced when a password is set. */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(PASSWORD_MAX_LENGTH),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.').max(PASSWORD_MAX_LENGTH),
    newPassword: newPasswordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one.',
  });
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
