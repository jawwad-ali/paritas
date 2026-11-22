import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { MatchingConfigDto, UpdateMatchingConfigRequest } from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { USER_SUMMARY_SELECT } from '../users/users.mapper.js';
import { toMatchingConfigDto } from './matching-settings.mapper.js';

const SINGLETON_ID = 1;
const INCLUDE = { updatedBy: { select: USER_SUMMARY_SELECT } } as const;

type RuleName = keyof UpdateMatchingConfigRequest;

/**
 * The matching rules, editable without a deploy. The engine reads them on every
 * evaluation, so a change applies to the next decision; existing matches and
 * closed exceptions are not rewritten.
 */
@Injectable()
export class MatchingSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(): Promise<MatchingConfigDto> {
    const config = await this.prisma.matchingConfig.findUnique({
      where: { id: SINGLETON_ID },
      include: INCLUDE,
    });
    if (!config) {
      throw new Error('Matching configuration is missing. Run the database seed.');
    }
    return toMatchingConfigDto(config);
  }

  async update(
    request: UpdateMatchingConfigRequest,
    actor: RequestActor,
  ): Promise<MatchingConfigDto> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.matchingConfig.findUniqueOrThrow({ where: { id: SINGLETON_ID } });
      const next = { ...current, ...request };
      if (next.candidateThreshold > next.autoMatchThreshold) {
        throw new UnprocessableEntityException(
          `The candidate threshold (${next.candidateThreshold}) cannot be above the auto-match threshold (${next.autoMatchThreshold}).`,
        );
      }

      const changed = (Object.keys(request) as RuleName[]).filter(
        (rule) => request[rule] !== undefined && request[rule] !== current[rule],
      );
      if (changed.length === 0) {
        return;
      }
      await tx.matchingConfig.update({
        where: { id: SINGLETON_ID },
        data: { ...request, updatedById: actor.id },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.MATCHING_CONFIG_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.MATCHING_CONFIG,
          entityId: String(SINGLETON_ID),
          changes: {
            before: Object.fromEntries(changed.map((rule) => [rule, current[rule]])),
            after: Object.fromEntries(changed.map((rule) => [rule, next[rule]])),
          },
        },
        tx,
      );
    });
    return this.get();
  }
}
