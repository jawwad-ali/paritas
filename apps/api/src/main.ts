import { createApp } from './bootstrap/create-app.js';
import { SWAGGER_PATH } from './bootstrap/setup-swagger.js';

const bootstrap = async (): Promise<void> => {
  const { app, config, logger } = await createApp();

  const port = config.get('PORT');
  await app.listen(port);
  logger.log(`Paritas API listening on port ${port}`, 'Bootstrap');
  if (config.get('SWAGGER_ENABLED')) {
    logger.log(`API docs at http://localhost:${port}/${SWAGGER_PATH}`, 'Bootstrap');
  }
};

await bootstrap();
