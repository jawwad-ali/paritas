import type { SourceCode, SourceDto, SourceSummaryDto } from '@paritas/shared';
import { SOURCE_CODES } from '@paritas/shared';
import type { Source } from '../../generated/prisma/client.js';

const KNOWN_SOURCE_CODES: readonly string[] = Object.values(SOURCE_CODES);

export const isSourceCode = (code: string): code is SourceCode => KNOWN_SOURCE_CODES.includes(code);

const toSourceCode = (code: string): SourceCode => {
  if (!isSourceCode(code)) {
    // Sources are seeded by the app; an unknown code means the DB and code disagree.
    throw new Error(`Unknown source code "${code}" in database.`);
  }
  return code;
};

export const toSourceSummaryDto = (
  source: Pick<Source, 'id' | 'code' | 'name' | 'kind'>,
): SourceSummaryDto => ({
  id: source.id,
  code: toSourceCode(source.code),
  name: source.name,
  kind: source.kind,
});

export interface SourceStats {
  transactionCount: number;
  lastEventReceivedAt: Date | null;
}

export const toSourceDto = (source: Source, stats: SourceStats): SourceDto => ({
  ...toSourceSummaryDto(source),
  isActive: source.isActive,
  transactionCount: stats.transactionCount,
  lastEventReceivedAt: stats.lastEventReceivedAt?.toISOString() ?? null,
  createdAt: source.createdAt.toISOString(),
});
