import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema.js';

/**
 * Typed facade over ConfigService. Feature code depends on this instead of
 * reading raw strings, so a renamed variable is a compile error, not a bug.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  /** Background work runs inside the request (serverless) instead of on BullMQ workers. */
  get runsJobsInline(): boolean {
    return this.get('JOB_RUNNER') === 'inline';
  }

  /** Only the queue runner connects to Redis, and the schema requires the URL for it. */
  get redisUrl(): string {
    const url = this.get('REDIS_URL');
    if (url === undefined) {
      throw new Error('REDIS_URL is not set; it is required when JOB_RUNNER=queue.');
    }
    return url;
  }
}
