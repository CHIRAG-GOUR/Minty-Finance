/**
 * The single place raw provider payloads become shapes the UI may render.
 *
 *   Raw API response -> MarketDataNormalizer -> validated Quote/Candle -> screens
 *
 * Nothing in this file throws. A field that cannot be trusted becomes `null`
 * (so the UI can show "unavailable") rather than NaN (which silently corrupts
 * every downstream calculation and breaks chart geometry).
 */
import {
  StockItem,
  MutualFundItem,
  HistoricalCandle,
  MarketStatusInfo,
  MarketSessionStatus,
  RiskLevel,
} from '../types';
import {
  isFiniteNumber,
  toFiniteNumber,
  toFiniteNumberOrNull,
  toNonEmptyString,
  finiteSeries,
  round,
  safePercent,
} from '../utils/safeNumber';

/** A quote that has been validated well enough to render and to price an order. */
export interface NormalizedQuote {
  id: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  /** null when the provider gave no usable last-traded price. */
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  /** True when `price` is usable, i.e. the instrument can be priced and traded. */
  isPriced: boolean;
}

const VALID_SESSIONS: MarketSessionStatus[] = [
  'PRE_OPEN',
  'OPEN',
  'POST_CLOSE',
  'CLOSED',
  'HOLIDAY',
  'UNKNOWN',
];

const VALID_RISKS: RiskLevel[] = ['Low', 'Moderate', 'High'];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function positiveOrNull(value: unknown): number | null {
  const n = toFiniteNumberOrNull(value);
  if (n === null || n <= 0) return null;
  return n;
}

/**
 * Validates one quote. Returns null when the payload has no identity at all
 * (no symbol) — such a row cannot be looked up, traded or navigated to, so it
 * must be dropped rather than rendered as a card that leads nowhere.
 */
