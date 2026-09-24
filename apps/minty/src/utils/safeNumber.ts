/**
 * Numeric guards used everywhere a value can arrive from storage, an API payload
 * or a calculation that may divide by zero. Financial UI must never be handed
 * NaN / Infinity: Yoga rejects "NaN%" dimensions and SVG paths built from NaN
 * render as an invisible, untappable chart.
 */

/** True only for real, finite JS numbers. Rejects NaN, Infinity, null, strings. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Coerces anything to a finite number, falling back when it cannot.
 * Numeric strings ("1234.5") are accepted because JSON payloads often quote them.
 */
export function toFiniteNumber(value: unknown, fallback: number = 0): number {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '') {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

/**
 * Like toFiniteNumber but returns null when there is no usable value, so callers
 * can tell "price is genuinely unknown" apart from "price is zero".
 */
export function toFiniteNumberOrNull(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Clamps to a range, returning `min` for unusable input. */
export function clamp(value: unknown, min: number, max: number): number {
  const n = toFiniteNumber(value, min);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/** Division that yields `fallback` instead of NaN/Infinity when the divisor is 0. */
export function safeDivide(numerator: unknown, denominator: unknown, fallback: number = 0): number {
  const n = toFiniteNumber(numerator, NaN);
  const d = toFiniteNumber(denominator, NaN);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return fallback;
  const result = n / d;
  return Number.isFinite(result) ? result : fallback;
}

/** Percentage change of `part` against `whole`, safe when `whole` is 0/unknown. */
export function safePercent(part: unknown, whole: unknown, fallback: number = 0): number {
  return safeDivide(part, whole, fallback / 100) * 100;
}

/** Rounds to `decimals` places and always returns a finite number. */
export function round(value: unknown, decimals: number = 2): number {
  const n = toFiniteNumber(value, 0);
  const factor = Math.pow(10, decimals);
  const result = Math.round(n * factor) / factor;
  return Number.isFinite(result) ? result : 0;
}

/**
 * Min/max over a list without the spread operator. `Math.min(...arr)` throws
 * RangeError on large series and returns NaN if any element is not a number.
 */
export function minOf(values: readonly number[], fallback: number = 0): number {
  let found = false;
  let out = fallback;
  for (const v of values) {
    if (!isFiniteNumber(v)) continue;
    if (!found || v < out) {
      out = v;
      found = true;
    }
  }
  return found ? out : fallback;
}

export function maxOf(values: readonly number[], fallback: number = 0): number {
  let found = false;
  let out = fallback;
  for (const v of values) {
    if (!isFiniteNumber(v)) continue;
    if (!found || v > out) {
      out = v;
      found = true;
    }
  }
  return found ? out : fallback;
}

/** Keeps only the finite entries of a numeric series. */
export function finiteSeries(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  const out: number[] = [];
  for (const v of values) {
    const n = toFiniteNumberOrNull(v);
    if (n !== null) out.push(n);
  }
  return out;
}

/** A non-empty trimmed string, or null. */
export function toNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '') return trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}
