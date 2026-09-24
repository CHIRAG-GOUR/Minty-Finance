/**
 * Official web domain per listed instrument.
 *
 * Logos are fetched by domain rather than bundled, so the app ships no
 * third-party brand assets and a rebrand fixes itself. Maintained metadata: a
 * symbol missing here simply falls back to its lettermark, never a wrong logo.
 */
export const COMPANY_DOMAINS: Record<string, string> = {
  // Indices
  'NIFTY 50': 'nseindia.com',
  NIFTY50: 'nseindia.com',
  SENSEX: 'bseindia.com',
  BANKNIFTY: 'nseindia.com',

  // Energy & materials
  RELIANCE: 'ril.com',
  ONGC: 'ongcindia.com',
  BPCL: 'bharatpetroleum.in',
  COALINDIA: 'www.coalindia.in',
  NTPC: 'ntpc.co.in',
  POWERGRID: 'powergrid.in',
  TATASTEEL: 'tatasteel.com',
  JSWSTEEL: 'jsw.in',
  HINDALCO: 'hindalco.com',
  VEDL: 'vedantalimited.com',
  GRASIM: 'www.grasim.com',
  ULTRACEMCO: 'ultratechcement.com',
  ASIANPAINT: 'www.asianpaints.com',

  // Technology
  TCS: 'tcs.com',
  INFY: 'infosys.com',
  HCLTECH: 'hcltech.com',
  WIPRO: 'wipro.com',
  TECHM: 'techmahindra.com',
  TATAELXSI: 'tataelxsi.com',

  // Banking & financial services
  HDFCBANK: 'hdfcbank.com',
  ICICIBANK: 'icicibank.com',
  SBIN: 'sbi.co.in',
  KOTAKBANK: 'kotak.com',
  AXISBANK: 'axisbank.com',
  INDUSINDBK: 'indusind.com',
  BAJFINANCE: 'bajajfinserv.in',
  HDFCLIFE: 'hdfclife.com',
  SBILIFE: 'sbilife.co.in',
  JIOFIN: 'www.jfs.in',
  PAYTM: 'paytm.com',

  // Consumer
  ITC: 'itcportal.com',
  NESTLEIND: 'nestle.in',
  BRITANNIA: 'britannia.co.in',
  TATACONSUM: 'tataconsumer.com',
  TITAN: 'titancompany.in',
  TRENT: 'westside.com',
  ZOMATO: 'zomato.com',
  SWIGGY: 'swiggy.com',

  // Automobile
  MARUTI: 'marutisuzuki.com',
  TATAMOTORS: 'tatamotors.com',
  'M&M': 'auto.mahindra.com',
  EICHERMOT: 'royalenfield.com',
  HEROMOTOCO: 'heromotocorp.com',
  'BAJAJ-AUTO': 'bajajauto.com',

  // Healthcare
  SUNPHARMA: 'sunpharma.com',
  CIPLA: 'cipla.com',
  DRREDDY: 'drreddys.com',
  DIVISLAB: 'divislabs.com',
  APOLLOHOSP: 'apollohospitals.com',

  // Industrials & infrastructure
  LT: 'larsentoubro.com',
  BEL: 'bel-india.co.in',
  HAL: 'hal-india.co.in',
  ADANIENT: 'adanienterprises.com',
  ADANIPORTS: 'adaniports.com',
  IRCTC: 'irctc.com',
  BHARTIARTL: 'airtel.in',
};

/** Domain for a symbol, or null when none is on record. */
export function domainForSymbol(symbol: unknown): string | null {
  if (typeof symbol !== 'string') return null;
  const key = symbol.trim().toUpperCase();
  if (key === '') return null;
  if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
  // Live-discovered tickers arrive suffixed (RELIANCE.NS, TCS.BO).
  const base = key.replace(/\.(NS|BO)$/, '');
  return COMPANY_DOMAINS[base] ?? null;
}

/**
 * Candidate logo URLs, highest quality first. The component walks this list on
 * each load failure, so a domain the first provider does not know still has a
 * chance before falling back to a lettermark.
 */
export function logoCandidates(symbol: unknown, size: number = 128): string[] {
  const domain = domainForSymbol(symbol);
  if (!domain) return [];
  const px = size <= 64 ? 64 : 128;
  return [
    // Resolves a real mark for far more Indian corporate domains than the
    // alternatives, which mostly answer with a generic globe placeholder.
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=${px}&url=https://${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=${px}`,
  ];
}
