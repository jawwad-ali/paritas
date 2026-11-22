import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../../config/app-config.service.js';
import { STRIPE_TEST_PAYMENT_METHODS } from './simulator.constants.js';
import type { SimulatedPayment } from './simulator.types.js';

/**
 * Creates real PaymentIntents in Stripe test mode, so Stripe itself emits the
 * webhooks. Only test keys are accepted (enforced by env validation).
 */
@Injectable()
export class StripeTestGateway {
  private readonly client: Stripe | null;

  constructor(config: AppConfigService) {
    const key = config.get('STRIPE_SECRET_KEY');
    this.client = key ? new Stripe(key) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * @param idempotencyKey makes a retried call return the same PaymentIntent
   *   instead of charging twice.
   * @returns the PaymentIntent id (also for declined payments, which Stripe keeps).
   */
  async createPayment(
    payment: SimulatedPayment,
    outcome: 'succeeded' | 'failed',
    idempotencyKey: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Stripe test gateway is not configured.');
    }
    try {
      const intent = await this.client.paymentIntents.create(
        {
          amount: payment.amountMinor,
          currency: payment.currency.toLowerCase(),
          confirm: true,
          payment_method:
            outcome === 'succeeded'
              ? STRIPE_TEST_PAYMENT_METHODS.SUCCEEDS
              : STRIPE_TEST_PAYMENT_METHODS.DECLINED,
          // Server-side confirmation without a browser: no redirect-based methods.
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          description: payment.description,
          metadata: {
            order_id: payment.orderId,
            customer_email: payment.customerEmail,
            paritas_simulated: 'true',
          },
        },
        { idempotencyKey },
      );
      return intent.id;
    } catch (error) {
      // A decline is the outcome we asked for; Stripe still created the PaymentIntent.
      if (error instanceof Stripe.errors.StripeCardError && error.payment_intent?.id) {
        return error.payment_intent.id;
      }
      throw error;
    }
  }
}
