import { formatMoney } from '@paritas/shared';
import {
  ExceptionSeverity,
  ExceptionType,
  SourceKind,
  TransactionStatus,
} from '../../../generated/prisma/client.js';
import { toSafeNumber } from '../../transactions/transactions.mapper.js';
import type {
  ExceptionSpec,
  Pair,
  ScoreBreakdown,
  TransactionWithSource,
} from '../reconciliation.types.js';
import { amountMismatchSeverity, escalateForValue } from './severity.js';

/** Builders for every exception the engine can raise: type, severity, title, facts. */

const money = (txn: TransactionWithSource): string =>
  formatMoney(toSafeNumber(txn.amountMinor), txn.currency);

const label = (txn: TransactionWithSource): string => txn.reference ?? txn.externalId;

const snapshot = (txn: TransactionWithSource) => ({
  transactionId: txn.id,
  source: txn.source.code,
  externalId: txn.externalId,
  reference: txn.reference,
  amountMinor: toSafeNumber(txn.amountMinor),
  currency: txn.currency,
  status: txn.status,
  occurredAt: txn.occurredAt.toISOString(),
  customerRef: txn.customerRef,
});

const pairKey = ({ gateway, ledger }: Pair): string => `${gateway.id}:${ledger.id}`;

export const missingSpec = (txn: TransactionWithSource, graceMinutes: number): ExceptionSpec => {
  const fromGateway = txn.source.kind === SourceKind.PAYMENT_GATEWAY;
  // Money received but not booked is serious; revenue booked that never arrived is worse.
  const base = fromGateway ? ExceptionSeverity.HIGH : ExceptionSeverity.CRITICAL;
  return {
    type: ExceptionType.MISSING,
    severity: escalateForValue(base, txn.amountMinor),
    title: fromGateway
      ? `${txn.source.name} payment ${label(txn)} (${money(txn)}) is missing from the internal ledger`
      : `Ledger entry ${txn.externalId} (${money(txn)}) has no matching gateway payment`,
    dedupeKey: `MISSING:${txn.id}`,
    details: {
      missingFrom: fromGateway ? 'internal_ledger' : 'payment_gateway',
      graceMinutes,
      transaction: snapshot(txn),
    },
    subjectIds: [txn.id],
    contextIds: [],
  };
};

export const delayedSpec = (
  transactions: TransactionWithSource[],
  graceMinutes: number,
): ExceptionSpec => {
  const [first] = transactions;
  if (!first) {
    throw new Error('delayedSpec needs at least one transaction.');
  }
  return {
    type: ExceptionType.DELAYED,
    severity: escalateForValue(ExceptionSeverity.MEDIUM, first.amountMinor),
    title: `Payment ${label(first)} (${money(first)}) still pending after ${graceMinutes} minutes`,
    dedupeKey: `DELAYED:${transactions
      .map((txn) => txn.id)
      .sort()
      .join(':')}`,
    details: { graceMinutes, transactions: transactions.map(snapshot) },
    subjectIds: transactions.map((txn) => txn.id),
    contextIds: [],
  };
};

export const duplicateSpec = (
  original: TransactionWithSource,
  duplicates: TransactionWithSource[],
): ExceptionSpec => ({
  type: ExceptionType.DUPLICATE,
  severity: escalateForValue(ExceptionSeverity.HIGH, original.amountMinor),
  title: `${original.source.name} recorded payment ${label(original)} ${duplicates.length + 1} times`,
  dedupeKey: `DUPLICATE:${original.sourceId}:${original.reference ?? original.externalId}`,
  details: { original: snapshot(original), duplicates: duplicates.map(snapshot) },
  subjectIds: duplicates.map((txn) => txn.id),
  contextIds: [original.id],
});

export const statusConflictSpec = (pair: Pair): ExceptionSpec => {
  const { gateway, ledger } = pair;
  // Booked as paid while the payment failed: revenue that does not exist.
  const bookedButFailed =
    ledger.status === TransactionStatus.SUCCEEDED && gateway.status === TransactionStatus.FAILED;
  return {
    type: ExceptionType.STATUS_CONFLICT,
    severity: bookedButFailed
      ? ExceptionSeverity.CRITICAL
      : escalateForValue(ExceptionSeverity.HIGH, gateway.amountMinor),
    title: `Status conflict on ${label(gateway)}: ${gateway.source.name} ${gateway.status}, ledger ${ledger.status}`,
    dedupeKey: `STATUS_CONFLICT:${pairKey(pair)}`,
    details: { gateway: snapshot(gateway), ledger: snapshot(ledger) },
    subjectIds: [gateway.id, ledger.id],
    contextIds: [],
  };
};

export const amountMismatchSpec = (pair: Pair, differenceMinor: bigint): ExceptionSpec => {
  const { gateway, ledger } = pair;
  return {
    type: ExceptionType.AMOUNT_MISMATCH,
    severity: escalateForValue(
      amountMismatchSeverity(differenceMinor, gateway.amountMinor),
      gateway.amountMinor,
    ),
    title: `Amount mismatch on ${label(gateway)}: ${gateway.source.name} ${money(gateway)}, ledger ${money(ledger)}`,
    dedupeKey: `AMOUNT_MISMATCH:${pairKey(pair)}`,
    details: {
      differenceMinor: toSafeNumber(differenceMinor),
      gateway: snapshot(gateway),
      ledger: snapshot(ledger),
    },
    subjectIds: [gateway.id, ledger.id],
    contextIds: [],
  };
};

export const currencyMismatchSpec = (pair: Pair): ExceptionSpec => ({
  type: ExceptionType.OTHER,
  severity: ExceptionSeverity.HIGH,
  title: `Currency mismatch on ${label(pair.gateway)}: ${pair.gateway.currency} vs ${pair.ledger.currency}`,
  dedupeKey: `CURRENCY_MISMATCH:${pairKey(pair)}`,
  details: { gateway: snapshot(pair.gateway), ledger: snapshot(pair.ledger) },
  subjectIds: [pair.gateway.id, pair.ledger.id],
  contextIds: [],
});

export const lowConfidenceSpec = (
  pair: Pair,
  breakdown: ScoreBreakdown,
  ambiguous: boolean,
): ExceptionSpec => ({
  type: ExceptionType.LOW_CONFIDENCE_MATCH,
  severity: ExceptionSeverity.LOW,
  title: `Probable match needs review: ${label(pair.gateway)} ↔ ${pair.ledger.externalId} (score ${breakdown.score.toFixed(2)})`,
  dedupeKey: `LOW_CONFIDENCE_MATCH:${pairKey(pair)}`,
  details: {
    breakdown: { ...breakdown },
    ambiguous,
    gateway: snapshot(pair.gateway),
    ledger: snapshot(pair.ledger),
  },
  subjectIds: [pair.gateway.id, pair.ledger.id],
  contextIds: [],
});
