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
