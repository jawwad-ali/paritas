import { z } from 'zod';

/** Query strings are text: accept exactly "true"/"false" (z.coerce.boolean would read "false" as true). */
export const booleanQueryParam = z.enum(['true', 'false']).transform((value) => value === 'true');

/** ISO-8601 date or date-time in a query string, parsed to a Date. */
export const dateQueryParam = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((value) => new Date(value));
