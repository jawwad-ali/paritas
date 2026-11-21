import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { REQUEST_ID_HEADER } from '@paritas/shared';
import type { Params } from 'nestjs-pino';
import type { AppConfigService } from '../../config/app-config.service.js';
import { REDACTED_LOG_PATHS, UNLOGGED_PATH_PREFIXES } from './logger.constants.js';

const MAX_INBOUND_REQUEST_ID_LENGTH = 128;

interface SerializedRequest {
  id: string;
  method: string;
  url: string;
}

interface SerializedResponse {
  statusCode: number;
}

/** Reuse a caller-supplied request id (e.g. from a load balancer) or mint one. */
const resolveRequestId = (req: IncomingMessage, res: ServerResponse): string => {
  const inbound = req.headers[REQUEST_ID_HEADER];
  const requestId =
    typeof inbound === 'string' &&
    inbound.length > 0 &&
    inbound.length <= MAX_INBOUND_REQUEST_ID_LENGTH
      ? inbound
      : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, requestId);
  return requestId;
};

const isUnloggedPath = (req: IncomingMessage): boolean =>
  UNLOGGED_PATH_PREFIXES.some((prefix) => req.url?.startsWith(prefix) ?? false);

export const buildLoggerOptions = (config: AppConfigService): Params => ({
  pinoHttp: {
    level: config.get('LOG_LEVEL'),
    genReqId: resolveRequestId,
    redact: { paths: [...REDACTED_LOG_PATHS], censor: '[REDACTED]' },
    autoLogging: { ignore: isUnloggedPath },
    // Keep request logs lean: headers are noisy and may carry secrets.
    serializers: {
      req: (req: SerializedRequest) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res: SerializedResponse) => ({ statusCode: res.statusCode }),
    },
    // JSON in production (for log shippers), human-readable locally.
    transport: config.isProduction
      ? undefined
      : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l' } },
  },
});
