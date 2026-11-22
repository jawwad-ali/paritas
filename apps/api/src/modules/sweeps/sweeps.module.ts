import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service.js';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { ReconciliationModule } from '../reconciliation/reconciliation.module.js';
import { CronController } from './cron.controller.js';
import { SweepOnTrafficMiddleware } from './sweep-on-traffic.middleware.js';
import { SweepRunner } from './sweep-runner.service.js';

/**
 * Periodic sweeps without BullMQ. The queue runner schedules them as BullMQ jobs;
 * the inline runner (serverless) starts them from traffic and from the cron route.
 */
@Module({
  imports: [IngestionModule, ReconciliationModule],
  controllers: [CronController],
  providers: [SweepRunner, SweepOnTrafficMiddleware],
})
export class SweepsModule implements NestModule {
  constructor(private readonly config: AppConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    if (this.config.runsJobsInline) {
      consumer
        .apply(SweepOnTrafficMiddleware)
        .forRoutes({ path: '{/*splat}', method: RequestMethod.ALL });
    }
  }
}
