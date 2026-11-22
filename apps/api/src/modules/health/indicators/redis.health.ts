import { Inject, Injectable, Optional } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants.js';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    /** Absent with the inline job runner, which never connects to Redis. */
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  /** Whether there is a Redis connection to check at all. */
  get isConfigured(): boolean {
    return this.redis !== undefined;
  }

  pingCheck<const TKey extends string>(key: TKey) {
    const redis = this.redis;
    const indicator = this.healthIndicatorService.check(key);
    return redis
      ? indicator.attempt(() => redis.ping())
      : indicator.attempt(() => Promise.reject(new Error('Redis is not configured.')));
  }
}
