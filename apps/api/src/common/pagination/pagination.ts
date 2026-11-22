import type { Paginated, PaginationQuery } from '@paritas/shared';

export interface SkipTake {
  skip: number;
  take: number;
}

export const toSkipTake = ({ page, pageSize }: PaginationQuery): SkipTake => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const toPaginated = <T>(
  data: T[],
  totalItems: number,
  { page, pageSize }: PaginationQuery,
): Paginated<T> => ({
  data,
  meta: {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  },
});
