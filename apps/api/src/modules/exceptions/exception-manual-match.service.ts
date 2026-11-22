import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { ExceptionDetailDto, ManualMatchRequest } from '@paritas/shared';
import {
  ExceptionActivityType,
  ExceptionStatus,
  MatchMethod,
  type Prisma,
  SourceKind,
} from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { MatchingConfigService } from '../reconciliation/engine/matching-config.service.js';
import type { Pair, TransactionWithSource } from '../reconciliation/reconciliation.types.js';
import { relaxForReview } from '../reconciliation/rules/manual-review.js';
import { scoreCandidate } from '../reconciliation/rules/scoring.js';
import { CONCURRENT_CHANGE_MESSAGE, TRANSITIONS } from './exceptions.constants.js';
import { assertTransitionAllowed } from './exceptions.policy.js';
import type { LockedException } from './exceptions.types.js';
import { appendActivities } from './exception-activities.js';
import { ExceptionLifecycle, subjectIdsOf } from './exception-lifecycle.service.js';
import { ExceptionsQueryService } from './exceptions-query.service.js';

type Tx = Prisma.TransactionClient;

/** A manual match is always certain: a person vouched for it. */
const MANUAL_MATCH_CONFIDENCE = 1;

/**
 * Links a gateway record and a ledger record as the same payment, on a person's
 * word, and closes the exception. A manual match asserts *identity*, not
 * agreement: the engine re-checks the pair right after, and any real difference
 * (amount, status) still surfaces as its own exception.
 */
@Injectable()
export class ExceptionManualMatchService {
  constructor(
    private readonly audit: AuditService,
    private readonly config: MatchingConfigService,
    private readonly lifecycle: ExceptionLifecycle,
    private readonly query: ExceptionsQueryService,
  ) {}

  async match(
    id: string,
    request: ManualMatchRequest,
    actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    const transition = TRANSITIONS.match;
    const { pairIds, freed } = await this.lifecycle.withLockedException(
      id,
      async (tx, exception) => {
        assertTransitionAllowed(exception.status, transition);
        const pair = await this.loadPair(tx, request, exception);

        const rules = relaxForReview(await this.config.load(tx));
        const breakdown = scoreCandidate(pair.gateway, pair.ledger, rules);
        const match = await tx.match.create({
          data: {
            method: MatchMethod.MANUAL,
            confidence: MANUAL_MATCH_CONFIDENCE,
            scoreBreakdown: breakdown ? { ...breakdown } : undefined,
            note: request.reason,
            createdById: actor.id,
            transactions: { connect: [{ id: pair.gateway.id }, { id: pair.ledger.id }] },
          },
        });

        const { count } = await tx.reconciliationException.updateMany({
          where: { id, status: exception.status },
          data: {
            status: transition.to,
            resolvedAt: new Date(),
            resolvedById: actor.id,
            resolutionReason: request.reason,
          },
        });
        if (count === 0) {
          throw new ConflictException(CONCURRENT_CHANGE_MESSAGE);
        }
        const facts = {
          matchId: match.id,
          gatewayTransactionId: pair.gateway.id,
          ledgerTransactionId: pair.ledger.id,
        };
        await appendActivities(tx, [
          {
            exceptionId: id,
            actorId: actor.id,
            type: ExceptionActivityType.MANUALLY_MATCHED,
            message: request.reason,
            data: { ...facts, breakdown: breakdown ? { ...breakdown } : null },
          },
          {
            exceptionId: id,
            actorId: actor.id,
            type: ExceptionActivityType.STATUS_CHANGED,
            message: request.reason,
            data: { from: exception.status, to: ExceptionStatus.RESOLVED },
          },
        ]);
        await this.audit.record(
          {
            action: transition.audit,
            entityType: AUDIT_ENTITY_TYPES.EXCEPTION,
            entityId: id,
            changes: {
              before: { status: exception.status },
              after: { status: transition.to, ...facts },
            },
            details: { reason: request.reason },
          },
          tx,
        );

        const pairIds = [pair.gateway.id, pair.ledger.id];
        return { pairIds, freed: await this.lifecycle.applyClosure(tx, exception, pairIds) };
      },
    );

    // The engine re-validates the new pair and clears what it settles (e.g. the
    // counterpart's own MISSING exception), before the person sees the result.
    await this.lifecycle.reevaluate(pairIds);
    await this.lifecycle.release(freed.filter((freedId) => !pairIds.includes(freedId)));
    return this.query.getById(id);
  }

  /** Validates the two records against each other and against the exception. */
  private async loadPair(
    tx: Tx,
    request: ManualMatchRequest,
    exception: LockedException,
  ): Promise<Pair> {
    const gateway = await this.loadTransaction(tx, request.gatewayTransactionId);
    const ledger = await this.loadTransaction(tx, request.ledgerTransactionId);

    if (gateway.source.kind !== SourceKind.PAYMENT_GATEWAY) {
      throw new UnprocessableEntityException('`gatewayTransactionId` must be a gateway record.');
    }
    if (ledger.source.kind !== SourceKind.INTERNAL_LEDGER) {
      throw new UnprocessableEntityException('`ledgerTransactionId` must be a ledger record.');
    }
    if (gateway.currency !== ledger.currency) {
      throw new UnprocessableEntityException(
        `Records in different currencies (${gateway.currency} vs ${ledger.currency}) cannot be matched.`,
      );
    }
    const subjects = subjectIdsOf(exception);
    if (!subjects.includes(gateway.id) && !subjects.includes(ledger.id)) {
      throw new UnprocessableEntityException(
        'At least one of the two records must be a subject of this exception.',
      );
    }
    if (gateway.matchId || ledger.matchId) {
      throw new ConflictException(
        gateway.matchId && gateway.matchId === ledger.matchId
          ? 'These records are already matched together.'
          : 'One of the records is already matched to another record.',
      );
    }
    return { gateway, ledger };
  }

  private async loadTransaction(tx: Tx, id: string): Promise<TransactionWithSource> {
    const transaction = await tx.transaction.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!transaction) {
      throw new UnprocessableEntityException(`Transaction ${id} not found.`);
    }
    return transaction;
  }
}
