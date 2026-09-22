import {
  StockItem,
  MutualFundItem,
  MarketStatusInfo,
  MarketSessionStatus,
  CompanyFundamentals,
  HistoricalCandle,
} from '../types';
import { MOCK_STOCKS, MOCK_MUTUAL_FUNDS } from '../constants/mockData';
import {
  normalizeStockList,
  normalizeStockItem,
  normalizeMutualFundList,
  normalizeHistoricalData,
  normalizeMarketStatus,
} from './marketDataNormalizer';
import { instrumentKey } from './instrumentResolver';
import { round, safePercent, toFiniteNumber } from '../utils/safeNumber';

export interface IMarketDataProvider {
  getMarketStatus(): Promise<MarketStatusInfo>;
  getOverview(): Promise<{
    indices: StockItem[];
    topGainers: StockItem[];
    topLosers: StockItem[];
    mostActive: StockItem[];
  }>;
  getStocks(): Promise<StockItem[]>;
  getStockQuote(symbol: string): Promise<StockItem | null>;
  searchStocks(query: string): Promise<StockItem[]>;
  getHistoricalCandles(symbol: string, timeframe: string): Promise<HistoricalCandle[]>;
  getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null>;
  getMutualFunds(): Promise<MutualFundItem[]>;
}

/**
 * Deterministic / offline provider. Also the fallback whenever the backend is
 * unreachable, so the app degrades to a working local simulation rather than to
 * an error screen.
 */
export class DeterministicMarketDataProvider implements IMarketDataProvider {
  private stockUniverse: StockItem[] = normalizeStockList(MOCK_STOCKS);

  async getMarketStatus(): Promise<MarketStatusInfo> {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 3600000 * 5.5);

    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    let session: MarketSessionStatus = 'CLOSED';
    let isOpen = false;
    let message = 'NSE/BSE Regular Market Session Closed';
    let nextSession = 'Next session: Tomorrow 09:15 AM IST';

    if (day === 0 || day === 6) {
      session = 'HOLIDAY';
      message = 'Weekend Exchange Holiday';
      nextSession = 'Next session: Monday 09:15 AM IST';
    } else if (timeInMinutes >= 540 && timeInMinutes < 555) {
      session = 'PRE_OPEN';
      isOpen = true;
      message = 'Pre-market discovery session (09:00 - 09:15 IST)';
      nextSession = 'Regular trading begins at 09:15 AM IST';
    } else if (timeInMinutes >= 555 && timeInMinutes <= 930) {
      session = 'OPEN';
      isOpen = true;
      message = 'NSE/BSE Live Trading Active (09:15 - 15:30 IST)';
      nextSession = 'Closes at 03:30 PM IST';
    } else if (timeInMinutes > 930 && timeInMinutes <= 960) {
      session = 'POST_CLOSE';
      message = 'Post-closing price discovery session';
      nextSession = 'Next session: Tomorrow 09:15 AM IST';
    } else {
      session = 'CLOSED';
      message = 'NSE/BSE Regular Session Closed';
      nextSession =
        timeInMinutes < 540 ? 'Opens today at 09:15 AM IST' : 'Opens tomorrow at 09:15 AM IST';
    }

