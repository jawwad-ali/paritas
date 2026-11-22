import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { DEPENDENCY_PING_TIMEOUT_MS, HEALTH_CHECK_KEYS } from './health.constants.js';
import { RedisHealthIndicator } from './indicators/redis.health.js';

/**
 * Kubernetes-style probes, outside API versioning:
 * - liveness: is the process able to serve? (never checks dependencies,
 *   otherwise a DB blip would restart every pod)
 * - readiness: can it do useful work right now?
 */
@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe: checks PostgreSQL and Redis' })
  ready() {
    return this.health.check([
      () =>
        this.prismaIndicator
          .pingCheck(HEALTH_CHECK_KEYS.DATABASE, this.prisma)
          .withTimeout(DEPENDENCY_PING_TIMEOUT_MS),
      () =>
        this.redisIndicator
          .pingCheck(HEALTH_CHECK_KEYS.REDIS)
          .withTimeout(DEPENDENCY_PING_TIMEOUT_MS),
    ]);
  }
}
