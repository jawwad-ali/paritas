import type { Prisma } from '../../generated/prisma/client.js';
import type { Period, TrendRow } from './metrics.types.js';

type Sql = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * One row per day of the period (zero-filled), bucketed in the period's time
 * zone: records by payment date, exceptions by detection and closure date.
 */
export const dailyTrend = (db: Sql, period: Period): Promise<TrendRow[]> => {
  const { fromDate, toDate, timeZone: tz, from, to } = period;
  return db.$queryRaw<TrendRow[]>`
    WITH days AS (
      SELECT d::date AS day
      FROM generate_series(${fromDate}::date, ${toDate}::date, interval '1 day') AS d
    ),
    txn AS (
      SELECT (occurred_at AT TIME ZONE ${tz})::date AS day,
             count(*)::int AS total,
             (count(*) FILTER (WHERE reconciliation_status = 'MATCHED'))::int AS matched,
             (count(*) FILTER (WHERE reconciliation_status = 'EXCLUDED'))::int AS excluded
      FROM transactions
      WHERE occurred_at >= ${from} AND occurred_at < ${to}
      GROUP BY 1
    ),
    opened AS (
      SELECT (created_at AT TIME ZONE ${tz})::date AS day, count(*)::int AS n
      FROM exceptions
      WHERE created_at >= ${from} AND created_at < ${to}
      GROUP BY 1
    ),
    closed AS (
      SELECT (resolved_at AT TIME ZONE ${tz})::date AS day, count(*)::int AS n
      FROM exceptions
      WHERE status IN ('RESOLVED', 'IGNORED') AND resolved_at >= ${from} AND resolved_at < ${to}
      GROUP BY 1
    )
    SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
           coalesce(txn.total, 0) AS transactions,
           coalesce(txn.matched, 0) AS matched,
           coalesce(txn.excluded, 0) AS excluded,
           coalesce(opened.n, 0) AS "exceptionsOpened",
           coalesce(closed.n, 0) AS "exceptionsClosed"
    FROM days
    LEFT JOIN txn USING (day)
    LEFT JOIN opened USING (day)
    LEFT JOIN closed USING (day)
    ORDER BY days.day`;
};

/** Median hours from detection to closure, for exceptions closed in the period. */
export const medianHoursToClose = async (db: Sql, period: Period): Promise<number | null> => {
  const [row] = await db.$queryRaw<Array<{ hours: number | null }>>`
    SELECT percentile_cont(0.5) WITHIN GROUP (
             ORDER BY extract(epoch FROM resolved_at - created_at)
           ) / 3600 AS hours
    FROM exceptions
    WHERE status IN ('RESOLVED', 'IGNORED')
      AND resolved_at >= ${period.from} AND resolved_at < ${period.to}`;
  const hours = row?.hours;
  return hours === null || hours === undefined ? null : Math.round(Number(hours) * 100) / 100;
};
