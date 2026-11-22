const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** A duration in minutes as a queue age: "45 m", "2 h 14 m", "3 d 4 h". */
export const formatMinutes = (minutes: number): string => {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes} m`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) {
    return `${hours} h ${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')} m`;
  }
  return `${Math.floor(hours / HOURS_PER_DAY)} d ${hours % HOURS_PER_DAY} h`;
};

/** Time elapsed since an instant, as a queue age. */
export const formatAge = (fromIso: string, now: Date = new Date()): string =>
  formatMinutes(Math.max(0, Math.floor((now.getTime() - Date.parse(fromIso)) / MS_PER_MINUTE)));

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

/** An instant in the viewer's own time zone: "Nov 22, 2026, 8:14 AM EST". */
export const formatDateTime = (iso: string): string => dateTimeFormatter.format(new Date(iso));
