import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

export type WebhookRequest = RawBodyRequest<Request>;

/** Webhook acknowledgement. Senders only care about the 2xx; the body helps debugging. */
export interface WebhookAck {
  received: true;
  duplicate: boolean;
  rawEventId: string;
}