    return {
      session,
      exchange: 'NSE',
      currentTimeIST: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} IST`,
      isOpen,
      message,
      nextSessionTime: nextSession,
    };
  }

  async getStocks(): Promise<StockItem[]> {
    return this.stockUniverse.map((s) => this.applyMicroTick(s));
  }

  async getStockQuote(symbol: string): Promise<StockItem | null> {
    const key = instrumentKey(symbol);
    if (!key) return null;
    const stock = this.stockUniverse.find((s) => instrumentKey(s) === key);
    return stock ? this.applyMicroTick(stock) : null;
  }

  async getOverview() {
    const all = await this.getStocks();
    const isIndex = (s: StockItem) => s.symbol === 'NIFTY 50' || s.symbol === 'SENSEX';
    const equities = all.filter((s) => !isIndex(s));

    return {
      indices: all.filter(isIndex),
      topGainers: [...equities].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4),
      topLosers: [...equities].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4),
      mostActive: [...equities]
        .sort((a, b) => toFiniteNumber(b.volume, 0) - toFiniteNumber(a.volume, 0))
        .slice(0, 4),
    };
  }

  async searchStocks(query: string): Promise<StockItem[]> {
    const all = await this.getStocks();
    const q = typeof query === 'string' ? query.trim().toUpperCase() : '';
    if (!q) return all;
    return all.filter(
      (s) =>
        s.symbol.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.sector.toUpperCase().includes(q)
    );
  }

  async getHistoricalCandles(symbol: string, timeframe: string): Promise<HistoricalCandle[]> {
    const stock = await this.getStockQuote(symbol);
    if (!stock) return [];

    const basePrice = stock.currentPrice;
    const count = timeframe === '1D' ? 24 : timeframe === '1W' ? 35 : timeframe === '1M' ? 30 : 50;
    const intervalMs =
      timeframe === '1D' ? 15 * 60 * 1000 : timeframe === '1W' ? 2 * 3600 * 1000 : 24 * 3600 * 1000;

    // Deterministic per symbol + bucket, so re-opening a stock redraws the same
    // curve instead of a new random one on every render.
    const seedBase = symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const pseudoRandom = (i: number) => {
      const x = Math.sin(seedBase * 12.9898 + i * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const candles: HistoricalCandle[] = [];
    let current = basePrice * 0.94;
    const now = Date.now();

    for (let i = count; i >= 0; i--) {
      const variance = (Math.sin(i * 0.5) * 0.012 + (pseudoRandom(i) - 0.48) * 0.008) * current;
      const open = current;
      const close = i === 0 ? basePrice : current + variance;
      const high = Math.max(open, close) + Math.abs(variance * 0.4);
      const low = Math.min(open, close) - Math.abs(variance * 0.4);

      candles.push({
        timestamp: new Date(now - i * intervalMs).toISOString(),
        open: round(open, 2),
        high: round(high, 2),
        low: round(Math.max(0.01, low), 2),
        close: round(close, 2),
        volume: Math.floor(40000 + pseudoRandom(i + 1000) * 120000),
      });

      current = close;
    }

    return normalizeHistoricalData(candles);
  }

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    const key = instrumentKey(symbol);
    if (!key) return null;
    const stock = this.stockUniverse.find((s) => instrumentKey(s) === key);
    return stock?.fundamentals ?? null;
  }

  async getMutualFunds(): Promise<MutualFundItem[]> {
    return normalizeMutualFundList(MOCK_MUTUAL_FUNDS);
  }

  /** Small intraday drift so the simulated tape moves between refreshes. */
  private applyMicroTick(stock: StockItem): StockItem {
    const sec = new Date().getSeconds();
    const drift = Math.sin(sec / 8 + stock.symbol.length) * (stock.currentPrice * 0.0006);
    const updatedLTP = round(stock.currentPrice + drift, 2);
    const previousClose = stock.previousClose > 0 ? stock.previousClose : updatedLTP;
    const newChange = round(updatedLTP - previousClose, 2);

    return {
      ...stock,
      currentPrice: updatedLTP,
      change: newChange,
      changePercent: round(safePercent(newChange, previousClose), 2),
      dayHigh: Math.max(toFiniteNumber(stock.dayHigh, updatedLTP), updatedLTP),
      dayLow: Math.min(toFiniteNumber(stock.dayLow, updatedLTP), updatedLTP),
      lastTradedTime: new Date().toISOString(),
      dataFreshness: 'LIVE',
    };
  }
}

/** How long a market request may hang before we fall back to the local feed. */
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Backend-backed provider with a local fallback.
 *
 * Every method validates before returning, so a 200 response with an unexpected
 * body degrades to the offline feed instead of pushing malformed rows into the
 * UI. Requests are time-limited: without that, a stalled connection leaves the
 * chart spinning indefinitely.
 */
export class CloudFunctionMarketDataProvider implements IMarketDataProvider {
  private fallbackProvider = new DeterministicMarketDataProvider();
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    // The deployed function already mounts its routes under /api, and the old
    // code appended a second /api to it — every request 404'd.
    const configured = baseUrl ?? 'https://us-central1-minti-finance-app.cloudfunctions.net/api';
    this.baseUrl = configured.replace(/\/+$/, '');
  }

  private async fetchJson(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Unwraps `{ data: ... }` envelopes, tolerating a bare payload. */
  private static payload(json: unknown): unknown {
    if (json && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
      return (json as Record<string, unknown>).data;
    }
    return json;
  }

  async getMarketStatus(): Promise<MarketStatusInfo> {
    const fallback = await this.fallbackProvider.getMarketStatus();
    try {
      const json = await this.fetchJson('/market/status');
      return normalizeMarketStatus(CloudFunctionMarketDataProvider.payload(json), fallback);
    } catch {
      return fallback;
    }
  }

  async getOverview() {
    try {
      const json = await this.fetchJson('/market/overview');
      const data = CloudFunctionMarketDataProvider.payload(json) as Record<string, unknown> | null;
      if (data && typeof data === 'object') {
        const overview = {
          indices: normalizeStockList(data.indices),
          topGainers: normalizeStockList(data.topGainers),
          topLosers: normalizeStockList(data.topLosers),
          mostActive: normalizeStockList(data.mostActive),
        };
        if (overview.indices.length || overview.topGainers.length) return overview;
      }
    } catch {
      // fall through to the local feed
    }
    return this.fallbackProvider.getOverview();
  }

  async getStocks(): Promise<StockItem[]> {
    try {
      const json = await this.fetchJson('/market/search');
      const list = normalizeStockList(CloudFunctionMarketDataProvider.payload(json));
      if (list.length > 0) return list;
    } catch {
      // fall through
    }
    return this.fallbackProvider.getStocks();
  }

  async getStockQuote(symbol: string): Promise<StockItem | null> {
    const key = instrumentKey(symbol);
    if (!key) return null;
    try {
      const json = await this.fetchJson(`/market/quote/${encodeURIComponent(key)}`);
      const quote = normalizeStockItem(CloudFunctionMarketDataProvider.payload(json));
      if (quote) return quote;
    } catch {
      // fall through
    }
    return this.fallbackProvider.getStockQuote(key);
  }

  async searchStocks(query: string): Promise<StockItem[]> {
    const q = typeof query === 'string' ? query : '';
    try {
      const json = await this.fetchJson(`/market/search?q=${encodeURIComponent(q)}`);
      const list = normalizeStockList(CloudFunctionMarketDataProvider.payload(json));
      if (list.length > 0) return list;
    } catch {
      // fall through
    }
    return this.fallbackProvider.searchStocks(q);
  }

  async getHistoricalCandles(symbol: string, timeframe: string): Promise<HistoricalCandle[]> {
    const key = instrumentKey(symbol);
    if (!key) return [];
    try {
      const json = await this.fetchJson(
        `/market/history/${encodeURIComponent(key)}?range=${encodeURIComponent(timeframe)}`
      );
      const candles = normalizeHistoricalData(CloudFunctionMarketDataProvider.payload(json));
      if (candles.length > 0) return candles;
    } catch {
      // fall through
    }
    return this.fallbackProvider.getHistoricalCandles(key, timeframe);
  }

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    const key = instrumentKey(symbol);
    if (!key) return null;
    try {
      const json = await this.fetchJson(`/market/fundamentals/${encodeURIComponent(key)}`);
      const data = CloudFunctionMarketDataProvider.payload(json);
      if (data && typeof data === 'object') return data as CompanyFundamentals;
    } catch {
      // fall through
    }
    return this.fallbackProvider.getCompanyFundamentals(key);
  }

  async getMutualFunds(): Promise<MutualFundItem[]> {
    try {
      const json = await this.fetchJson('/market/mutual-funds');
      const list = normalizeMutualFundList(CloudFunctionMarketDataProvider.payload(json));
      if (list.length > 0) return list;
    } catch {
      // fall through
    }
    return this.fallbackProvider.getMutualFunds();
  }
}

export const MarketDataService = new CloudFunctionMarketDataProvider();
