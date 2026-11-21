import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validationExceptionFactory } from './common/errors/validation-exception.factory.js';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { AppConfigService } from './config/app-config.service.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { LoggerModule } from './infrastructure/logger/logger.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    // Infrastructure
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        { ttl: config.get('THROTTLE_TTL_MS'), limit: config.get('THROTTLE_LIMIT') },
      ],
    }),
    // Features
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    {
      provide: APP_PIPE,
      useValue: new StandardSchemaValidationPipe({ exceptionFactory: validationExceptionFactory }),
    },
  ],
})
export class AppModule {}
