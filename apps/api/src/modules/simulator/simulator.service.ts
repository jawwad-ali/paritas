import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  SOURCE_CODES,
  type SimulatedScenario,
  type SimulatorRunRequest,
  type SimulatorRunResult,
} from '@paritas/shared';
import { randomUUID } from 'node:crypto';
import { mapWithConcurrency } from '../../common/utils/concurrency.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { AUDIT_ACTIONS } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { IngestionService } from '../ingestion/ingestion.service.js';
import { buildPayment } from './payment-factory.js';
import {
  gatewayOutcomeFor,
  hasGatewayRecord,
  ledgerEntriesFor,
  planScenarios,
} from './scenario-rules.js';
import { STRIPE_CONCURRENCY } from './simulator.constants.js';
import type { SimulatedPayment } from './simulator.types.js';
import { StripeTestGateway } from './stripe-test-gateway.service.js';
import { buildLedgerEvent, buildStripeEvent, syntheticStripeId } from './synthetic-events.js';

interface PaymentOutcome {
  gatewayEvents: number;
  ledgerEvents: number;
}

/**
 * Plays both sides of a merchant's payments (the gateway and the internal
 * ledger) and injects realistic discrepancies. Everything enters Paritas through
 * the same ingestion path as production traffic.
 */
@Injectable()
export class SimulatorService {
  constructor(
    private readonly config: AppConfigService,
    private readonly ingestion: IngestionService,
    private readonly stripe: StripeTestGateway,
    private readonly audit: AuditService,
  ) {}

  async run(request: SimulatorRunRequest): Promise<SimulatorRunResult> {
    if (!this.config.get('SIMULATOR_ENABLED')) {
      throw new NotFoundException('The simulator is disabled.');
    }
    if (request.gateway === 'stripe' && !this.stripe.isConfigured) {
      throw new BadRequestException('Stripe mode needs STRIPE_SECRET_KEY (a test-mode key).');
    }

    const runId = randomUUID();
    // Real Stripe payments are created "now"; only synthetic ones can be backdated.
    const spreadHours = request.gateway === 'synthetic' ? request.spreadHours : 0;
    const payments = planScenarios(request.count, request.anomalyRate, request.gateway).map(
      (scenario) => buildPayment(scenario, spreadHours),
    );

    const concurrency = request.gateway === 'stripe' ? STRIPE_CONCURRENCY : 1;
    const outcomes = await mapWithConcurrency(payments, concurrency, (payment, index) =>
      this.simulate(payment, request.gateway === 'stripe', `${runId}-${index}`),
    );

    const result: SimulatorRunResult = {
      runId,
      gateway: request.gateway,
      payments: payments.length,
      scenarios: countScenarios(payments.map((payment) => payment.scenario)),
      gatewayEvents: outcomes.reduce((sum, outcome) => sum + outcome.gatewayEvents, 0),
      ledgerEvents: outcomes.reduce((sum, outcome) => sum + outcome.ledgerEvents, 0),
    };
    await this.audit.record({
      action: AUDIT_ACTIONS.SIMULATOR_RUN,
      details: { ...result, anomalyRate: request.anomalyRate },
    });
    return result;
  }

  private async simulate(
    payment: SimulatedPayment,
    useStripe: boolean,
    idempotencyKey: string,
  ): Promise<PaymentOutcome> {
    let gatewayReference: string | null = null;
    let gatewayEvents = 0;

    if (hasGatewayRecord(payment.scenario)) {
      gatewayEvents = 1;
      const outcome = gatewayOutcomeFor(payment.scenario);
      if (useStripe && outcome !== 'processing') {
        // Stripe sends the webhook itself (forwarded by `stripe listen`).
        gatewayReference = await this.stripe.createPayment(payment, outcome, idempotencyKey);
      } else {
        gatewayReference = syntheticStripeId('pi');
        const event = buildStripeEvent(payment, gatewayReference, outcome);
        await this.ingestion.receive(SOURCE_CODES.STRIPE, event);
      }
    }

    const entries = ledgerEntriesFor(payment, gatewayReference, () => syntheticStripeId('pi'));
    for (const entry of entries) {
      await this.ingestion.receive(SOURCE_CODES.INTERNAL_LEDGER, buildLedgerEvent(payment, entry));
    }
    return { gatewayEvents, ledgerEvents: entries.length };
  }
}

const countScenarios = (
  scenarios: SimulatedScenario[],
): Partial<Record<SimulatedScenario, number>> =>
  scenarios.reduce<Partial<Record<SimulatedScenario, number>>>((counts, scenario) => {
    counts[scenario] = (counts[scenario] ?? 0) + 1;
    return counts;
  }, {});
