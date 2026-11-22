import { faker } from '@faker-js/faker';
import type { SimulatedScenario } from '@paritas/shared';
import { ORDER_AMOUNT_MINOR, SIMULATED_CURRENCY } from './simulator.constants.js';
import type { SimulatedPayment } from './simulator.types.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_SECOND = 1000;

/** Stripe timestamps have whole-second precision; match it so both sides compare exactly. */
const truncateToSecond = (epochMs: number): Date =>
  new Date(Math.floor(epochMs / MS_PER_SECOND) * MS_PER_SECOND);

/** A plausible US e-commerce order. Emails use example.com (RFC 2606), never real domains. */
export const buildPayment = (
  scenario: SimulatedScenario,
  spreadHours: number,
): SimulatedPayment => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const orderId = `ORD-${faker.string.numeric(6)}`;

  return {
    scenario,
    orderId,
    amountMinor: faker.number.int(ORDER_AMOUNT_MINOR),
    currency: SIMULATED_CURRENCY,
    customerEmail: faker.internet
      .email({ firstName, lastName, provider: 'example.com' })
      .toLowerCase(),
    description: `Order ${orderId}`,
    gatewayAt: truncateToSecond(
      Date.now() - faker.number.int({ min: 0, max: spreadHours * MS_PER_HOUR }),
    ),
  };
};
