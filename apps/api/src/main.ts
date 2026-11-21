import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap/configure-app.js';
import { SWAGGER_PATH, setupSwagger } from './bootstrap/setup-swagger.js';
import { AppConfigService } from './config/app-config.service.js';

const bootstrap = async (): Promise<void> => {
  // Buffer logs until pino is ready so boot messages are structured too.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(AppConfigService);
  configureApp(app, config);

  if (config.get('SWAGGER_ENABLED')) {
    setupSwagger(app);
  }

  const port = config.get('PORT');
  await app.listen(port);
  logger.log(`Paritas API listening on port ${port}`, 'Bootstrap');
  if (config.get('SWAGGER_ENABLED')) {
    logger.log(`API docs at http://localhost:${port}/${SWAGGER_PATH}`, 'Bootstrap');
  }
};

await bootstrap();
