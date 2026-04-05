/**
 * Date utilities for handling date strings without timezone issues.
 *
 * When JavaScript parses "YYYY-MM-DD" strings, it treats them as UTC midnight.
 * This causes dates to shift by a day when displayed in local timezones behind UTC.
 * These utilities ensure dates are parsed and displayed correctly as local dates.
 */

/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC.
 * This prevents timezone-related off-by-one-day errors.
 * Returns null if the date string is invalid.
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }

  return new Date(year, month - 1, day); // month is 0-indexed in JS
}

/**
 * Format a date string for display.
 * Returns '-' if the date string is invalid.
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  const date = parseLocalDate(dateString);
  if (!date) {
    return '-';
  }
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date range for display (e.g., "Apr 6 - Apr 19, 2026").
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const start = formatDate(startDate, { month: 'short', day: 'numeric' });
  const end = formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
}
