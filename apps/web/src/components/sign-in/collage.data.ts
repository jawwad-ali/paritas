/**
 * Illustrative records for the sign-in collage: shaped like real Paritas data
 * (the engine's weights, the default 3% + 50¢ tolerance, the seeded officer),
 * but not real data.
 */

export const MATCH_SAMPLE = {
  gatewayId: 'pi_3QgT8aLk2',
  ledgerId: 'LED-7Q2K9',
  score: '0.97',
  fields: [
    { label: 'Amount', gateway: '$1,240.00', ledger: '$1,240.00' },
    { label: 'Customer', gateway: 'ap@bluefinch.example', ledger: 'ap@bluefinch.example' },
    { label: 'Paid', gateway: '9:41 AM', ledger: '9:55 AM' },
  ],
  /** Signal weights are the engine's own: amount 0.45, customer 0.30, time 0.25. */
  signals: [
    { label: 'Amount', value: 1 },
    { label: 'Customer', value: 1 },
    { label: 'Time', value: 0.88 },
  ],
} as const;

export const EVENT_SAMPLE = {
  type: 'payment_intent.succeeded',
  steps: ['Verified', 'Stored', 'Matched'],
} as const;

export const MATCH_RATE_SAMPLE = {
  label: 'Match rate, last 7 days',
  value: '96.4%',
  /** Matched share per day, oldest first. */
  trend: [0.91, 0.94, 0.93, 0.96, 0.95, 0.97, 0.96],
} as const;

export const EXCEPTION_SAMPLE = {
  number: 'EX-1042',
  type: 'Amount mismatch',
  gateway: '$412.00',
  ledger: '$440.00',
  difference: '$28.00 over, beyond the 3% + 50¢ tolerance',
  assignee: 'Carmen Ruelas',
} as const;

export const DECISION_SAMPLE = {
  title: 'Resolve EX-1042',
  reason: 'Ledger booked the pre-discount total; corrected in the ledger.',
} as const;

export const QUEUE_SAMPLE = [
  { label: 'Open', value: '12' },
  { label: 'Critical', value: '2' },
  { label: 'Unassigned', value: '5' },
] as const;

/** Records per day: settled and needing attention. */
export const DAILY_SAMPLE = [
  { day: 'Mon', settled: 168, attention: 9 },
  { day: 'Tue', settled: 182, attention: 7 },
  { day: 'Wed', settled: 175, attention: 12 },
  { day: 'Thu', settled: 196, attention: 6 },
  { day: 'Fri', settled: 214, attention: 10 },
  { day: 'Sat', settled: 121, attention: 4 },
  { day: 'Sun', settled: 104, attention: 3 },
] as const;

export const REPORT_SAMPLE = {
  title: 'Reconciliation summary',
  period: 'Nov 1 – Nov 30',
  timeZone: 'America/New_York',
} as const;

export const CLOSE_TIME_SAMPLE = {
  label: 'Median time to close',
  value: '1.8 h',
  closed: '214 closed this month',
} as const;
