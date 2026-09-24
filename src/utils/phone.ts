import { Country } from '../constants/countries';

export interface PhoneValidationResult {
  valid: boolean;
  /** Full E.164 number (e.g. "+919876543210"), only set when `valid`. */
  e164: string | null;
  /** User-facing reason, only set when invalid. */
  error: string | null;
}

/** Everything that is not a digit. Users paste numbers with spaces, dashes and brackets. */
export function digitsOnly(input: string): string {
  return (input ?? '').replace(/\D+/g, '');
}

/**
 * Validates a subscriber number against its country before any network call.
 *
 * Firebase throttles by project, so letting an obviously malformed number
 * through costs the user a wasted SMS attempt and moves them closer to a
 * rate-limit they did not earn. Firebase still has the final say on whether a
 * well-formed number is reachable.
 */
export function validatePhoneNumber(nationalNumber: string, country: Country): PhoneValidationResult {
  const digits = digitsOnly(nationalNumber);

  if (digits.length === 0) {
    return { valid: false, e164: null, error: 'Please enter your phone number.' };
  }

  // A leading trunk prefix ("0") is how the number is dialled domestically but
  // is not part of the international format.
  const normalized = digits.replace(/^0+/, '');
  if (normalized.length === 0) {
    return { valid: false, e164: null, error: 'Please enter a valid phone number.' };
  }

  const accepted = country.nationalLength;
  if (!accepted.includes(normalized.length)) {
    const expected =
      accepted.length === 1
        ? `${accepted[0]} digits`
        : `${accepted.slice(0, -1).join(', ')} or ${accepted[accepted.length - 1]} digits`;
    return {
      valid: false,
      e164: null,
      error: `A ${country.name} mobile number is ${expected}.`,
    };
  }

  // Indian mobile numbers always begin 6-9; catching it here is a far better
  // message than Firebase's generic invalid-phone-number error.
  if (country.code === 'IN' && !/^[6-9]/.test(normalized)) {
    return {
      valid: false,
      e164: null,
      error: 'An Indian mobile number starts with 6, 7, 8 or 9.',
    };
  }

  return { valid: true, e164: `${country.dialCode}${normalized}`, error: null };
}

/**
 * Groups digits for readability while typing. Purely presentational — the value
 * sent to Firebase is always rebuilt from `validatePhoneNumber`.
 */
export function formatNationalNumber(input: string, country: Country): string {
  const digits = digitsOnly(input);
  const max = Math.max(...country.nationalLength);
  const capped = digits.slice(0, max);

  if (country.code === 'IN' && capped.length > 5) {
    return `${capped.slice(0, 5)} ${capped.slice(5)}`;
  }
  if (capped.length > 6) {
    return `${capped.slice(0, 3)} ${capped.slice(3, 6)} ${capped.slice(6)}`;
  }
  if (capped.length > 3) {
    return `${capped.slice(0, 3)} ${capped.slice(3)}`;
  }
  return capped;
}

/**
 * Masks the middle of a number for display on the OTP screen, so a shoulder
 * surfer cannot read it back but the user can still confirm it is theirs.
 */
export function maskPhoneNumber(e164: string): string {
  const value = (e164 ?? '').trim();
  if (value.length < 7) return value;
  const tail = value.slice(-4);
  const head = value.slice(0, value.length - 4);
  // Keep the dialling code visible, mask the rest of the head.
  const match = head.match(/^(\+\d{1,3})(.*)$/);
  if (!match) return `${'*'.repeat(Math.max(0, head.length))}${tail}`;
  return `${match[1]} ${'*'.repeat(Math.max(0, match[2].length))} ${tail}`;
}