export function normalizeQuote(raw: unknown): NormalizedQuote | null {
  const r = asRecord(raw);
  if (!r) return null;

  const symbol = toNonEmptyString(r.symbol);
  if (!symbol) return null;

  const price = positiveOrNull(r.currentPrice ?? r.price ?? r.ltp);
  const previousClose = positiveOrNull(r.previousClose ?? r.prevClose);

  // Derive change/percent when the provider omits them but we have both prices.
  let change = toFiniteNumberOrNull(r.change);
  let changePercent = toFiniteNumberOrNull(r.changePercent ?? r.percentChange);
  if (change === null && price !== null && previousClose !== null) {
    change = round(price - previousClose, 2);
  }
  if (changePercent === null && change !== null && previousClose !== null) {
    changePercent = round(safePercent(change, previousClose), 2);
  }

  const exchangeRaw = toNonEmptyString(r.exchange);
  const exchange: 'NSE' | 'BSE' = exchangeRaw === 'BSE' ? 'BSE' : 'NSE';

  return {
    id: toNonEmptyString(r.id) ?? `stock_${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    name: toNonEmptyString(r.name) ?? symbol.toUpperCase(),
    exchange,
    sector: toNonEmptyString(r.sector) ?? 'Unclassified',
    price,
    change,
    changePercent,
    open: positiveOrNull(r.openPrice ?? r.open),
    dayHigh: positiveOrNull(r.dayHigh ?? r.high),
    dayLow: positiveOrNull(r.dayLow ?? r.low),
    previousClose,
    volume: (() => {
      const v = toFiniteNumberOrNull(r.volume);
      return v === null || v < 0 ? null : v;
    })(),
    fiftyTwoWeekHigh: positiveOrNull(r.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: positiveOrNull(r.fiftyTwoWeekLow),
    isPriced: price !== null,
  };
}

/**
 * Normalizes a provider stock row into the `StockItem` the app renders.
 * Numeric display fields are coerced to finite numbers; series are stripped of
 * holes. Rows with no symbol, or with no usable price, are rejected (null) —
 * an unpriced equity card would crash order maths and mislead a student.
 */
export function normalizeStockItem(raw: unknown): StockItem | null {
  const quote = normalizeQuote(raw);
  if (!quote || quote.price === null) return null;

  const r = asRecord(raw) as Record<string, unknown>;
  const price = quote.price;
  const previousClose = quote.previousClose ?? price;

  const sparkline = finiteSeries(r.sparkline);
  const h1D = finiteSeries(r.historical1D);
  const h1W = finiteSeries(r.historical1W);
  const h1M = finiteSeries(r.historical1M);
  const h1Y = finiteSeries(r.historical1Y);
  const h5Y = finiteSeries(r.historical5Y);

  const riskRaw = toNonEmptyString(r.risk) as RiskLevel | null;
  const risk: RiskLevel = riskRaw && VALID_RISKS.includes(riskRaw) ? riskRaw : 'Moderate';

  return {
    id: quote.id,
    symbol: quote.symbol,
    name: quote.name,
    exchange: quote.exchange,
    sector: quote.sector,
    currentPrice: price,
    openPrice: quote.open ?? undefined,
    dayHigh: quote.dayHigh ?? undefined,
    dayLow: quote.dayLow ?? undefined,
    previousClose,
    change: quote.change ?? round(price - previousClose, 2),
    changePercent: quote.changePercent ?? round(safePercent(price - previousClose, previousClose), 2),
    volume: quote.volume ?? undefined,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? undefined,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? undefined,
    risk,
    description: toNonEmptyString(r.description) ?? '',
    marketCap: toNonEmptyString(r.marketCap) ?? 'Not available',
    peRatio: toFiniteNumber(r.peRatio, 0),
    eps: toFiniteNumberOrNull(r.eps) ?? undefined,
    roe: toFiniteNumberOrNull(r.roe) ?? undefined,
    debtToEquity: toFiniteNumberOrNull(r.debtToEquity) ?? undefined,
    dividendYield: toFiniteNumber(r.dividendYield, 0),
    logoUrl: toNonEmptyString(r.logoUrl) ?? undefined,
    dataFreshness: (toNonEmptyString(r.dataFreshness) as StockItem['dataFreshness']) ?? undefined,
    lastTradedTime: toNonEmptyString(r.lastTradedTime) ?? undefined,
    // Fall back to the sparkline so a range always has *something* real to draw,
    // and to [] (an honest empty state) when the provider sent nothing at all.
    sparkline,
    historical1D: h1D.length > 0 ? h1D : sparkline,
    historical1W: h1W.length > 0 ? h1W : sparkline,
    historical1M: h1M.length > 0 ? h1M : sparkline,
    historical1Y: h1Y.length > 0 ? h1Y : sparkline,
    historical5Y: h5Y.length > 0 ? h5Y : undefined,
    fundamentals: (r.fundamentals as StockItem['fundamentals']) ?? undefined,
  };
}

/** Normalizes a list, silently discarding rows that cannot be trusted. */
export function normalizeStockList(raw: unknown): StockItem[] {
  if (!Array.isArray(raw)) return [];
  const out: StockItem[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const item = normalizeStockItem(row);
    if (!item) continue;
    if (seen.has(item.symbol)) continue; // duplicate symbols would break holding lookups
    seen.add(item.symbol);
    out.push(item);
  }
  return out;
}

export function normalizeMutualFund(raw: unknown): MutualFundItem | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = toNonEmptyString(r.id);
  const name = toNonEmptyString(r.name);
  const nav = positiveOrNull(r.nav);
  if (!id || !name || nav === null) return null;

  const riskRaw = toNonEmptyString(r.risk) as RiskLevel | null;
  const holdingsTop = Array.isArray(r.holdingsTop)
    ? r.holdingsTop.map((h) => toNonEmptyString(h)).filter((h): h is string => h !== null)
    : [];

  return {
    id,
    name,
    amc: toNonEmptyString(r.amc) ?? undefined,
    category: toNonEmptyString(r.category) ?? 'Diversified',
    logoUrl: toNonEmptyString(r.logoUrl) ?? undefined,
    nav,
    navChange: toFiniteNumberOrNull(r.navChange) ?? undefined,
    navChangePercent: toFiniteNumberOrNull(r.navChangePercent) ?? undefined,
    aumCr: toFiniteNumberOrNull(r.aumCr) ?? undefined,
    oneYearReturn: toFiniteNumber(r.oneYearReturn, 0),
    threeYearReturn: toFiniteNumber(r.threeYearReturn, 0),
    fiveYearReturn: toFiniteNumberOrNull(r.fiveYearReturn) ?? undefined,
    risk: riskRaw && VALID_RISKS.includes(riskRaw) ? riskRaw : 'Moderate',
    minInvestment: Math.max(1, toFiniteNumber(r.minInvestment, 500)),
    expenseRatio: toFiniteNumber(r.expenseRatio, 0),
    description: toNonEmptyString(r.description) ?? '',
    holdingsTop,
    topHoldings: Array.isArray(r.topHoldings)
      ? (r.topHoldings as MutualFundItem['topHoldings'])
      : undefined,
    fundObjective: toNonEmptyString(r.fundObjective) ?? undefined,
    benchmark: toNonEmptyString(r.benchmark) ?? undefined,
  };
}

export function normalizeMutualFundList(raw: unknown): MutualFundItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MutualFundItem[] = [];
  for (const row of raw) {
    const fund = normalizeMutualFund(row);
    if (fund) out.push(fund);
  }
  return out;
}

/**
 * Validates one OHLC candle. A candle is usable only if every price is a
 * positive finite number and the high/low actually bracket the open/close;
 * anything else would draw an inverted or infinitely tall wick.
 */
export function validateCandle(raw: unknown): HistoricalCandle | null {
  const r = asRecord(raw);
  if (!r) return null;

  const open = positiveOrNull(r.open);
  const close = positiveOrNull(r.close);
  if (open === null || close === null) return null;

  // A missing high/low is recoverable from open/close; a nonsensical one is not.
  const highRaw = positiveOrNull(r.high);
  const lowRaw = positiveOrNull(r.low);
  const high = highRaw ?? Math.max(open, close);
  const low = lowRaw ?? Math.min(open, close);
  if (high < low) return null;

  const volumeRaw = toFiniteNumberOrNull(r.volume);

  return {
    timestamp: toNonEmptyString(r.timestamp) ?? toNonEmptyString(r.time) ?? '',
    open,
    high: Math.max(high, open, close),
    low: Math.min(low, open, close),
    close,
    volume: volumeRaw !== null && volumeRaw >= 0 ? volumeRaw : 0,
  };
}

/**
 * Normalizes a historical series. Malformed candles are discarded individually
 * so one bad row from a provider cannot blank out an otherwise good chart.
 */
export function normalizeHistoricalData(raw: unknown): HistoricalCandle[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.candles)
    ? ((asRecord(raw) as Record<string, unknown>).candles as unknown[])
    : null;
  if (!list) return [];

  const out: HistoricalCandle[] = [];
  for (const row of list) {
    const candle = validateCandle(row);
    if (candle) out.push(candle);
  }
  return out;
}

/** Closing-price series for line charts, with holes removed. */
export function candlesToCloseSeries(candles: readonly HistoricalCandle[]): number[] {
  const out: number[] = [];
  for (const c of candles) {
    if (isFiniteNumber(c?.close) && c.close > 0) out.push(c.close);
  }
  return out;
}

export function normalizeMarketStatus(raw: unknown, fallback: MarketStatusInfo): MarketStatusInfo {
  const r = asRecord(raw);
  if (!r) return fallback;

  const session = toNonEmptyString(r.session) as MarketSessionStatus | null;
  const exchange = toNonEmptyString(r.exchange);

  return {
    session: session && VALID_SESSIONS.includes(session) ? session : fallback.session,
    exchange: exchange === 'BSE' ? 'BSE' : 'NSE',
    currentTimeIST: toNonEmptyString(r.currentTimeIST) ?? fallback.currentTimeIST,
    isOpen: typeof r.isOpen === 'boolean' ? r.isOpen : fallback.isOpen,
    message: toNonEmptyString(r.message) ?? fallback.message,
    nextSessionTime: toNonEmptyString(r.nextSessionTime) ?? fallback.nextSessionTime,
  };
}
