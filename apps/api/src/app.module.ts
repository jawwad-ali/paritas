import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validationExceptionFactory } from './common/errors/validation-exception.factory.js';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware.js';
import { RequestContextModule } from './common/request-context/request-context.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { LoggerModule } from './infrastructure/logger/logger.module.js';
import { QueueModule } from './infrastructure/queue/queue.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { HealthModule } from './modules/health/health.module.js';
import { IngestionModule } from './modules/ingestion/ingestion.module.js';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module.js';
import { SimulatorModule } from './modules/simulator/simulator.module.js';
import { SourcesModule } from './modules/sources/sources.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    // Infrastructure
    ConfigModule,
    LoggerModule,
    RequestContextModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        { ttl: config.get('THROTTLE_TTL_MS'), limit: config.get('THROTTLE_LIMIT') },
      ],
    }),
    // Cross-cutting features
    AuditModule,
    AuthModule,
    // Features
    HealthModule,
    UsersModule,
    SourcesModule,
    TransactionsModule,
    IngestionModule,
    ReconciliationModule,
    SimulatorModule,
  ],
  providers: [
    // Global guards run in this order: rate limit → authenticate → authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    {
      provide: APP_PIPE,
      useValue: new StandardSchemaValidationPipe({ exceptionFactory: validationExceptionFactory }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '{/*splat}', method: RequestMethod.ALL });
  }
}
