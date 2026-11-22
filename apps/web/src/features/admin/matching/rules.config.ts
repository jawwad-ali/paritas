import { MATCHING_CONFIG_LIMITS, type MatchingConfigDto } from '@paritas/shared';

export type RuleKey = keyof typeof MATCHING_CONFIG_LIMITS;

export interface RuleDefinition {
  key: RuleKey;
  label: string;
  /** What the rule does, in one plain sentence. */
  help: string;
  /** Shown value and form unit: the API stores bps and minutes; people think in % and minutes. */
  unit: string;
  toDisplay: (value: number) => number;
  fromDisplay: (value: number) => number;
  step: number;
}

const same = (value: number): number => value;

export const RULES: RuleDefinition[] = [
  {
    key: 'amountToleranceMinor',
    label: 'Fixed amount tolerance',
    help: 'Absorbs fixed fees. In minor units: 50 is $0.50.',
    unit: 'cents',
    toDisplay: same,
    fromDisplay: Math.round,
    step: 1,
  },
  {
    key: 'amountToleranceBps',
    label: 'Relative amount tolerance',
    help: 'Absorbs percentage fees. The larger of the two tolerances applies.',
    unit: '%',
    toDisplay: (bps) => bps / 100,
    fromDisplay: (percent) => Math.round(percent * 100),
    step: 0.01,
  },
  {
    key: 'timeWindowMinutes',
    label: 'Time window',
    help: 'How far apart the two records may be for a fuzzy match.',
    unit: 'minutes',
    toDisplay: same,
    fromDisplay: Math.round,
    step: 1,
  },
  {
    key: 'autoMatchThreshold',
    label: 'Auto-match threshold',
    help: 'A fuzzy match scoring at or above this is confirmed without a person.',
    unit: 'score 0–1',
    toDisplay: same,
    fromDisplay: same,
    step: 0.01,
  },
  {
    key: 'candidateThreshold',
    label: 'Suggestion threshold',
    help: 'Below this a record is not suggested at all; between this and auto-match, a person reviews it.',
    unit: 'score 0–1',
    toDisplay: same,
    fromDisplay: same,
    step: 0.01,
  },
  {
    key: 'missingAfterMinutes',
    label: 'Missing after',
    help: 'A record still without a counterpart after this long becomes a Missing exception.',
    unit: 'minutes',
    toDisplay: same,
    fromDisplay: Math.round,
    step: 1,
  },
];

export type RuleValues = Pick<MatchingConfigDto, RuleKey>;
