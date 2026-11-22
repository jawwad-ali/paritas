import {
  ASSIGNEE_FILTER_ME,
  ASSIGNEE_FILTER_UNASSIGNED,
  type ExceptionSort,
  type ListExceptionsQuery,
} from '@paritas/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { EXCEPTION_NUMBER_PATTERN } from './exceptions.constants.js';

type ExceptionWhere = Prisma.ReconciliationExceptionWhereInput;

/** The list's filters, reusable by reports; `createdAt` replaces the list's from/to. */
export interface ExceptionFilters extends Pick<
  ListExceptionsQuery,
  'status' | 'type' | 'severity' | 'assignee' | 'source' | 'search'
> {
  createdAt?: Prisma.DateTimeFilter;
}

const assigneeFilter = (
  assignee: ListExceptionsQuery['assignee'],
  actor: RequestActor,
): string | null | undefined => {
  if (assignee === ASSIGNEE_FILTER_ME) {
    return actor.id;
  }
  if (assignee === ASSIGNEE_FILTER_UNASSIGNED) {
    return null;
  }
  return assignee;
};

const parseExceptionNumber = (search: string): number | null => {
  const digits = EXCEPTION_NUMBER_PATTERN.exec(search)?.[1];
  return digits === undefined ? null : Number(digits);
};

const searchFilter = (search: string): ExceptionWhere => {
  const number = parseExceptionNumber(search);
  const text = { contains: search, mode: 'insensitive' } as const;
  return {
    OR: [
      ...(number === null ? [] : [{ number }]),
      { title: text },
      {
        transactions: {
          some: {
            transaction: {
              OR: [{ reference: text }, { externalId: text }, { customerRef: text }],
            },
          },
        },
      },
    ],
  };
};

export const buildExceptionWhere = (
  query: ExceptionFilters,
  actor: RequestActor,
): ExceptionWhere => ({
  status: query.status ? { in: query.status } : undefined,
  type: query.type ? { in: query.type } : undefined,
  severity: query.severity ? { in: query.severity } : undefined,
  assigneeId: assigneeFilter(query.assignee, actor),
  createdAt: query.createdAt,
  AND: [
    query.source
      ? { transactions: { some: { transaction: { source: { code: query.source } } } } }
      : {},
    query.search ? searchFilter(query.search) : {},
  ],
});

/** Severity is a Postgres enum, ordered LOW → CRITICAL, so `desc` puts CRITICAL first. */
export const EXCEPTION_ORDER_BY: Record<
  ExceptionSort,
  Prisma.ReconciliationExceptionOrderByWithRelationInput[]
> = {
  priority: [{ severity: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  oldest: [{ createdAt: 'asc' }, { id: 'asc' }],
};
