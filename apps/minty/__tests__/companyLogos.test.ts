import { COMPANY_DOMAINS, domainForSymbol, logoCandidates } from '../src/constants/companyDomains';
import { MOCK_STOCKS } from '../src/constants/mockData';
import { StockItem } from '../src/types';

/**
 * Every instrument in the shipped catalogue must resolve to a logo source.
 * A missing domain is a silent downgrade to a lettermark, so it is worth
 * failing the build over rather than discovering it on a device.
 */
describe('company logo coverage', () => {
  const catalogue = MOCK_STOCKS as StockItem[];

  it('covers every symbol in the catalogue', () => {
    const missing = catalogue
      .map((s) => s.symbol)
      .filter((symbol) => domainForSymbol(symbol) === null);

    expect(missing).toEqual([]);
  });

  it('produces at least two candidate sources per symbol', () => {
    for (const stock of catalogue) {
      const candidates = logoCandidates(stock.symbol);
      expect(candidates.length).toBeGreaterThanOrEqual(2);
      for (const url of candidates) {
        expect(url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('normalises exchange suffixes and casing', () => {
    expect(domainForSymbol('reliance')).toBe('ril.com');
    expect(domainForSymbol('RELIANCE.NS')).toBe('ril.com');
    expect(domainForSymbol('TCS.BO')).toBe('tcs.com');
    expect(domainForSymbol('  INFY  ')).toBe('infosys.com');
  });

  it('returns null for unknown or unusable symbols rather than guessing', () => {
    expect(domainForSymbol('NOTALISTEDCO')).toBeNull();
    expect(domainForSymbol('')).toBeNull();
    expect(domainForSymbol(null)).toBeNull();
    expect(domainForSymbol(undefined)).toBeNull();
    expect(domainForSymbol(42)).toBeNull();
    expect(logoCandidates('NOTALISTEDCO')).toEqual([]);
  });

  it('maps every domain to a plausible hostname', () => {
    for (const [symbol, domain] of Object.entries(COMPANY_DOMAINS)) {
      expect(symbol).toBe(symbol.toUpperCase());
      expect(domain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
      expect(domain).not.toContain('/');
      expect(domain).not.toContain('http');
    }
  });
});
