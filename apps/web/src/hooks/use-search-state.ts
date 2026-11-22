'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toSearchString } from '@/lib/url/search-params';

/**
 * Filters, search and paging live in the URL: shareable, bookmarkable, and
 * the browser's back button restores them. Changing any filter returns to page 1.
 */
export const useSearchState = <T extends { page?: number }>(
  parse: (params: URLSearchParams) => T,
): [T, (patch: Partial<T>) => void] => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(
    () => parse(new URLSearchParams(searchParams.toString())),
    [parse, searchParams],
  );

  const update = useCallback(
    (patch: Partial<T>) => {
      const next = { ...state, ...patch, ...('page' in patch ? {} : { page: 1 }) };
      router.replace(`${pathname}${toSearchString(next)}`, { scroll: false });
    },
    [state, router, pathname],
  );

  return [state, update];
};
