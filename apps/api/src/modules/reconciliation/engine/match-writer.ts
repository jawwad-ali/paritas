import { Injectable } from '@nestjs/common';
import type { MatchMethod, Prisma } from '../../../generated/prisma/client.js';
import type { Pair, ScoreBreakdown } from '../reconciliation.types.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class MatchWriter {
  /** Links the pair under one match. No-op when they are already matched together. */
  async ensure(
    tx: Tx,
    { gateway, ledger }: Pair,
    method: MatchMethod,
    confidence: number,
    breakdown: ScoreBreakdown | null,
  ): Promise<void> {
    if (gateway.matchId && gateway.matchId === ledger.matchId) {
      return;
    }
    if (gateway.matchId || ledger.matchId) {
      // The candidate rules exclude matched records, so this is a logic error; fail
      // loudly (the job retries) rather than silently re-pairing a payment.
      throw new Error(
        `Refusing to re-match ${gateway.id} / ${ledger.id}: one side is already matched.`,
      );
    }
    await tx.match.create({
      data: {
        method,
        confidence,
        scoreBreakdown: breakdown ? { ...breakdown } : undefined,
        transactions: { connect: [{ id: gateway.id }, { id: ledger.id }] },
      },
    });
  }
}
