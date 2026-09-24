/**
 * Dialling codes for the phone-number entry step.
 *
 * `nationalLength` is the set of valid subscriber-number lengths (excluding the
 * dialling code) for that country. It is deliberately a small curated list
 * rather than a full libphonenumber dependency: it only needs to be good enough
 * to stop obviously malformed numbers before they cost the user an SMS, and
 * Firebase remains the authority on whether a number is actually reachable.
 */
export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** Dialling code including the leading '+'. */
  dialCode: string;
  /** Accepted national (subscriber) number lengths. */
  nationalLength: number[];
  /** Example subscriber number, shown as the input placeholder. */
  example: string;
}

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dialCode: '+91', nationalLength: [10], example: '98765 43210' },
  { code: 'US', name: 'United States', dialCode: '+1', nationalLength: [10], example: '201 555 0123' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', nationalLength: [10], example: '7400 123456' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', nationalLength: [9], example: '50 123 4567' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', nationalLength: [8], example: '8123 4567' },
  { code: 'AU', name: 'Australia', dialCode: '+61', nationalLength: [9], example: '412 345 678' },
  { code: 'CA', name: 'Canada', dialCode: '+1', nationalLength: [10], example: '204 555 0123' },
  { code: 'DE', name: 'Germany', dialCode: '+49', nationalLength: [10, 11], example: '1512 3456789' },
  { code: 'FR', name: 'France', dialCode: '+33', nationalLength: [9], example: '6 12 34 56 78' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', nationalLength: [9], example: '71 123 4567' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', nationalLength: [8, 9], example: '21 123 456' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', nationalLength: [9, 10], example: '12 345 6789' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', nationalLength: [9], example: '71 234 5678' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', nationalLength: [10], example: '98 1234 5678' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', nationalLength: [10], example: '1812 345678' },
];

/** India is the primary audience, so it is the default selection — not the only option. */
export const DEFAULT_COUNTRY_CODE = 'IN';

export function findCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
