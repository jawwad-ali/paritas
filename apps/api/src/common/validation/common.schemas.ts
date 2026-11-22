import { z } from 'zod';

/** Route params that are entity ids. Rejecting non-UUIDs early avoids a DB cast error (500). */
export const uuidSchema = z.uuid();
