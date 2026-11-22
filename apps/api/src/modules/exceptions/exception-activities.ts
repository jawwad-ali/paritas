import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Appends timeline entries in the given order. Entries written together would
 * otherwise share a timestamp and could sort either way, so each gets its own
 * millisecond.
 */
export const appendActivities = async (
  tx: Prisma.TransactionClient,
  activities: Prisma.ExceptionActivityCreateManyInput[],
): Promise<void> => {
  const start = Date.now();
  await tx.exceptionActivity.createMany({
    data: activities.map((activity, index) => ({
      ...activity,
      createdAt: new Date(start + index),
    })),
  });
};
