import { Prisma } from '../../generated/prisma/client.js';

/** https://www.prisma.io/docs/orm/reference/error-reference#p2002 */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export const isUniqueConstraintViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === UNIQUE_CONSTRAINT_VIOLATION;
