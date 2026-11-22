import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type { PeriodDto } from '@paritas/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { Period } from './metrics.types.js';

interface DayBounds {
  from: Date;
  to: Date;
}

interface Today {
  today: string;
  start: string;
}

/**
 * Turns "days in a time zone" into exact instants. Postgres does the calendar
 * math (`AT TIME ZONE`), so daylight-saving shifts are handled correctly: a
 * day in New York can be 23 or 25 hours long.
 */
@Injectable()
export class PeriodService {
  /** Zones Postgres has confirmed it knows; Intl and Postgres tz databases can differ. */
  private readonly knownZones = new Set<string>(['UTC']);

  constructor(private readonly prisma: PrismaService) {}

  /** The last `days` days, today included. */
  async lastDays(days: number, timeZone: string): Promise<Period> {
    await this.assertKnownZone(timeZone);
    const [row] = await this.prisma.$queryRaw<Today[]>`
      SELECT to_char((now() AT TIME ZONE ${timeZone})::date, 'YYYY-MM-DD') AS today,
             to_char((now() AT TIME ZONE ${timeZone})::date - ${days - 1}::int, 'YYYY-MM-DD') AS start`;
    if (!row) {
      throw new Error('Could not resolve the current date.');
    }
    return this.between(row.start, row.today, timeZone);
  }

  /** From the start of `fromDate` to the end of `toDate` (inclusive), in `timeZone`. */
  async between(fromDate: string, toDate: string, timeZone: string): Promise<Period> {
    await this.assertKnownZone(timeZone);
    const [bounds] = await this.prisma.$queryRaw<DayBounds[]>`
      SELECT (${fromDate}::date)::timestamp AT TIME ZONE ${timeZone} AS "from",
             ((${toDate}::date) + 1)::timestamp AT TIME ZONE ${timeZone} AS "to"`;
    if (!bounds) {
      throw new Error('Could not resolve the period bounds.');
    }
    return { fromDate, toDate, timeZone, from: bounds.from, to: bounds.to };
  }

  private async assertKnownZone(timeZone: string): Promise<void> {
    if (this.knownZones.has(timeZone)) {
      return;
    }
    const [row] = await this.prisma.$queryRaw<Array<{ known: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = ${timeZone}) AS known`;
    if (!row?.known) {
      throw new UnprocessableEntityException(`Time zone "${timeZone}" is not supported.`);
    }
    this.knownZones.add(timeZone);
  }
}

export const toPeriodDto = (period: Period): PeriodDto => ({
  fromDate: period.fromDate,
  toDate: period.toDate,
  timeZone: period.timeZone,
  from: period.from.toISOString(),
  to: period.to.toISOString(),
});
