import type { ExceptionActivityType, ExceptionType } from '@paritas/shared';

/** What each exception means and what usually settles it, in plain words. */
export const TYPE_GUIDANCE: Record<ExceptionType, { meaning: string; next: string }> = {
  MISSING: {
    meaning: 'This record exists on one side only, past the grace period.',
    next: 'Look for the counterpart and match it, or resolve with what happened (for example, booked by hand).',
  },
  AMOUNT_MISMATCH: {
    meaning: 'The two records are the same payment but the amounts differ beyond the tolerance.',
    next: 'Correct the amount at the source, or match anyway when the difference is explained (fees, a discount).',
  },
  DUPLICATE: {
    meaning:
      'One source recorded the same payment more than once. The earliest record stays; the copies are held here.',
    next: 'Void the copies at the source, then resolve with the reason.',
  },
  STATUS_CONFLICT: {
    meaning:
      'The two records disagree on what happened, for example succeeded on one side and failed on the other.',
    next: 'Find which side is right and correct the other (book the refund, reverse the entry).',
  },
  DELAYED: {
    meaning: 'The payment is still pending past the expected settlement time.',
    next: 'It closes itself when the payment settles. Investigate if it stays pending.',
  },
  LOW_CONFIDENCE_MATCH: {
    meaning:
      'The engine found a probable counterpart, but the score is below the auto-match threshold.',
    next: 'Confirm the match if the records are the same payment, or ignore it to reject the suggestion.',
  },
  OTHER: {
    meaning:
      'The records disagree in a way not covered by the other types, such as different currencies.',
    next: 'Review the details and resolve with the reason.',
  },
};

export const ACTIVITY_LABELS: Record<ExceptionActivityType, string> = {
  CREATED: 'Detected',
  STATUS_CHANGED: 'Status changed',
  SEVERITY_CHANGED: 'Severity changed',
  ASSIGNED: 'Assignment',
  NOTE_ADDED: 'Note',
  MANUALLY_MATCHED: 'Matched manually',
  REOPENED: 'Reopened',
};

export const MATCHING_ENGINE = 'Matching engine';
