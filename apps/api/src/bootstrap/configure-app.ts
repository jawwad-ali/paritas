import { type INestApplication, VersioningType } from '@nestjs/common';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, REQUEST_ID_HEADER } from '@paritas/shared';
import helmet from 'helmet';
import type { AppConfigService } from '../config/app-config.service.js';

/** HTTP-level concerns shared by `main.ts` and the e2e test harness. */
export const configureApp = (app: INestApplication, config: AppConfigService): void => {
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGINS'),
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION });
  app.enableShutdownHooks();
};
