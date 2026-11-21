import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProblemDetails } from '@paritas/shared';
import { STATUS_CODES } from 'node:http';
import { PROBLEM_TYPES } from '../errors/problem-types.js';
import { RequestValidationException } from '../errors/request-validation.exception.js';

export interface ProblemContext {
  path: string;
  requestId?: string;
}

const INTERNAL_ERROR_DETAIL =
  'An unexpected error occurred. Quote the request id when reporting it.';

const titleFor = (status: number): string => STATUS_CODES[status] ?? 'Error';

/** Pulls a client-safe message out of the many shapes HttpException responses take. */
const detailFromHttpException = (exception: HttpException): string => {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const { message } = response as { message: unknown };
    if (Array.isArray(message)) {
      return message.map(String).join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return exception.message;
};

export const toProblemDetails = (exception: unknown, context: ProblemContext): ProblemDetails => {
  const base = { instance: context.path, requestId: context.requestId };

  if (exception instanceof RequestValidationException) {
    return {
      ...base,
      type: PROBLEM_TYPES.VALIDATION,
      title: 'Validation failed',
      status: HttpStatus.BAD_REQUEST,
      detail: exception.message,
      errors: exception.fieldErrors,
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return {
      ...base,
      type: PROBLEM_TYPES.GENERIC,
      title: titleFor(status),
      status,
      detail: detailFromHttpException(exception),
    };
  }

  // Unknown errors may contain internals (SQL, stack traces); never leak them.
  return {
    ...base,
    type: PROBLEM_TYPES.INTERNAL,
    title: titleFor(HttpStatus.INTERNAL_SERVER_ERROR),
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    detail: INTERNAL_ERROR_DETAIL,
  };
};
