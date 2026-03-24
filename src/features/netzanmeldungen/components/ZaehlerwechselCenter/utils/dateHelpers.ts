/**
 * Date helper utilities for ZaehlerwechselCenter
 */

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Convert DD.MM.YY or DD.MM.YYYY to YYYY-MM-DD */
export function parseDateDE(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  let year = match[3];

  if (year.length === 2) {
    const num = parseInt(year, 10);
    year = num >= 70 ? `19${year}` : `20${year}`;
  }

  // Validate using UTC to avoid timezone issues
  // new Date("YYYY-MM-DD") parses as UTC, so we must use getUTCDate()
  const d = new Date(`${year}-${month}-${day}`);
  if (isNaN(d.getTime())) return null;
  if (d.getUTCDate() !== parseInt(day, 10)) return null;

  return `${year}-${month}-${day}`;
}

/** Format YYYY-MM-DD to DD.MM.YYYY */
export function formatDateDE(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

/** Get weekday name from YYYY-MM-DD */
export function getWeekday(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return WEEKDAYS[d.getDay()];
}

/** Get short weekday from YYYY-MM-DD */
export function getWeekdayShort(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return WEEKDAYS_SHORT[d.getDay()];
}

/** Get month name from YYYY-MM-DD */
export function getMonthName(isoDate: string): string {
  const monthIdx = parseInt(isoDate.split('-')[1], 10) - 1;
  return MONTHS[monthIdx];
}

/** Get short month name from YYYY-MM-DD */
export function getMonthShort(isoDate: string): string {
  const monthIdx = parseInt(isoDate.split('-')[1], 10) - 1;
  return MONTHS_SHORT[monthIdx];
}

/** Get day number from YYYY-MM-DD */
export function getDayNumber(isoDate: string): string {
  return String(parseInt(isoDate.split('-')[2], 10));
}

/** Check if date is today */
export function isToday(isoDate: string): boolean {
  return isoDate === new Date().toISOString().split('T')[0];
}

/** Check if date is in the past */
export function isPast(isoDate: string): boolean {
  return isoDate < new Date().toISOString().split('T')[0];
}

/** Parse HH:MM time, also handles H:MM */
export function parseTime(timeStr: string): string | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
