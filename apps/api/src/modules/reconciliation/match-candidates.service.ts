import { Injectable, NotFoundException } from '@nestjs/common';
import type { MatchCandidateDto } from '@paritas/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toTransactionDto } from '../transactions/transactions.mapper.js';
import { MatchingConfigService } from './engine/matching-config.service.js';
import { MANUAL_CANDIDATE_SCAN_LIMIT, MAX_MANUAL_CANDIDATES } from './reconciliation.constants.js';
import { relaxForReview } from './rules/manual-review.js';
import { scoreCandidate } from './rules/scoring.js';
import { otherSide } from './rules/sides.js';

/**
 * Suggests records a person could manually match a transaction with: unmatched
 * records on the other side, in the same currency, ranked by the engine's own
 * scoring (with relaxed limits). A shared reference always ranks first.
 */
@Injectable()
export class MatchCandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: MatchingConfigService,
  ) {}

  async forTransaction(transactionId: string): Promise<MatchCandidateDto[]> {
    const subject = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { source: true },
    });
    if (!subject) {
      throw new NotFoundException(`Transaction ${transactionId} not found.`);
    }
    const rules = relaxForReview(await this.config.load(this.prisma));
    const windowMs = rules.timeWindowMinutes * 60_000;

    const candidates = await this.prisma.transaction.findMany({
      where: {
        id: { not: subject.id },
        source: { kind: otherSide(subject) },
        currency: subject.currency,
        matchId: null,
        OR: [
          ...(subject.reference ? [{ reference: subject.reference }] : []),
          {
            occurredAt: {
              gte: new Date(subject.occurredAt.getTime() - windowMs),
              lte: new Date(subject.occurredAt.getTime() + windowMs),
            },
          },
        ],
      },
      include: { source: true },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: MANUAL_CANDIDATE_SCAN_LIMIT,
    });

    return candidates
      .map((candidate) => ({
        transaction: toTransactionDto(candidate),
        referenceMatches: subject.reference !== null && candidate.reference === subject.reference,
        breakdown: scoreCandidate(subject, candidate, rules),
      }))
      .filter((candidate) => candidate.referenceMatches || candidate.breakdown !== null)
      .sort(
        (a, b) =>
          Number(b.referenceMatches) - Number(a.referenceMatches) ||
          (b.breakdown?.score ?? 0) - (a.breakdown?.score ?? 0),
      )
      .slice(0, MAX_MANUAL_CANDIDATES);
  }
}
