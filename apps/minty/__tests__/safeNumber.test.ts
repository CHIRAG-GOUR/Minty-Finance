import {
  clamp,
  finiteSeries,
  isFiniteNumber,
  maxOf,
  minOf,
  round,
  safeDivide,
  safePercent,
  toFiniteNumber,
  toFiniteNumberOrNull,
  toNonEmptyString,
} from '../src/utils/safeNumber';

const bad = [undefined, null, NaN, Infinity, -Infinity, {}, [], 'abc', ''];

describe('safeNumber', () => {
  it('isFiniteNumber rejects every non-finite input', () => {
    for (const v of bad) expect(isFiniteNumber(v)).toBe(false);
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-12.5)).toBe(true);
  });

  it('toFiniteNumber falls back rather than producing NaN', () => {
    for (const v of bad) expect(toFiniteNumber(v, 7)).toBe(7);
    expect(toFiniteNumber('1234.5')).toBe(1234.5);
    expect(toFiniteNumber(42)).toBe(42);
  });

  it('toFiniteNumberOrNull distinguishes unknown from zero', () => {
    expect(toFiniteNumberOrNull(0)).toBe(0);
    expect(toFiniteNumberOrNull(undefined)).toBeNull();
    expect(toFiniteNumberOrNull(NaN)).toBeNull();
  });

  it('safeDivide never returns Infinity or NaN', () => {
    expect(safeDivide(10, 0)).toBe(0);
    expect(safeDivide(10, 0, -1)).toBe(-1);
    expect(safeDivide(undefined, 5)).toBe(0);
    expect(safeDivide(10, 4)).toBe(2.5);
  });

  it('safePercent handles a zero or missing base', () => {
    expect(safePercent(5, 0)).toBe(0);
    expect(safePercent(5, 50)).toBe(10);
    expect(safePercent(undefined, undefined)).toBe(0);
  });

  it('round always returns a finite number', () => {
    for (const v of bad) expect(Number.isFinite(round(v))).toBe(true);
    // 1.005 is 1.00499… in binary floating point, so it rounds down. Asserting
    // the real behaviour rather than the decimal intuition.
    expect(round(1.005, 2)).toBe(1);
    expect(round(2.345, 2)).toBe(2.35);
    expect(round(1234.5678, 2)).toBe(1234.57);
  });

  it('clamp bounds unusable input to the minimum', () => {
    expect(clamp(NaN, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it('minOf/maxOf skip holes and do not use spread', () => {
    const series = [3, NaN, 1, undefined, 9] as unknown as number[];
    expect(minOf(series)).toBe(1);
    expect(maxOf(series)).toBe(9);
    expect(minOf([], 5)).toBe(5);
  });

  it('minOf/maxOf survive a series large enough to blow the call stack', () => {
    // Math.min(...arr) throws RangeError well before this length.
    const big = new Array(200000).fill(1);
    big[12345] = -4;
    expect(() => minOf(big)).not.toThrow();
    expect(minOf(big)).toBe(-4);
  });

  it('finiteSeries strips every hole', () => {
    expect(finiteSeries([1, undefined, 2, NaN, '3', null])).toEqual([1, 2, 3]);
    expect(finiteSeries(undefined)).toEqual([]);
    expect(finiteSeries('not an array')).toEqual([]);
  });

  it('toNonEmptyString rejects blanks', () => {
    expect(toNonEmptyString('  RELIANCE ')).toBe('RELIANCE');
    expect(toNonEmptyString('   ')).toBeNull();
    expect(toNonEmptyString(undefined)).toBeNull();
  });
});
