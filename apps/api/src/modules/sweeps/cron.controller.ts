import { createHash, timingSafeEqual } from 'node:crypto';
import { Controller, Get, Headers, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppConfigService } from '../../config/app-config.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { type SweepResult, SweepRunner } from './sweep-runner.service.js';
import { CRON_ROUTE } from './sweeps.constants.js';

const BEARER_PREFIX = 'Bearer ';

/** Compares digests, so the check takes the same time whatever the input's length or content. */
const secretsMatch = (given: string, expected: string): boolean =>
  timingSafeEqual(
    createHash('sha256').update(given).digest(),
    createHash('sha256').update(expected).digest(),
  );

/**
 * Scheduled sweeps for hosts without BullMQ (Vercel Cron calls it with
 * `Authorization: Bearer $CRON_SECRET`). Not a user route: no JWT, its own
 * secret instead, and absent (404) unless CRON_SECRET is set.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller(CRON_ROUTE.CONTROLLER)
export class CronController {
  constructor(
    private readonly config: AppConfigService,
    private readonly runner: SweepRunner,
  ) {}

  @Get(CRON_ROUTE.SWEEP)
  sweep(@Headers('authorization') authorization: string | undefined): Promise<SweepResult> {
    const secret = this.config.get('CRON_SECRET');
    if (secret === undefined) {
      throw new NotFoundException();
    }
    const given = authorization?.startsWith(BEARER_PREFIX)
      ? authorization.slice(BEARER_PREFIX.length)
      : '';
    if (!secretsMatch(given, secret)) {
      throw new UnauthorizedException('Invalid cron secret.');
    }
    return this.runner.run();
  }
}
