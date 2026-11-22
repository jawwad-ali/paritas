import type * as Shared from '@paritas/shared';
import type * as Db from '../../generated/prisma/client.js';

/**
 * Compile-time guard: every enum in the shared API contract must equal its
 * database enum. Adding a value to one side only breaks the build here, rather
 * than surfacing as a runtime surprise in the web app.
 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const ENUMS_IN_SYNC: {
  userRole: Exact<Shared.UserRole, Db.UserRole>;
  transactionStatus: Exact<Shared.TransactionStatus, Db.TransactionStatus>;
  reconciliationStatus: Exact<Shared.ReconciliationStatus, Db.ReconciliationStatus>;
  sourceKind: Exact<Shared.SourceKind, Db.SourceKind>;
  rawEventStatus: Exact<Shared.RawEventStatus, Db.RawEventStatus>;
  exceptionType: Exact<Shared.ExceptionType, Db.ExceptionType>;
  exceptionSeverity: Exact<Shared.ExceptionSeverity, Db.ExceptionSeverity>;
  exceptionStatus: Exact<Shared.ExceptionStatus, Db.ExceptionStatus>;
  matchMethod: Exact<Shared.MatchMethod, Db.MatchMethod>;
  matchStatus: Exact<Shared.MatchStatus, Db.MatchStatus>;
  exceptionActivityType: Exact<Shared.ExceptionActivityType, Db.ExceptionActivityType>;
  exceptionTransactionRole: Exact<Shared.ExceptionTransactionRole, Db.ExceptionTransactionRole>;
} = {
  userRole: true,
  transactionStatus: true,
  reconciliationStatus: true,
  sourceKind: true,
  rawEventStatus: true,
  exceptionType: true,
  exceptionSeverity: true,
  exceptionStatus: true,
  matchMethod: true,
  matchStatus: true,
  exceptionActivityType: true,
  exceptionTransactionRole: true,
};
