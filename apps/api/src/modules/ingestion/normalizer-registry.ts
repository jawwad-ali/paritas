import { Injectable } from '@nestjs/common';
import type { SourceCode } from '@paritas/shared';
import type { SourceNormalizer } from './ingestion.types.js';
import { LedgerNormalizer } from './ledger/ledger.normalizer.js';
import { StripeNormalizer } from './stripe/stripe.normalizer.js';

/** Adding a source = one normaliser + one webhook controller + one line here. */
@Injectable()
export class NormalizerRegistry {
  private readonly bySource: ReadonlyMap<SourceCode, SourceNormalizer>;

  constructor(stripe: StripeNormalizer, ledger: LedgerNormalizer) {
    this.bySource = new Map<SourceCode, SourceNormalizer>(
      [stripe, ledger].map((normalizer) => [normalizer.sourceCode, normalizer]),
    );
  }

  get(sourceCode: SourceCode): SourceNormalizer {
    const normalizer = this.bySource.get(sourceCode);
    if (!normalizer) {
      throw new Error(`No normaliser registered for source "${sourceCode}".`);
    }
    return normalizer;
  }
}
