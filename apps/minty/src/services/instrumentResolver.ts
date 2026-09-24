/**
 * One authoritative way to turn "whatever the tapped card handed us" into a
 * normalized instrument plus the live catalog row for it.
 *
 * Before this existed each screen guessed its own identifier (sometimes the
 * `id`, sometimes `symbol`, sometimes a stale copy of the whole object), so a
 * detail screen could be looking at a different row than the portfolio was.
 * Symbol (upper-cased) is the identity across markets, watchlist, holdings,
 * orders and reports; `id` is only a list key.
 */
import { StockItem, StockHolding } from '../types';
import { toNonEmptyString } from '../utils/safeNumber';

export type AssetType = 'equity' | 'index' | 'etf';

/** The normalized instrument every screen agrees on. */
export interface Instrument {
  id: string;
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' | 'Global' | string;
  name: string;
  assetType: AssetType;
  providerInstrumentId: string;
  currency: 'INR';
  /** Indices are quoted but cannot be bought as a single share. */
  tradable: boolean;
}

/** Symbols that are benchmarks, not buyable instruments. */
const INDEX_SYMBOLS = new Set(['NIFTY 50', 'NIFTY50', 'SENSEX', 'BANKNIFTY', 'NIFTY BANK']);

export function isIndexSymbol(symbol: unknown): boolean {
  const s = toNonEmptyString(symbol);
  return s ? INDEX_SYMBOLS.has(s.toUpperCase()) : false;
}

/** Canonical lookup key. Returns null when there is no usable identity. */
export function instrumentKey(value: unknown): string | null {
  if (typeof value === 'string') {
    const s = value.trim();
    return s === '' ? null : s.toUpperCase();
  }
  if (value && typeof value === 'object') {
    const sym = toNonEmptyString((value as Record<string, unknown>).symbol);
    if (sym) return sym.toUpperCase();
  }
  return null;
}

export function toInstrument(stock: StockItem): Instrument {
  const symbol = stock.symbol.toUpperCase();
  const assetType: AssetType = isIndexSymbol(symbol) ? 'index' : 'equity';
  return {
    id: stock.id || `stock_${symbol}`,
    symbol,
    exchange: stock.exchange ?? 'NSE',
    name: stock.name || symbol,
    assetType,
    providerInstrumentId: symbol,
    currency: 'INR',
    tradable: assetType === 'equity',
  };
}

/** Finds the live catalog row for any identifier shape. Never throws. */
export function findStock(
  catalog: readonly StockItem[] | null | undefined,
  identifier: unknown
): StockItem | null {
  const key = instrumentKey(identifier);
  if (!key || !Array.isArray(catalog)) return null;
  for (const item of catalog) {
    const itemKey = instrumentKey(item);
    if (itemKey && itemKey === key) return item;
  }
  return null;
}

export function findHolding(
  holdings: readonly StockHolding[] | null | undefined,
  identifier: unknown
): StockHolding | null {
  const key = instrumentKey(identifier);
  if (!key || !Array.isArray(holdings)) return null;
  for (const h of holdings) {
    const hKey = instrumentKey(h);
    if (hKey && hKey === key) return h;
  }
  return null;
}

/** Why a detail screen could not be opened, so the UI can say something useful. */
export type ResolutionFailure = 'missing-parameter' | 'not-found';

export interface ResolvedInstrument {
  ok: true;
  instrument: Instrument;
  /** The live catalog row — re-read every render so prices stay current. */
  stock: StockItem;
  holding: StockHolding | null;
}

export interface UnresolvedInstrument {
  ok: false;
  reason: ResolutionFailure;
  /** The identifier we were handed, for the error message. */
  requested: string | null;
}

export type InstrumentResolution = ResolvedInstrument | UnresolvedInstrument;

/**
 * Resolves the parameters a stock-detail entry point was opened with.
 *
 * `params` may carry a whole (possibly stale) stock object, or just a symbol.
 * Either way the *live* catalog row wins, so the detail screen, the chart and
 * the portfolio all read the same prices. Falls back to the passed-in snapshot
 * only when the catalog has not loaded yet.
 */
export function resolveInstrument(
  params: unknown,
  catalog: readonly StockItem[] | null | undefined,
  holdings: readonly StockHolding[] | null | undefined
): InstrumentResolution {
  const p = params && typeof params === 'object' ? (params as Record<string, unknown>) : null;

  const snapshot =
    p && p.stock && typeof p.stock === 'object' ? (p.stock as StockItem) : null;

  const requested =
    instrumentKey(snapshot) ??
    instrumentKey(p?.symbol) ??
    instrumentKey(p?.stockId) ??
    instrumentKey(params);

  if (!requested) {
    return { ok: false, reason: 'missing-parameter', requested: null };
  }

  const live = findStock(catalog, requested);
  // A snapshot is only trustworthy if it carries a symbol and a usable price.
  const usableSnapshot =
    snapshot && instrumentKey(snapshot) && typeof snapshot.currentPrice === 'number'
      ? snapshot
      : null;
  const stock = live ?? usableSnapshot;

  if (!stock) {
    return { ok: false, reason: 'not-found', requested };
  }

  return {
    ok: true,
    instrument: toInstrument(stock),
    stock,
    holding: findHolding(holdings, requested),
  };
}
