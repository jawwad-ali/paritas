import {
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../../config/app-config.service.js';
import { REDIS_CLIENT, REDIS_CONNECT_TIMEOUT_MS } from './redis.constants.js';

const redisClientProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): Redis => {
    const client = new Redis(config.get('REDIS_URL'), {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      // BullMQ workers require this to be null; harmless for regular commands.
      maxRetriesPerRequest: null,
    });
    const logger = new Logger('Redis');
    client.on('error', (error: Error) => logger.error(`Redis connection error: ${error.message}`));
    return client;
  },
};

@Global()
@Module({
  providers: [redisClientProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
