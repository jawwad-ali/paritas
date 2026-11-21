import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.constants.js';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  pingCheck<const TKey extends string>(key: TKey) {
    return this.healthIndicatorService.check(key).attempt(() => this.redis.ping());
  }
}
