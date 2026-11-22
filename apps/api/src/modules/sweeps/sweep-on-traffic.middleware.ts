import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import type { NextFunction, Request, Response } from 'express';
import { SweepRunner } from './sweep-runner.service.js';

/**
 * Inline runner only. Any request may start the minute's sweep; it runs after
 * the response is sent (`waitUntil` keeps a Vercel Function alive for it; on a
 * long-running server the promise simply runs on). The dashboard refreshes once
 * a minute, so while anyone has Paritas open the sweeps keep their usual pace.
 */
@Injectable()
export class SweepOnTrafficMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SweepOnTrafficMiddleware.name);

  constructor(private readonly runner: SweepRunner) {}

  use(_request: Request, _response: Response, next: NextFunction): void {
    const run = this.runner.runIfDue();
    if (run) {
      waitUntil(
        run.catch((error: unknown) => {
          this.logger.error({ err: error }, 'Sweep started by traffic failed.');
        }),
      );
    }
    next();
  }
}
