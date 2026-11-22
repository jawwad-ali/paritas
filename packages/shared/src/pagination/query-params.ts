import { z } from 'zod';

/** Query strings are text: accept exactly "true"/"false" (z.coerce.boolean would read "false" as true). */
export const booleanQueryParam = z.enum(['true', 'false']).transform((value) => value === 'true');

/** ISO-8601 date or date-time in a query string, parsed to a Date. */
export const dateQueryParam = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((value) => new Date(value));

/**
 * A comma-separated list of enum values, e.g. `?status=OPEN,INVESTIGATING`.
 * Duplicates are removed; an unknown value is a validation error.
 */
export const csvEnumParam = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((raw) => [...new Set(raw.split(',').map((part) => part.trim()))])
    .pipe(z.array(z.enum(values)).min(1));

export const DEFAULT_TIME_ZONE = 'UTC';

const isTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** IANA time zone (e.g. `America/New_York`) that days are counted in. Defaults to UTC. */
export const timeZoneParam = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(isTimeZone, 'Unknown time zone; use an IANA name such as America/New_York.')
  .default(DEFAULT_TIME_ZONE);
