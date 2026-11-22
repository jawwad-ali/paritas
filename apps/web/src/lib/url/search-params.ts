/** Typed readers for URL search params: anything unexpected falls back, it never throws. */

export const readEnum = <T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined => {
  const value = params.get(key);
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
};

export const readEnumList = <T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] | undefined => {
  const values = (params.get(key) ?? '')
    .split(',')
    .filter((value): value is T => (allowed as readonly string[]).includes(value));
  return values.length > 0 ? values : undefined;
};

export const readString = (params: URLSearchParams, key: string): string | undefined =>
  params.get(key)?.trim() || undefined;

export const readPage = (params: URLSearchParams): number => {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

/** Drops empty values so the URL only carries what is actually filtered. */
export const toSearchString = (values: object): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else if ((typeof value === 'string' && value !== '') || typeof value === 'number') {
      if (!(key === 'page' && value === 1)) {
        params.set(key, String(value));
      }
    }
  }
  const search = params.toString();
  return search ? `?${search}` : '';
};
