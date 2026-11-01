const pad = (n: number) => String(n).padStart(2, '0');

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD as local midnight */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(s: unknown): s is string {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) return false;
  return toISODate(parseISODate(s)) === s;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOf(s: string): number {
  return parseISODate(s).getDay();
}

/** Monday of the week containing the given date */
export function startOfWeek(s: string): string {
  const dow = weekdayOf(s);
  return addDays(s, dow === 0 ? -6 : 1 - dow);
}

export function formatDate(s: string, opts: Intl.DateTimeFormatOptions): string {
  return parseISODate(s).toLocaleDateString(undefined, opts);
}

export function formatDayHeading(s: string): string {
  return formatDate(s, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatShortDate(s: string): string {
  return formatDate(s, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 5);
  const a = formatDate(weekStart, { day: 'numeric', month: 'short' });
  const b = formatDate(end, { day: 'numeric', month: 'short' });
  return `${a} – ${b}`;
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export const WEEKDAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
] as const;
