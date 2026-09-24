import { digitsOnly, formatNationalNumber, maskPhoneNumber, validatePhoneNumber } from '../src/utils/phone';
import { COUNTRIES, findCountry } from '../src/constants/countries';

const IN = findCountry('IN');
const US = findCountry('US');

describe('phone validation', () => {
  it('accepts a well-formed Indian mobile number', () => {
    const r = validatePhoneNumber('9876543210', IN);
    expect(r.valid).toBe(true);
    expect(r.e164).toBe('+919876543210');
    expect(r.error).toBeNull();
  });

  it('strips separators users paste in', () => {
    expect(validatePhoneNumber('98765 43210', IN).e164).toBe('+919876543210');
    expect(validatePhoneNumber('(987) 654-3210', IN).e164).toBe('+919876543210');
    expect(digitsOnly('+91 98765-43210')).toBe('919876543210');
  });

  it('drops a domestic trunk prefix', () => {
    expect(validatePhoneNumber('09876543210', IN).e164).toBe('+919876543210');
  });

  it('rejects an empty number with a usable message', () => {
    const r = validatePhoneNumber('', IN);
    expect(r.valid).toBe(false);
    expect(r.e164).toBeNull();
    expect(r.error).toMatch(/enter your phone number/i);
  });

  it('rejects the wrong length for the selected country', () => {
    expect(validatePhoneNumber('98765', IN).valid).toBe(false);
    expect(validatePhoneNumber('98765432100000', IN).valid).toBe(false);
    expect(validatePhoneNumber('98765', IN).error).toMatch(/10 digits/);
  });

  it('rejects an Indian number that cannot start with that digit', () => {
    const r = validatePhoneNumber('1234567890', IN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/6, 7, 8 or 9/);
  });

  it('applies the right rules per country, not just India', () => {
    expect(validatePhoneNumber('2015550123', US).e164).toBe('+12015550123');
    // 10 digits is valid for the US but the leading-digit rule must not apply.
    expect(validatePhoneNumber('2015550123', US).valid).toBe(true);
  });

  it('never throws on hostile input', () => {
    for (const v of ['abc', '   ', '++++', '0000000000']) {
      expect(() => validatePhoneNumber(v, IN)).not.toThrow();
    }
    expect(validatePhoneNumber('abc', IN).valid).toBe(false);
  });

  it('every country entry is internally consistent', () => {
    for (const c of COUNTRIES) {
      expect(c.dialCode.startsWith('+')).toBe(true);
      expect(c.nationalLength.length).toBeGreaterThan(0);
      expect(c.nationalLength.every((n) => n > 0)).toBe(true);
    }
  });
});

describe('formatNationalNumber', () => {
  it('groups Indian numbers and caps the length', () => {
    expect(formatNationalNumber('9876543210', IN)).toBe('98765 43210');
    expect(formatNationalNumber('98765432109999', IN)).toBe('98765 43210');
  });

  it('never throws on junk', () => {
    expect(() => formatNationalNumber('abc', IN)).not.toThrow();
    expect(formatNationalNumber('abc', IN)).toBe('');
  });
});

describe('maskPhoneNumber', () => {
  it('keeps the dial code and last four digits visible', () => {
    const masked = maskPhoneNumber('+919876543210');
    expect(masked).toContain('+91');
    expect(masked).toContain('3210');
    expect(masked).not.toContain('98765');
  });

  it('degrades gracefully for short or empty input', () => {
    expect(() => maskPhoneNumber('')).not.toThrow();
    expect(() => maskPhoneNumber('+91')).not.toThrow();
  });
});
