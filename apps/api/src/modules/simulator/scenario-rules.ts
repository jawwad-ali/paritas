import { faker } from '@faker-js/faker';
import type { SimulatedScenario, SimulatorGatewayMode } from '@paritas/shared';
import {
  ANOMALY_SCENARIOS,
  CLEAN_SCENARIO_WEIGHTS,
  FEE_DIFFERENCE_MINOR,
  FUZZY_LEAD_MINUTES,
  LEDGER_LEAD_SECONDS,
  MIN_MISMATCH_MINOR,
  MISMATCH_FRACTION,
  STRIPE_MODE_UNSUPPORTED,
} from './simulator.constants.js';
import type { GatewayOutcome, LedgerEntry, SimulatedPayment } from './simulator.types.js';

/**
 * The single place that says what each scenario means for each system. The
 * matching engine (Phase 3) must turn exactly these situations into matches or
 * the corresponding exceptions.
 */

export const planScenarios = (
  count: number,
  anomalyRate: number,
  gateway: SimulatorGatewayMode,
): SimulatedScenario[] => {
  const anomalies = ANOMALY_SCENARIOS.filter(
    (scenario) => gateway === 'synthetic' || !STRIPE_MODE_UNSUPPORTED.includes(scenario),
  );
  return Array.from({ length: count }, () =>
    faker.datatype.boolean({ probability: anomalyRate })
      ? faker.helpers.arrayElement(anomalies)
      : faker.helpers.weightedArrayElement([...CLEAN_SCENARIO_WEIGHTS]),
  );
};

export const hasGatewayRecord = (scenario: SimulatedScenario): boolean =>
  scenario !== 'MISSING_AT_GATEWAY';

export const gatewayOutcomeFor = (scenario: SimulatedScenario): GatewayOutcome => {
  if (scenario === 'STATUS_CONFLICT') {
    return 'failed';
  }
  if (scenario === 'DELAYED_SETTLEMENT') {
    return 'processing';
  }
  return 'succeeded';
};

const ledgerEntryCountFor = (scenario: SimulatedScenario): number => {
  if (scenario === 'MISSING_IN_LEDGER') {
    return 0;
  }
  return scenario === 'DUPLICATE_IN_LEDGER' ? 2 : 1;
};

const ledgerAmountFor = ({ scenario, amountMinor }: SimulatedPayment): number => {
  if (scenario === 'FEE_WITHIN_TOLERANCE') {
    // The ledger booked the amount net of a small processing fee.
    return amountMinor - faker.number.int(FEE_DIFFERENCE_MINOR);
  }
  if (scenario === 'AMOUNT_MISMATCH') {
    // The ledger booked the pre-discount total.
    const fraction = faker.number.float({ ...MISMATCH_FRACTION, fractionDigits: 2 });
    return amountMinor + Math.max(MIN_MISMATCH_MINOR, Math.round(amountMinor * fraction));
  }
  return amountMinor;
};

const ledgerLeadMsFor = (scenario: SimulatedScenario): number =>
  scenario === 'FUZZY_MATCH'
    ? faker.number.int(FUZZY_LEAD_MINUTES) * 60_000
    : faker.number.int(LEDGER_LEAD_SECONDS) * 1_000;

const ledgerReferenceFor = (
  scenario: SimulatedScenario,
  gatewayReference: string | null,
  fabricateReference: () => string,
): string | null => {
  if (scenario === 'FUZZY_MATCH') {
    return null; // checkout did not capture the gateway's id
  }
  return gatewayReference ?? fabricateReference();
};

export const ledgerEntriesFor = (
  payment: SimulatedPayment,
  gatewayReference: string | null,
  fabricateReference: () => string,
): LedgerEntry[] =>
  Array.from({ length: ledgerEntryCountFor(payment.scenario) }, () => ({
    entryId: `LED-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`,
    reference: ledgerReferenceFor(payment.scenario, gatewayReference, fabricateReference),
    amountMinor: ledgerAmountFor(payment),
    status: payment.scenario === 'DELAYED_SETTLEMENT' ? 'PENDING' : 'SUCCEEDED',
    occurredAt: new Date(payment.gatewayAt.getTime() - ledgerLeadMsFor(payment.scenario)),
  }));
