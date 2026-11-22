import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SOURCE_CODES } from '@paritas/shared';
import Stripe from 'stripe';
import { AppConfigService } from '../../../config/app-config.service.js';
import { Public } from '../../auth/decorators/public.decorator.js';
import { IngestionService } from '../ingestion.service.js';
import { parseJsonObject } from '../ingestion.utils.js';
import { STRIPE_SIGNATURE_HEADER } from '../stripe/stripe.constants.js';
import type { WebhookAck, WebhookRequest } from './webhook.types.js';

/**
 * Stripe → Paritas. Authenticated by Stripe's signature (not a user session),
 * exempt from rate limiting (Stripe bursts and retries), and acknowledged as
 * soon as the raw event is durable.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly ingestion: IngestionService,
    private readonly config: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: WebhookRequest,
    @Headers(STRIPE_SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<WebhookAck> {
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Stripe webhooks are not configured.');
    }
    if (!request.rawBody || !signature) {
      throw new BadRequestException('Missing body or Stripe-Signature header.');
    }

    let event: Stripe.Event;
    try {
      // Verifies the HMAC over the exact bytes received, and rejects stale timestamps.
      event = Stripe.webhooks.constructEvent(request.rawBody, signature, secret);
    } catch (error) {
      this.logger.warn({ err: error }, 'Rejected Stripe webhook with an invalid signature.');
      throw new BadRequestException('Invalid Stripe signature.');
    }

    const result = await this.ingestion.receive(SOURCE_CODES.STRIPE, {
      externalEventId: event.id,
      eventType: event.type,
      payload: parseJsonObject(request.rawBody),
    });
    return { received: true, ...result };
  }
}
