import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ExceptionTransactionRole,
  ExceptionType,
  type Prisma,
  ReconciliationStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { lockCurrencies } from '../reconciliation/engine/currency-lock.js';
import { MatchingEngine } from '../reconciliation/engine/matching-engine.service.js';
import { StatusRecalculator } from '../reconciliation/engine/status-recalculator.js';
import { ReconciliationQueueService } from '../reconciliation/reconciliation-queue.service.js';
import { MATCHING_TRANSACTION_OPTIONS } from '../reconciliation/reconciliation.constants.js';
import type { LockedException } from './exceptions.types.js';

type Tx = Prisma.TransactionClient;

export const subjectIdsOf = (exception: LockedException): string[] =>
  exception.transactions
    .filter((link) => link.role === ExceptionTransactionRole.SUBJECT)
    .map((link) => link.transactionId);

/**
 * What a person's decision on an exception means for its transactions, and the
 * concurrency rules around it. Human decisions take the same per-currency locks
 * as the matching engine, so a person and the engine never decide on the same
 * records at the same time.
 */
@Injectable()
export class ExceptionLifecycle {
  private readonly logger = new Logger(ExceptionLifecycle.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statuses: StatusRecalculator,
    private readonly engine: MatchingEngine,
    private readonly queue: ReconciliationQueueService,
  ) {}

  /** Runs `work` in one DB transaction, holding the exception's currency locks, on a fresh read. */
  async withLockedException<T>(
    id: string,
    work: (tx: Tx, exception: LockedException) => Promise<T>,
  ): Promise<T> {
    const head = await this.prisma.reconciliationException.findUnique({
      where: { id },
      select: { transactions: { select: { transaction: { select: { currency: true } } } } },
    });
    if (!head) {
      throw new NotFoundException(`Exception ${id} not found.`);
    }
    return this.prisma.$transaction(async (tx) => {
      await lockCurrencies(
        tx,
        head.transactions.map((link) => link.transaction.currency),
      );
      const exception = await tx.reconciliationException.findUnique({
        where: { id },
        include: { transactions: { select: { transactionId: true, role: true } } },
      });
      if (!exception) {
        throw new NotFoundException(`Exception ${id} not found.`);
      }
      return work(tx, exception);
    }, MATCHING_TRANSACTION_OPTIONS);
  }

  /**
   * A person closed the exception without matching. Its unmatched subjects:
   *  - LOW_CONFIDENCE_MATCH: the suggestion was rejected. Back to UNMATCHED; the
   *    engine never proposes that pair again and carries on (another match, or MISSING).
   *  - any other type: the person accounted for it. EXCLUDED, so the engine stops
   *    chasing it, yet a genuine counterpart arriving later still matches.
   * @returns ids that became UNMATCHED and need re-evaluation (see `release`).
   */
  async applyClosure(
    tx: Tx,
    exception: LockedException,
    extraIds: string[] = [],
  ): Promise<string[]> {
    const subjectIds = subjectIdsOf(exception);
    if (exception.type !== ExceptionType.LOW_CONFIDENCE_MATCH) {
      await tx.transaction.updateMany({
        where: { id: { in: subjectIds }, matchId: null },
        data: { reconciliationStatus: ReconciliationStatus.EXCLUDED },
      });
    }
    return this.statuses.recompute(tx, [...new Set([...subjectIds, ...extraIds])]);
  }

  /** Reopened: its subjects are held in EXCEPTION again. */
  async applyReopen(tx: Tx, exception: LockedException): Promise<void> {
    await this.statuses.recompute(tx, subjectIdsOf(exception));
  }

  /**
   * After commit: let the engine look at records a decision changed. Synchronous
   * for the records the person is looking at; on failure the queue retries.
   */
  async reevaluate(transactionIds: string[]): Promise<void> {
    for (const id of transactionIds) {
      await this.engine.evaluate(id, 'event').catch(async (error: unknown) => {
        this.logger.warn({ err: error, transactionId: id }, 'Re-evaluation failed; queued.');
        await this.release([id]);
      });
    }
  }

  /** After commit: queue freed records for the engine. Best effort; the sweep is the backstop. */
  async release(transactionIds: string[]): Promise<void> {
    for (const id of transactionIds) {
      await this.queue.enqueueMatch(id).catch((error: unknown) => {
        this.logger.error(
          { err: error, transactionId: id },
          'Failed to enqueue freed transaction.',
        );
      });
    }
  }
}
