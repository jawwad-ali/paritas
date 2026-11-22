import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../app.module.js';
import { AppConfigService } from '../config/app-config.service.js';
import { configureApp } from './configure-app.js';
import { setupSwagger } from './setup-swagger.js';

export interface CreatedApp {
  app: NestExpressApplication;
  config: AppConfigService;
  logger: Logger;
}

/** The configured app, shared by the long-running server (main.ts) and the Vercel Function (serverless.ts). */
export const createApp = async (): Promise<CreatedApp> => {
  // Buffer logs until pino is ready so boot messages are structured too.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Webhook signatures are computed over the exact bytes sent; keep them.
    rawBody: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(AppConfigService);
  configureApp(app, config);

  if (config.get('SWAGGER_ENABLED')) {
    setupSwagger(app);
  }
  return { app, config, logger };
};
