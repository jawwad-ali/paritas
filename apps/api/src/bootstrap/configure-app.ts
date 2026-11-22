import { VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, REQUEST_ID_HEADER } from '@paritas/shared';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { AppConfigService } from '../config/app-config.service.js';

/** HTTP-level concerns shared by `main.ts` and the e2e test harness. */
export const configureApp = (app: NestExpressApplication, config: AppConfigService): void => {
  const trustProxyHops = config.get('TRUST_PROXY_HOPS');
  if (trustProxyHops > 0) {
    // Behind a load balancer: take the client IP from X-Forwarded-For, so rate
    // limits and audit logs see real clients instead of the proxy.
    app.set('trust proxy', trustProxyHops);
  }

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS'),
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION });
  app.enableShutdownHooks();
};
