/* =================================================================
   Calendar date helpers.
   All ISO conversion is done in LOCAL time (never toISOString, which is
   UTC and can shift the day across timezones).
   ================================================================= */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Format a Date as a local "YYYY-MM-DD" string. */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local ISO date string. */
export function todayISO() {
  return toISODate(new Date());
}

/** Parse a "YYYY-MM-DD" string into a local Date (noon to dodge DST edges). */
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Build the day cells for a month's grid. Includes leading/trailing buffer
 * days from neighboring months so the grid always starts on Sunday and fills
 * complete weeks (no stray empty trailing row).
 *
 * Returns: Array<{ date, iso, day, inMonth, isToday }>
 */
export function getMonthMatrix(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const today = todayISO();

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    // Using day = (1 - firstWeekday + i) lets the Date constructor roll over
    // month boundaries correctly for both leading and trailing buffer days.
    const date = new Date(year, month, 1 - firstWeekday + i);
    const iso = toISODate(date);
    cells.push({
      date,
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: iso === today,
    });
  }
  return cells;
}

/** Long, human-friendly date label, e.g. "Friday, June 12, 2026". */
export function formatLongDate(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The "YYYY-MM" prefix used to scope a month's day keys. */
export function monthPrefix(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
