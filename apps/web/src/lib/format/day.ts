/** Calendar days ("2026-11-03") are not instants: format them in UTC so no time zone shifts them. */
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const LONG = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const asDate = (day: string): Date => new Date(`${day}T00:00:00Z`);

export const formatDay = (day: string, style: 'short' | 'long' = 'short'): string =>
  (style === 'short' ? SHORT : LONG).format(asDate(day));

/** The viewer's IANA time zone; days on the dashboard and in reports are counted in it. */
export const browserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** Today in the given zone as YYYY-MM-DD (en-CA formats dates that way). */
export const todayIn = (timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());

/** A calendar day `days` before `day`. */
export const shiftDay = (day: string, days: number): string =>
  new Date(asDate(day).getTime() + days * 86_400_000).toISOString().slice(0, 10);
