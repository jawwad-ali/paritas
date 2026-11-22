import type { ExceptionSeverity, ExceptionStatus, ExceptionType } from '@paritas/shared';

/**
 * Illustrative rows for the design system, shaped like the simulator's output
 * (Stripe PaymentIntent ids, ledger entry ids). Not real customers or payments.
 */
export interface SampleException {
  number: number;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  reference: string;
  amountMinor: number;
  currency: string;
  /** Minutes since detection. */
  openMinutes: number;
  assignee: string | null;
}

export const SAMPLE_EXCEPTIONS: SampleException[] = [
  {
    number: 1042,
    type: 'MISSING',
    severity: 'CRITICAL',
    status: 'OPEN',
    title: 'Ledger entry has no matching gateway payment',
    reference: 'LED-7Q2K9',
    amountMinor: 481250,
    currency: 'USD',
    openMinutes: 134,
    assignee: null,
  },
  {
    number: 1041,
    type: 'STATUS_CONFLICT',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    title: 'Stripe failed, ledger succeeded',
    reference: 'pi_3QhK2sVn8',
    amountMinor: 31137,
    currency: 'USD',
    openMinutes: 182,
    assignee: 'You',
  },
  {
    number: 1039,
    type: 'AMOUNT_MISMATCH',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Stripe $389.40, ledger $537.37',
    reference: 'pi_3QgT8aLk2',
    amountMinor: 38940,
    currency: 'USD',
    openMinutes: 280,
    assignee: null,
  },
  {
    number: 1037,
    type: 'DUPLICATE',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Ledger recorded the payment twice',
    reference: 'pi_3QfR1cPw4',
    amountMinor: 14922,
    currency: 'USD',
    openMinutes: 311,
    assignee: null,
  },
  {
    number: 1033,
    type: 'DELAYED',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Still pending after 60 minutes',
    reference: 'pi_3QeZ4kTm7',
    amountMinor: 44756,
    currency: 'USD',
    openMinutes: 425,
    assignee: null,
  },
  {
    number: 1031,
    type: 'LOW_CONFIDENCE_MATCH',
    severity: 'LOW',
    status: 'OPEN',
    title: 'Probable match, score 0.79',
    reference: 'pi_3QeA9xRb1',
    amountMinor: 74217,
    currency: 'USD',
    openMinutes: 501,
    assignee: null,
  },
  {
    number: 1027,
    type: 'MISSING',
    severity: 'HIGH',
    status: 'RESOLVED',
    title: 'Stripe payment missing from the ledger',
    reference: 'pi_3QcM0dHj6',
    amountMinor: 9610,
    currency: 'USD',
    openMinutes: 46,
    assignee: 'You',
  },
];
