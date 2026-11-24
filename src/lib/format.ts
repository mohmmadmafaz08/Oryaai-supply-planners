const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const multiplierFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formats an integer quantity with its unit label (e.g. "1,240 units").
 */
export function formatUnits(value: number, unit = 'units'): string {
  return `${integerFormatter.format(Math.round(value))} ${unit}`;
}

/**
 * Formats a signed integer quantity with explicit + or - prefix and unit.
 */
export function formatSignedUnits(value: number, unit = 'units'): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${integerFormatter.format(rounded)} ${unit}`;
}

/**
 * Formats an integer count without units (for row counts or week counts).
 */
export function formatCount(value: number): string {
  return integerFormatter.format(Math.round(value));
}

/**
 * Formats a US dollar cost with explicit USD suffix for planner clarity.
 */
export function formatUsd(value: number): string {
  return `${currencyFormatter.format(Math.round(value))} USD`;
}

/**
 * Formats a ratio in [0, 1] as a percentage with 1 decimal place.
 */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}

/**
 * Formats a day duration with explicit "days" unit.
 */
export function formatDays(days: number): string {
  const rounded = Math.round(days);
  return `${integerFormatter.format(rounded)} ${rounded === 1 ? 'day' : 'days'}`;
}

/**
 * Formats a week number as W01..W52.
 */
export function formatWeekLabel(week: number): string {
  return `W${String(week).padStart(2, '0')}`;
}

/**
 * Formats a simulation multiplier with explicit "x" suffix.
 */
export function formatMultiplier(value: number): string {
  return `${multiplierFormatter.format(value)}x`;
}

/**
 * Formats a score with one decimal place.
 */
export function formatScore(value: number): string {
  return decimalFormatter.format(value);
}

/**
 * Formats a ratio delta as signed percentage points with explicit "pp" unit (never "%").
 */
export function formatPercentagePoints(deltaRatio: number): string {
  const pp = deltaRatio * 100;
  const rounded = Math.round(pp * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${decimalFormatter.format(rounded)} pp`;
}
