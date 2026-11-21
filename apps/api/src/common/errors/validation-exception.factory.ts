import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ProblemFieldError } from '@paritas/shared';
import { RequestValidationException } from './request-validation.exception.js';

const ROOT_PATH = '(root)';

const toPathString = (path: StandardSchemaV1.Issue['path']): string => {
  if (!path || path.length === 0) {
    return ROOT_PATH;
  }
  return path
    .map((segment) => (typeof segment === 'object' ? String(segment.key) : String(segment)))
    .join('.');
};

/** Turns Standard Schema issues (Zod, Valibot, …) into RFC 9457 field errors. */
export const validationExceptionFactory = (
  issues: readonly StandardSchemaV1.Issue[],
): RequestValidationException => {
  const fieldErrors: ProblemFieldError[] = issues.map((issue) => ({
    path: toPathString(issue.path),
    message: issue.message,
  }));
  return new RequestValidationException(fieldErrors);
};
