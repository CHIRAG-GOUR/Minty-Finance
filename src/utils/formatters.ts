import { isFiniteNumber, toFiniteNumberOrNull } from './safeNumber';

/** Shown wherever a real value is genuinely unavailable, instead of a fake ₹0. */
export const UNAVAILABLE = '—';

/**
 * Formats numbers into clean Indian Rupee format (e.g. ₹12,450).
 * Unusable input formats as ₹0 so totals still read sensibly; use
 * `formatCurrencyOrDash` when "unknown" must not look like zero.
 */
export function formatCurrency(amount: unknown, includeDecimals: boolean = false): string {
  const value = toFiniteNumberOrNull(amount);
  if (value === null) return '₹0';

  const rounded = includeDecimals ? value.toFixed(2) : Math.round(value).toString();
  const parts = rounded.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';

  // Indian numbering system formatting
  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.slice(1);

  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInteger =
    otherNumbers !== ''
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInteger}${decimalPart}`;
}

/** Currency, but an unknown value renders as a dash rather than ₹0. */
export function formatCurrencyOrDash(amount: unknown, includeDecimals: boolean = false): string {
  return toFiniteNumberOrNull(amount) === null ? UNAVAILABLE : formatCurrency(amount, includeDecimals);
}

/**
 * Formats compact numbers (e.g. ₹1.2k, ₹15L).
 */
export function formatCompactCurrency(amount: unknown): string {
  const value = toFiniteNumberOrNull(amount);
  if (value === null) return UNAVAILABLE;

  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

/** Plain compact count (volumes, share counts) without a currency symbol. */
export function formatCompactNumber(value: unknown): string {
  const n = toFiniteNumberOrNull(value);
  if (n === null) return UNAVAILABLE;
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

/**
 * Formats percentage with sign. `includeSign` adds the leading "+" for gains,
 * so callers must not prepend their own (that produced "++0.4%").
 */
export function formatPercentage(
  percent: unknown,
  includeSign: boolean = true,
  decimals: number = 1
): string {
  const value = toFiniteNumberOrNull(percent);
  if (value === null) return UNAVAILABLE;
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Signed currency delta, e.g. "+₹1,240" / "-₹310". */
export function formatSignedCurrency(amount: unknown, includeDecimals: boolean = false): string {
  const value = toFiniteNumberOrNull(amount);
  if (value === null) return UNAVAILABLE;
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value, includeDecimals)}`;
}

/** Share / unit quantities. Whole numbers stay whole. */
export function formatQuantity(value: unknown, decimals: number = 2): string {
  const n = toFiniteNumberOrNull(value);
  if (n === null) return UNAVAILABLE;
  return Number.isInteger(n) ? String(n) : n.toFixed(decimals);
}

/**
 * Formats XP with thousands separator.
 */
export function formatXP(xp: unknown): string {
  const value = toFiniteNumberOrNull(xp);
  if (value === null) return '0 XP';
  return `${Math.round(value).toLocaleString('en-IN')} XP`;
}

/**
 * Formats date to a friendly short string.
 */
export function formatDate(dateString: unknown): string {
  if (typeof dateString !== 'string' || dateString.trim() === '') return UNAVAILABLE;
  try {
    const date = new Date(dateString);
    if (!isFiniteNumber(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/** Date + time for ledger rows. Invalid timestamps degrade to a dash. */
export function formatDateTime(dateString: unknown): string {
  if (typeof dateString !== 'string' || dateString.trim() === '') return UNAVAILABLE;
  try {
    const date = new Date(dateString);
    if (!isFiniteNumber(date.getTime())) return UNAVAILABLE;
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return UNAVAILABLE;
  }
}

/** Time-only for compact rows. */
export function formatTime(dateString: unknown): string {
  if (typeof dateString !== 'string' || dateString.trim() === '') return UNAVAILABLE;
  try {
    const date = new Date(dateString);
    if (!isFiniteNumber(date.getTime())) return UNAVAILABLE;
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return UNAVAILABLE;
  }
}

/**
 * Percentage as a CSS-style width string that Yoga will always accept.
 * `${NaN}%` is a hard layout error on Android, so it is clamped to 0–100.
 */
export function toWidthPercent(value: unknown, min: number = 0, max: number = 100): `${number}%` {
  const n = toFiniteNumberOrNull(value);
  const clamped = n === null ? min : Math.min(max, Math.max(min, n));
  return `${Math.round(clamped * 100) / 100}%`;
}
