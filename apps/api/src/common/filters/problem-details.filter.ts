import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PROBLEM_JSON_CONTENT_TYPE } from '@paritas/shared';
import type { Request, Response } from 'express';
import { toProblemDetails } from './problem-details.mapper.js';

/** Request augmented by pino-http with the correlation id. */
type RequestWithId = Request & { id?: string | number };

/**
 * Last line of defence: every error leaves the API as RFC 9457
 * `application/problem+json`, and every 5xx is logged with its stack.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();

    const problem = toProblemDetails(exception, {
      path: request.originalUrl,
      requestId: request.id === undefined ? undefined : String(request.id),
    });

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        { err: exception, requestId: problem.requestId },
        `Unhandled error on ${request.method} ${request.originalUrl}`,
      );
    }

    response.status(problem.status).type(PROBLEM_JSON_CONTENT_TYPE).json(problem);
  }
}
