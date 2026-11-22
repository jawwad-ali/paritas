import { Injectable } from '@nestjs/common';
import {
  ExceptionStatus,
  ExceptionTransactionRole,
  MatchStatus,
  type Prisma,
  ReconciliationStatus,
} from '../../../generated/prisma/client.js';

type Tx = Prisma.TransactionClient;

/**
 * A transaction's reconciliation status is *derived*, never set ad hoc:
 *   open exception where it is the subject → EXCEPTION
 *   otherwise an active match              → MATCHED
 *   otherwise previously EXCLUDED          → EXCLUDED
 *   otherwise                              → UNMATCHED
 * One rule, applied after every decision, keeps statuses consistent.
 */
@Injectable()
export class StatusRecalculator {
  /** @returns ids that became UNMATCHED (freed records worth re-evaluating). */
  async recompute(tx: Tx, transactionIds: string[]): Promise<string[]> {
    const rows = await tx.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: {
        id: true,
        reconciliationStatus: true,
        match: { select: { status: true } },
        exceptions: {
          where: {
            role: ExceptionTransactionRole.SUBJECT,
            exception: { status: { in: [ExceptionStatus.OPEN, ExceptionStatus.INVESTIGATING] } },
          },
          select: { exceptionId: true },
          take: 1,
        },
      },
    });

    const freed: string[] = [];
    for (const row of rows) {
      const next = this.derive(
        row.reconciliationStatus,
        row.exceptions.length > 0,
        row.match?.status,
      );
      if (next === row.reconciliationStatus) {
        continue;
      }
      await tx.transaction.update({ where: { id: row.id }, data: { reconciliationStatus: next } });
      if (next === ReconciliationStatus.UNMATCHED) {
        freed.push(row.id);
      }
    }
    return freed;
  }

  private derive(
    current: ReconciliationStatus,
    hasOpenException: boolean,
    matchStatus: MatchStatus | undefined,
  ): ReconciliationStatus {
    if (hasOpenException) {
      return ReconciliationStatus.EXCEPTION;
    }
    if (matchStatus === MatchStatus.ACTIVE) {
      return ReconciliationStatus.MATCHED;
    }
    return current === ReconciliationStatus.EXCLUDED
      ? ReconciliationStatus.EXCLUDED
      : ReconciliationStatus.UNMATCHED;
  }
}
