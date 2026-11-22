import { Injectable } from '@nestjs/common';
import {
  ExceptionStatus,
  ExceptionTransactionRole,
  MatchStatus,
  type Prisma,
  ReconciliationStatus,
  SourceKind,
} from '../../../generated/prisma/client.js';
import {
  AMBIGUITY_MARGIN,
  CANDIDACY_BLOCKING_TYPES,
  SETTLE_WINDOW_MS,
} from '../reconciliation.constants.js';
import type {
  Counterpart,
  MatchingRules,
  ScoreBreakdown,
  TransactionWithSource,
} from '../reconciliation.types.js';
import { amountTolerance, scoreCandidate } from '../rules/scoring.js';

type Tx = Prisma.TransactionClient;

const OPEN_STATUSES = [ExceptionStatus.OPEN, ExceptionStatus.INVESTIGATING];
const MAX_FUZZY_CANDIDATES = 50;
/** Deterministic "first" record: the earliest payment, then the earliest ingested. */
const CHRONOLOGICAL: Prisma.TransactionOrderByWithRelationInput[] = [
  { occurredAt: 'asc' },
  { createdAt: 'asc' },
  { id: 'asc' },
];

const otherSide = (txn: TransactionWithSource): SourceKind =>
  txn.source.kind === SourceKind.PAYMENT_GATEWAY
    ? SourceKind.INTERNAL_LEDGER
    : SourceKind.PAYMENT_GATEWAY;

/** Finds the record on the other side that represents the same payment. */
@Injectable()
export class CandidateFinder {
  /** Same source, same reference: the first is the original, the rest are duplicates. */
  referenceGroup(tx: Tx, txn: TransactionWithSource): Promise<TransactionWithSource[]> {
    return tx.transaction.findMany({
      where: { sourceId: txn.sourceId, reference: txn.reference },
      include: { source: true },
      orderBy: CHRONOLOGICAL,
    });
  }

  async counterpartOf(
    tx: Tx,
    txn: TransactionWithSource,
    rules: MatchingRules,
    now: Date,
  ): Promise<Counterpart> {
    const partner = await this.activeMatchPartner(tx, txn);
    if (partner) {
      return { kind: 'matched', other: partner };
    }
    if (txn.reference) {
      const exact = await this.exactCounterpart(tx, txn);
      if (exact) {
        return { kind: 'exact', other: exact };
      }
    }
    return this.bestFuzzyCandidate(tx, txn, rules, now);
  }

  private async activeMatchPartner(
    tx: Tx,
    txn: TransactionWithSource,
  ): Promise<TransactionWithSource | null> {
    if (!txn.matchId) {
      return null;
    }
    return tx.transaction.findFirst({
      where: { matchId: txn.matchId, id: { not: txn.id }, match: { status: MatchStatus.ACTIVE } },
      include: { source: true },
    });
  }

  /** Only the original of a duplicate group is eligible; duplicates are handled as such. */
  private async exactCounterpart(
    tx: Tx,
    txn: TransactionWithSource,
  ): Promise<TransactionWithSource | null> {
    const original = await tx.transaction.findFirst({
      where: { source: { kind: otherSide(txn) }, reference: txn.reference },
      include: { source: true },
      orderBy: CHRONOLOGICAL,
    });
    if (!original || original.matchId || (await this.isBlocked(tx, original.id, txn.id))) {
      return null;
    }
    return original;
  }

  private async bestFuzzyCandidate(
    tx: Tx,
    txn: TransactionWithSource,
    rules: MatchingRules,
    now: Date,
  ): Promise<Counterpart> {
    const settledBefore = new Date(now.getTime() - SETTLE_WINDOW_MS);
    // Symmetric to the candidate rule below: a record that carries a reference
    // first gets time for its exact counterpart to arrive before guessing.
    if (txn.reference && txn.createdAt > settledBefore) {
      return { kind: 'none' };
    }
    const windowMs = rules.timeWindowMinutes * 60_000;
    // Generous pre-filter; scoreCandidate applies the exact tolerance afterwards.
    const slack = amountTolerance(txn.amountMinor * 2n, rules);
    const candidates = await tx.transaction.findMany({
      where: {
        id: { not: txn.id },
        source: { kind: otherSide(txn) },
        currency: txn.currency,
        matchId: null,
        reconciliationStatus: { not: ReconciliationStatus.MATCHED },
        occurredAt: {
          gte: new Date(txn.occurredAt.getTime() - windowMs),
          lte: new Date(txn.occurredAt.getTime() + windowMs),
        },
        amountMinor: { gte: txn.amountMinor - slack, lte: txn.amountMinor + slack },
        AND: [
          // Two different references mean two different payments.
          txn.reference ? { reference: null } : {},
          // A candidate with a reference first gets time to meet its exact counterpart.
          { OR: [{ reference: null }, { createdAt: { lt: settledBefore } }] },
        ],
      },
      include: { source: true },
      take: MAX_FUZZY_CANDIDATES,
    });

    const scored: Array<{ other: TransactionWithSource; breakdown: ScoreBreakdown }> = [];
    for (const candidate of candidates) {
      const breakdown = scoreCandidate(txn, candidate, rules);
      if (breakdown && !(await this.isBlocked(tx, candidate.id, txn.id))) {
        scored.push({ other: candidate, breakdown });
      }
    }
    scored.sort(
      (a, b) =>
        b.breakdown.score - a.breakdown.score ||
        a.breakdown.timeDifferenceMinutes - b.breakdown.timeDifferenceMinutes,
    );

    const [best, runnerUp] = scored;
    if (!best || best.breakdown.score < rules.candidateThreshold) {
      return { kind: 'none' };
    }
    const ambiguous =
      runnerUp !== undefined && best.breakdown.score - runnerUp.breakdown.score < AMBIGUITY_MARGIN;
    return { kind: 'fuzzy', other: best.other, breakdown: best.breakdown, ambiguous };
  }

  /** True when the candidate is already tied up in a dispute that does not involve `subjectId`. */
  private async isBlocked(tx: Tx, candidateId: string, subjectId: string): Promise<boolean> {
    const blocking = await tx.exceptionTransaction.count({
      where: {
        transactionId: candidateId,
        role: ExceptionTransactionRole.SUBJECT,
        exception: {
          status: { in: OPEN_STATUSES },
          type: { in: [...CANDIDACY_BLOCKING_TYPES] },
          transactions: { none: { transactionId: subjectId } },
        },
      },
    });
    return blocking > 0;
  }
}
