import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './bootstrap/create-app.js';

type RequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

let handler: Promise<RequestHandler> | undefined;

/** One Nest app per function instance, built on the first request and reused while the instance lives. */
const getHandler = (): Promise<RequestHandler> => {
  handler ??= createApp()
    .then(async ({ app }) => {
      await app.init();
      return app.getHttpAdapter().getInstance() as RequestHandler;
    })
    .catch((error: unknown) => {
      handler = undefined; // The next request tries again instead of reusing the failure.
      throw error;
    });
  return handler;
};

/**
 * Entry for Vercel Functions (see api/index.js and vercel.json): every request
 * goes through Express. Runs with JOB_RUNNER=inline, as a function has no worker.
 */
const serverlessHandler = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const app = await getHandler();
  app(request, response);
};

export default serverlessHandler;
