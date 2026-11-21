import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfigService } from '../../config/app-config.service.js';
import { buildLoggerOptions } from './logger.options.js';

/** Structured JSON logging with a request id attached to every line. */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: buildLoggerOptions,
    }),
  ],
})
export class LoggerModule {}
