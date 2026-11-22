import type {
  ExceptionDetailDto,
  MatchCandidateDto,
  ScoreBreakdownDto,
  TransactionDto,
} from '@paritas/shared';

export interface MatchOption {
  key: string;
  gateway: TransactionDto;
  ledger: TransactionDto;
  /** The record offered as the counterpart (what the person is choosing). */
  counterpart: TransactionDto;
  breakdown: ScoreBreakdownDto | null;
  referenceMatches: boolean;
  /** The pair the exception itself is about (e.g. a low-confidence suggestion). */
  isOwnPair: boolean;
}

/** The record a person is finding a counterpart for: the first unmatched subject. */
export const matchSubject = (exception: ExceptionDetailDto): TransactionDto | undefined =>
  exception.transactions.find((link) => link.role === 'SUBJECT' && !link.match)?.transaction;

const orient = (
  a: TransactionDto,
  b: TransactionDto,
): { gateway: TransactionDto; ledger: TransactionDto } =>
  a.source.kind === 'PAYMENT_GATEWAY' ? { gateway: a, ledger: b } : { gateway: b, ledger: a };

/** The exception's own pair first (when both sides are unmatched subjects), then the engine's suggestions. */
export const buildMatchOptions = (
  exception: ExceptionDetailDto,
  subject: TransactionDto,
  candidates: MatchCandidateDto[],
): MatchOption[] => {
  const subjects = exception.transactions
    .filter((link) => link.role === 'SUBJECT' && !link.match)
    .map((link) => link.transaction);
  const ownCounterpart = subjects.find((txn) => txn.source.kind !== subject.source.kind);

  const own: MatchOption[] = ownCounterpart
    ? [
        {
          key: `pair:${ownCounterpart.id}`,
          ...orient(subject, ownCounterpart),
          counterpart: ownCounterpart,
          breakdown: null,
          referenceMatches:
            subject.reference !== null && subject.reference === ownCounterpart.reference,
          isOwnPair: true,
        },
      ]
    : [];

  const suggested = candidates
    .filter((candidate) => candidate.transaction.id !== ownCounterpart?.id)
    .map<MatchOption>((candidate) => ({
      key: candidate.transaction.id,
      ...orient(subject, candidate.transaction),
      counterpart: candidate.transaction,
      breakdown: candidate.breakdown,
      referenceMatches: candidate.referenceMatches,
      isOwnPair: false,
    }));

  return [...own, ...suggested];
};
