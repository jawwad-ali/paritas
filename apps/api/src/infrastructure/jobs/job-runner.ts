import type { DynamicModule, Type } from '@nestjs/common';
import { jobRunnerSchema } from '../../config/env.schema.js';
import { QueueModule } from '../queue/queue.module.js';
import { RedisModule } from '../redis/redis.module.js';

/**
 * Module wiring is decided before Nest builds the config service, so the runner
 * is read from the environment directly (ConfigModule has already loaded `.env`
 * by the time AppModule is declared) with the same schema the config uses.
 */
export const readJobRunner = () => jobRunnerSchema.parse(process.env['JOB_RUNNER'] || undefined);

/** Redis and BullMQ exist only for the queue runner; the inline runner never connects to them. */
export const jobInfrastructureModules = (): (Type | DynamicModule)[] =>
  readJobRunner() === 'queue' ? [RedisModule, QueueModule] : [];
