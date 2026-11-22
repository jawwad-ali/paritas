import { SourceKind } from '../../../generated/prisma/client.js';
import type { Pair, TransactionWithSource } from '../reconciliation.types.js';

/** The kind of source a transaction's counterpart comes from. */
export const otherSide = (txn: TransactionWithSource): SourceKind =>
  txn.source.kind === SourceKind.PAYMENT_GATEWAY
    ? SourceKind.INTERNAL_LEDGER
    : SourceKind.PAYMENT_GATEWAY;

/** Orders two records of one payment as gateway vs ledger. */
export const orient = (a: TransactionWithSource, b: TransactionWithSource): Pair =>
  a.source.kind === SourceKind.PAYMENT_GATEWAY
    ? { gateway: a, ledger: b }
    : { gateway: b, ledger: a };
