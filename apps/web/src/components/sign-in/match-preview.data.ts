/** Illustrative records for the sign-in preview: shaped like real Paritas data, not real data. */
export interface PreviewField {
  label: string;
  gateway: string;
  ledger: string;
}

export const PREVIEW_FIELDS: PreviewField[] = [
  { label: 'Amount', gateway: '$1,240.00', ledger: '$1,240.00' },
  { label: 'Currency', gateway: 'USD', ledger: 'USD' },
  {
    label: 'Customer',
    gateway: 'ap@bluefinch-supply.example',
    ledger: 'ap@bluefinch-supply.example',
  },
  { label: 'Paid', gateway: '9:41 AM', ledger: '9:55 AM' },
  { label: 'Status', gateway: 'Succeeded', ledger: 'Succeeded' },
];

/** Signal weights are the engine's own (amount 0.45, customer 0.30, time 0.25). */
export const PREVIEW_SCORE = [
  { label: 'Amount', value: 1 },
  { label: 'Customer', value: 1 },
  { label: 'Time', value: 0.88 },
] as const;

export const PREVIEW_TOTAL_SCORE = '0.97';
