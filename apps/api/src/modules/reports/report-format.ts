/** Human formatting for report files. US conventions: "Nov 3, 2026", 12-hour clock. */

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-11-03" (a calendar day, no time zone) → "Nov 3, 2026". */
export const formatDay = (isoDate: string): string =>
  dayFormatter.format(new Date(`${isoDate}T00:00:00Z`));

const instantFormatters = new Map<string, Intl.DateTimeFormat>();

/** An instant shown in the report's time zone, e.g. "Nov 3, 2026, 4:05 PM EST". */
export const formatInstant = (instant: Date | string, timeZone: string): string => {
  let formatter = instantFormatters.get(timeZone);
  if (!formatter) {
    // dateStyle/timeStyle cannot be combined with timeZoneName, so list the parts.
    formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
      timeZoneName: 'short',
    });
    instantFormatters.set(timeZone, formatter);
  }
  return formatter.format(typeof instant === 'string' ? new Date(instant) : instant);
};

/** 0.91234 → "91.23%"; null → "" (nothing to reconcile). */
export const formatRate = (value: number | null): string =>
  value === null ? '' : `${(value * 100).toFixed(2)}%`;

/** Safe file-name part: "paritas-exceptions_2026-11-01_2026-11-30.csv". */
export const reportFileName = (
  report: string,
  from: string,
  to: string,
  extension: string,
): string => `paritas-${report}_${from}_${to}.${extension}`;

/** 0.05 → "3 min", 5.25 → "5.3 h", 60 → "2.5 d"; null → "—". */
export const formatDuration = (hours: number | null): string => {
  if (hours === null) {
    return '—';
  }
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))} min`;
  }
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} d`;
};
