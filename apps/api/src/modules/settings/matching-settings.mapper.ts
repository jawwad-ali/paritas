import type { MatchingConfigDto } from '@paritas/shared';
import type { MatchingConfig, User } from '../../generated/prisma/client.js';
import { toUserSummaryDto } from '../users/users.mapper.js';

export const toMatchingConfigDto = (
  config: MatchingConfig & { updatedBy: Pick<User, 'id' | 'name' | 'email'> | null },
): MatchingConfigDto => ({
  amountToleranceMinor: config.amountToleranceMinor,
  amountToleranceBps: config.amountToleranceBps,
  timeWindowMinutes: config.timeWindowMinutes,
  autoMatchThreshold: config.autoMatchThreshold,
  candidateThreshold: config.candidateThreshold,
  missingAfterMinutes: config.missingAfterMinutes,
  updatedBy: config.updatedBy ? toUserSummaryDto(config.updatedBy) : null,
  updatedAt: config.updatedAt.toISOString(),
});
