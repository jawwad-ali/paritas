import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { MatchingRules } from '../reconciliation.types.js';

const SINGLETON_ID = 1;

/** Reads the live matching rules. Read per evaluation, so edits apply without a restart. */
@Injectable()
export class MatchingConfigService {
  async load(tx: Pick<Prisma.TransactionClient, 'matchingConfig'>): Promise<MatchingRules> {
    const config = await tx.matchingConfig.findUnique({ where: { id: SINGLETON_ID } });
    if (!config) {
      throw new Error('Matching configuration is missing. Run the database seed.');
    }
    return config;
  }
}
