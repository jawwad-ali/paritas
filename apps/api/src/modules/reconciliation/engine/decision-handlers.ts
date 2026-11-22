import { Injectable } from '@nestjs/common';
import {
  MatchMethod,
  type Prisma,
  ReconciliationStatus,
  TransactionStatus,
} from '../../../generated/prisma/client.js';
import { SETTLE_WINDOW_MS } from '../reconciliation.constants.js';
import type {
  Counterpart,
  EvaluationMode,
  MatchingRules,
  Pair,
  TransactionWithSource,
} from '../reconciliation.types.js';
import * as specs from '../rules/exception-specs.js';
import { comparePair } from '../rules/pair-verdict.js';
import { ExceptionWriter } from './exception-writer.js';
import { MatchWriter } from './match-writer.js';

/** State of one evaluation, shared by the engine and the decision handlers. */
export interface Evaluation {
  tx: Prisma.TransactionClient;
  rules: MatchingRules;
  mode: EvaluationMode;
  now: Date;
  /** Every transaction whose status may have changed; recomputed at the end. */
  touched: Set<string>;
}

/** Turns a found (or absent) counterpart into the right outcome: match, exception, or wait. */
@Injectable()
export class DecisionHandlers {
  constructor(
    private readonly exceptions: ExceptionWriter,
    private readonly matches: MatchWriter,
  ) {}

  async decidePair(
    evaluation: Evaluation,
    pair: Pair,
    counterpart: Exclude<Counterpart, { kind: 'none' }>,
  ): Promise<void> {
    const { tx, rules, touched } = evaluation;
    touched.add(pair.gateway.id).add(pair.ledger.id);

    if (
      counterpart.kind === 'fuzzy' &&
      (counterpart.ambiguous || counterpart.breakdown.score < rules.autoMatchThreshold)
    ) {
      const spec = specs.lowConfidenceSpec(pair, counterpart.breakdown, counterpart.ambiguous);
      await this.exceptions.ensure(tx, spec, touched);
      return;
    }

    const verdict = comparePair(pair, rules);
    switch (verdict.kind) {
      case 'agree': {
        const fuzzy = counterpart.kind === 'fuzzy' ? counterpart.breakdown : null;
        const method = fuzzy ? MatchMethod.FUZZY : MatchMethod.EXACT;
        await this.matches.ensure(tx, pair, method, fuzzy?.score ?? 1, fuzzy);
        await this.exceptions.autoResolve(tx, [pair.gateway.id, pair.ledger.id], touched);
        return;
      }
      case 'pending': {
        const pending = [pair.gateway, pair.ledger].filter(
          (txn) => txn.status === TransactionStatus.PENDING,
        );
        if (pending.some((txn) => isPastGrace(evaluation, txn))) {
          const spec = specs.delayedSpec([pair.gateway, pair.ledger], rules.missingAfterMinutes);
          await this.exceptions.ensure(tx, spec, touched);
        }
        return;
      }
      case 'currency_mismatch':
        await this.exceptions.ensure(tx, specs.currencyMismatchSpec(pair), touched);
        return;
      case 'status_conflict':
        await this.exceptions.ensure(tx, specs.statusConflictSpec(pair), touched);
        return;
      case 'amount_mismatch':
        await this.exceptions.ensure(
          tx,
          specs.amountMismatchSpec(pair, verdict.differenceMinor),
          touched,
        );
    }
  }

  /** No counterpart. Only the sweep, after the grace period, may conclude anything. */
  async decideOneSided(evaluation: Evaluation, txn: TransactionWithSource): Promise<void> {
    const { tx, rules, touched } = evaluation;
    if (!isPastGrace(evaluation, txn)) {
      return;
    }
    if (txn.status === TransactionStatus.FAILED) {
      // A declined payment nobody recorded: nothing moved, nothing to reconcile.
      if (txn.reconciliationStatus === ReconciliationStatus.UNMATCHED) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: { reconciliationStatus: ReconciliationStatus.EXCLUDED },
        });
      }
      return;
    }
    const spec =
      txn.status === TransactionStatus.PENDING
        ? specs.delayedSpec([txn], rules.missingAfterMinutes)
        : specs.missingSpec(txn, rules.missingAfterMinutes);
    await this.exceptions.ensure(tx, spec, touched);
  }
}

/** True in sweep mode once both the payment's age and its ingestion age exceed the grace rules. */
const isPastGrace = ({ mode, now, rules }: Evaluation, txn: TransactionWithSource): boolean =>
  mode === 'sweep' &&
  now.getTime() - txn.occurredAt.getTime() > rules.missingAfterMinutes * 60_000 &&
  now.getTime() - txn.createdAt.getTime() > SETTLE_WINDOW_MS;
