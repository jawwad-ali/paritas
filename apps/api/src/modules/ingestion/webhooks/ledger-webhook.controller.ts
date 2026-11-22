import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SOURCE_CODES } from '@paritas/shared';
import { RequestValidationException } from '../../../common/errors/request-validation.exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { Public } from '../../auth/decorators/public.decorator.js';
import { IngestionService } from '../ingestion.service.js';
import { parseJsonObject } from '../ingestion.utils.js';
import { ledgerEventSchema } from '../ledger/ledger-event.schema.js';
import { LEDGER_SIGNATURE_HEADER, verifyLedgerSignature } from '../ledger/ledger-signature.js';
import type { WebhookAck, WebhookRequest } from './webhook.types.js';

/**
 * Internal ledger → Paritas. Because this contract is ours, payloads are
 * validated synchronously: the sending team gets a precise 400 instead of a
 * silently failed event.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('webhooks/internal-ledger')
export class LedgerWebhookController {
  constructor(
    private readonly ingestion: IngestionService,
    private readonly config: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: WebhookRequest,
    @Headers(LEDGER_SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<WebhookAck> {
    if (!request.rawBody) {
      throw new BadRequestException('Missing request body.');
    }
    const secret = this.config.get('INTERNAL_LEDGER_WEBHOOK_SECRET');
    if (!verifyLedgerSignature(request.rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid or expired ledger signature.');
    }

    const payload = parseJsonObject(request.rawBody);
    const parsed = ledgerEventSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RequestValidationException(
        parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join('.') || '(root)',
          message: issue.message,
        })),
      );
    }

    const result = await this.ingestion.receive(SOURCE_CODES.INTERNAL_LEDGER, {
      externalEventId: parsed.data.id,
      eventType: parsed.data.type,
      payload,
    });
    return { received: true, ...result };
  }
}
