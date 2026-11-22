import type { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { InvalidEventPayloadError } from './ingestion.errors.js';

/** Parses a webhook body. JSON.parse output is JSON by construction, so the cast is sound. */
export const parseJsonObject = (body: Buffer): Prisma.InputJsonObject => {
  const parsed: unknown = JSON.parse(body.toString('utf8'));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new SyntaxError('Webhook body must be a JSON object.');
  }
  return parsed as Prisma.InputJsonObject;
};

/** Validates a payload against a schema, converting failures into a non-retryable error. */
export const parseOrInvalid = <T extends z.ZodType>(
  schema: T,
  payload: unknown,
  what: string,
): z.infer<T> => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new InvalidEventPayloadError(`Invalid ${what}: ${issues}`);
  }
  return result.data;
};

/** Emails compare case-insensitively; normalising here makes matching a simple equality. */
export const normalizeCustomerRef = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
};
