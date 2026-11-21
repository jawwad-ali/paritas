import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_GLOBAL_PREFIX } from '@paritas/shared';

export const SWAGGER_PATH = `${API_GLOBAL_PREFIX}/docs`;

export const setupSwagger = (app: INestApplication): void => {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Paritas API')
      .setDescription('Transaction reconciliation and data integrity engine')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, document);
};
