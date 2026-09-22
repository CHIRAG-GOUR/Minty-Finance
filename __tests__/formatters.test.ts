import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatCurrencyOrDash,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatQuantity,
  formatSignedCurrency,
  formatTime,
  formatCandleDate,
  formatXP,
  toWidthPercent,
  UNAVAILABLE,
} from '../src/utils/formatters';

const bad: unknown[] = [undefined, null, NaN, Infinity, -Infinity, {}, [], 'abc'];

describe('formatters', () => {
  it('never throws on unusable input', () => {
    for (const v of bad) {
      expect(() => formatCurrency(v as number)).not.toThrow();
      expect(() => formatCurrencyOrDash(v as number)).not.toThrow();
      expect(() => formatCompactCurrency(v as number)).not.toThrow();
      expect(() => formatCompactNumber(v as number)).not.toThrow();
      expect(() => formatPercentage(v as number)).not.toThrow();
      expect(() => formatSignedCurrency(v as number)).not.toThrow();
      expect(() => formatQuantity(v as number)).not.toThrow();
      expect(() => formatXP(v as number)).not.toThrow();
      expect(() => formatDate(v as string)).not.toThrow();
      expect(() => formatDateTime(v as string)).not.toThrow();
      expect(() => formatTime(v as string)).not.toThrow();
      expect(() => formatCandleDate(v as string)).not.toThrow();
      expect(() => toWidthPercent(v as number)).not.toThrow();
    }
  });

  it('formats Indian currency groupings', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000');
    expect(formatCurrency(2540.5, true)).toBe('₹2,540.50');
    expect(formatCurrency(-1500)).toBe('-₹1,500');
  });

  it('shows a dash when a value is genuinely unknown', () => {
    expect(formatCurrencyOrDash(undefined)).toBe(UNAVAILABLE);
    expect(formatCurrencyOrDash(0)).toBe('₹0');
    expect(formatPercentage(undefined)).toBe(UNAVAILABLE);
  });

  it('emits exactly one plus sign for a gain', () => {
    expect(formatPercentage(0.4)).toBe('+0.4%');
    expect(formatPercentage(0.4).match(/\+/g)).toHaveLength(1);
    expect(formatPercentage(-0.4)).toBe('-0.4%');
    expect(formatPercentage(0.4, false)).toBe('0.4%');
    expect(formatSignedCurrency(120)).toBe('+₹120');
    expect(formatSignedCurrency(-120)).toBe('-₹120');
  });

  it('toWidthPercent always yields a value Yoga will accept', () => {
    // "NaN%" / "Infinity%" are hard layout errors on Android.
    for (const v of bad) {
      const out = toWidthPercent(v as number);
      expect(out).toMatch(/^-?\d+(\.\d+)?%$/);
      expect(out).not.toContain('NaN');
      expect(out).not.toContain('Infinity');
    }
    expect(toWidthPercent(150)).toBe('100%');
    expect(toWidthPercent(-20)).toBe('0%');
    expect(toWidthPercent(42.5)).toBe('42.5%');
  });

  it('formats quantities and compact numbers', () => {
    expect(formatQuantity(10)).toBe('10');
    expect(formatQuantity(10.5)).toBe('10.50');
    expect(formatCompactNumber(1500000)).toBe('15.0L');
  });

  it('degrades invalid dates instead of crashing', () => {
    expect(formatDateTime('not-a-date')).toBe(UNAVAILABLE);
    expect(formatTime('')).toBe(UNAVAILABLE);
    expect(formatDate(new Date('2026-01-15').toISOString())).toContain('2026');
    expect(formatCandleDate('2026-03-15T09:30:00.000Z', '1D')).toBeTruthy();
  });
});
