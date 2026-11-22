import { Injectable, type NestMiddleware } from '@nestjs/common';
import { REQUEST_ID_HEADER } from '@paritas/shared';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextService } from './request-context.service.js';

/** Request augmented by pino-http with the correlation id. */
type RequestWithId = Request & { id?: string | number };

const resolveRequestId = (req: RequestWithId, res: Response): string | undefined => {
  if (req.id !== undefined) {
    return String(req.id);
  }
  const header = res.getHeader(REQUEST_ID_HEADER);
  return typeof header === 'string' ? header : undefined;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    this.context.run(
      {
        requestId: resolveRequestId(req, res),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      next,
    );
  }
}
