import { Injectable } from '@nestjs/common';
import {
  ExceptionActivityType,
  ExceptionStatus,
  ExceptionTransactionRole,
  type Prisma,
} from '../../../generated/prisma/client.js';
import { AUTO_RESOLUTION_REASON, AUTO_RESOLVABLE_TYPES } from '../reconciliation.constants.js';
import type { ExceptionSpec } from '../reconciliation.types.js';

type Tx = Prisma.TransactionClient;

const OPEN_STATUSES = [ExceptionStatus.OPEN, ExceptionStatus.INVESTIGATING];
const DETECTED_MESSAGE = 'Detected by the matching engine.';

/**
 * Opens and auto-closes exceptions. Idempotent by `dedupeKey`: re-evaluating the
 * same problem never opens a second exception, and an exception a person closed
 * is never reopened by the engine (their decision stands).
 */
@Injectable()
export class ExceptionWriter {
  async ensure(tx: Tx, spec: ExceptionSpec, touched: Set<string>): Promise<void> {
    const links = [
      ...spec.subjectIds.map((transactionId) => ({
        transactionId,
        role: ExceptionTransactionRole.SUBJECT,
      })),
      ...spec.contextIds.map((transactionId) => ({
        transactionId,
        role: ExceptionTransactionRole.CONTEXT,
      })),
    ];
    [...spec.subjectIds, ...spec.contextIds].forEach((id) => touched.add(id));

    const existing = await tx.reconciliationException.findUnique({
      where: { dedupeKey: spec.dedupeKey },
      select: { id: true },
    });
    if (existing) {
      // The problem may have grown (e.g. a third duplicate): link any new records.
      await tx.exceptionTransaction.createMany({
        data: links.map((link) => ({ ...link, exceptionId: existing.id })),
        skipDuplicates: true,
      });
      return;
    }

    await tx.reconciliationException.create({
      data: {
        type: spec.type,
        severity: spec.severity,
        title: spec.title,
        details: spec.details,
        dedupeKey: spec.dedupeKey,
        transactions: { createMany: { data: links } },
        activities: {
          create: {
            type: ExceptionActivityType.CREATED,
            message: DETECTED_MESSAGE,
            data: { dedupeKey: spec.dedupeKey },
          },
        },
      },
    });
  }

  /** Closes open, auto-resolvable exceptions on these transactions now that the records agree. */
  async autoResolve(tx: Tx, transactionIds: string[], touched: Set<string>): Promise<void> {
    const open = await tx.reconciliationException.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        type: { in: [...AUTO_RESOLVABLE_TYPES] },
        transactions: { some: { transactionId: { in: transactionIds } } },
      },
      select: { id: true, status: true, transactions: { select: { transactionId: true } } },
    });

    const now = new Date();
    for (const exception of open) {
      await tx.reconciliationException.update({
        where: { id: exception.id },
        data: {
          status: ExceptionStatus.RESOLVED,
          resolvedAt: now,
          resolutionReason: AUTO_RESOLUTION_REASON,
          activities: {
            create: {
              type: ExceptionActivityType.STATUS_CHANGED,
              message: AUTO_RESOLUTION_REASON,
              data: { from: exception.status, to: ExceptionStatus.RESOLVED },
            },
          },
        },
      });
      exception.transactions.forEach(({ transactionId }) => touched.add(transactionId));
    }
  }
}
