import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { ReconciliationQueueService } from '../reconciliation-queue.service.js';
import { MATCHING_TRANSACTION_OPTIONS } from '../reconciliation.constants.js';
import type { EvaluationMode, TransactionWithSource } from '../reconciliation.types.js';
import { duplicateSpec } from '../rules/exception-specs.js';
import { orient } from '../rules/sides.js';
import { CandidateFinder } from './candidate-finder.js';
import { lockCurrencies } from './currency-lock.js';
import { DecisionHandlers, type Evaluation } from './decision-handlers.js';
import { ExceptionWriter } from './exception-writer.js';
import { MatchingConfigService } from './matching-config.service.js';
import { StatusRecalculator } from './status-recalculator.js';

/**
 * Reconciles one transaction against the other side and converges the database
 * to the right state: a match, an exception, or "not yet". Idempotent, so it can
 * run any number of times for the same transaction.
 *
 * Concurrency: evaluations of the same currency are serialised with a Postgres
 * transaction-scoped advisory lock. Two workers (on any number of replicas) can
 * therefore never both claim the same counterpart. Different currencies run in
 * parallel; finer partitioning is possible if one currency becomes a hotspot.
 */
@Injectable()
export class MatchingEngine {
  private readonly logger = new Logger(MatchingEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: MatchingConfigService,
    private readonly finder: CandidateFinder,
    private readonly exceptions: ExceptionWriter,
    private readonly decisions: DecisionHandlers,
    private readonly statuses: StatusRecalculator,
    private readonly queue: ReconciliationQueueService,
  ) {}

  async evaluate(transactionId: string, mode: EvaluationMode): Promise<void> {
    const head = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { currency: true },
    });
    if (!head) {
      return;
    }

    const freed = await this.prisma.$transaction(async (tx) => {
      await lockCurrencies(tx, [head.currency]);
      // Re-read under the lock: this is the state every decision is based on.
      const txn = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { source: true },
      });
      if (!txn) {
        return [];
      }
      const evaluation: Evaluation = {
        tx,
        rules: await this.config.load(tx),
        mode,
        now: new Date(),
        touched: new Set([txn.id]),
      };
      await this.decide(evaluation, txn);
      const unmatched = await this.statuses.recompute(tx, [...evaluation.touched]);
      return unmatched.filter((id) => id !== txn.id);
    }, MATCHING_TRANSACTION_OPTIONS);

    // Records released from a superseded candidate pairing deserve a fresh look.
    for (const id of freed) {
      await this.queue.enqueueMatch(id).catch((error: unknown) => {
        this.logger.error(
          { err: error, transactionId: id },
          'Failed to re-enqueue freed transaction.',
        );
      });
    }
  }

  private async decide(evaluation: Evaluation, txn: TransactionWithSource): Promise<void> {
    const { tx, rules, now, touched } = evaluation;

    if (txn.reference) {
      const [original, ...duplicates] = await this.finder.referenceGroup(tx, txn);
      if (original && duplicates.length > 0) {
        await this.exceptions.ensure(tx, duplicateSpec(original, duplicates), touched);
        if (txn.id !== original.id) {
          return; // A duplicate never matches; the original does.
        }
      }
    }

    const counterpart = await this.finder.counterpartOf(tx, txn, rules, now);
    if (counterpart.kind === 'none') {
      await this.decisions.decideOneSided(evaluation, txn);
      return;
    }
    await this.decisions.decidePair(evaluation, orient(txn, counterpart.other), counterpart);
  }
}
