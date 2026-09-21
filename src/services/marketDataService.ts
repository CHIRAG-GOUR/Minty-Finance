import {
  StockItem,
  MutualFundItem,
  MarketStatusInfo,
  MarketSessionStatus,
  CompanyFundamentals,
  HistoricalCandle,
} from '../types';
import { MOCK_STOCKS, MOCK_MUTUAL_FUNDS } from '../constants/mockData';

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
 * Deterministic / Offline Fallback Provider for resilient local testing and offline modes
 */
export class DeterministicMarketDataProvider implements IMarketDataProvider {
  private stockUniverse: StockItem[] = [...MOCK_STOCKS];

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
      isOpen = false;
      message = 'Weekend Exchange Holiday';
      nextSession = 'Next session: Monday 09:15 AM IST';
    } else {
      if (timeInMinutes >= 540 && timeInMinutes < 555) {
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
        isOpen = false;
        message = 'Post-closing price discovery session';
        nextSession = 'Next session: Tomorrow 09:15 AM IST';
      } else {
        session = 'CLOSED';
        isOpen = false;
        message = 'NSE/BSE Regular Session Closed';
        nextSession = timeInMinutes < 540 ? 'Opens today at 09:15 AM IST' : 'Opens tomorrow at 09:15 AM IST';
      }
    }

    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} IST`;

    return {
      session,
      exchange: 'NSE',
      currentTimeIST: timeString,
      isOpen,
      message,
      nextSessionTime: nextSession,
    };
  }

  async getStocks(): Promise<StockItem[]> {
    return this.stockUniverse.map((s) => this.applyMicroTick(s));
  }

  async getStockQuote(symbol: string): Promise<StockItem | null> {
    const stock = this.stockUniverse.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) return null;
    return this.applyMicroTick(stock);
  }

  async getOverview() {
    const all = await this.getStocks();
    const indices = all.filter((s) => s.symbol === 'NIFTY 50' || s.symbol === 'SENSEX');
    const equities = all.filter((s) => s.symbol !== 'NIFTY 50' && s.symbol !== 'SENSEX');

    const topGainers = [...equities].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
    const topLosers = [...equities].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
    const mostActive = [...equities].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 4);

    return { indices, topGainers, topLosers, mostActive };
  }

  async searchStocks(query: string): Promise<StockItem[]> {
    const q = query.trim().toUpperCase();
    const all = await this.getStocks();
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
    const basePrice = stock ? stock.currentPrice : 1000;
    const count = timeframe === '1D' ? 24 : timeframe === '1W' ? 35 : timeframe === '1M' ? 30 : 50;

    const candles: HistoricalCandle[] = [];
    let current = basePrice * 0.94;
    const now = Date.now();
    const intervalMs =
      timeframe === '1D'
        ? 15 * 60 * 1000
        : timeframe === '1W'
        ? 2 * 3600 * 1000
        : 24 * 3600 * 1000;

    for (let i = count; i >= 0; i--) {
      const time = new Date(now - i * intervalMs).toISOString();
      const variance = (Math.sin(i * 0.5) * 0.012 + (Math.random() - 0.48) * 0.008) * current;
      const open = current;
      const close = i === 0 && stock ? stock.currentPrice : current + variance;
      const high = Math.max(open, close) + Math.abs(variance * 0.4);
      const low = Math.min(open, close) - Math.abs(variance * 0.4);
      const volume = Math.floor(40000 + Math.random() * 120000);

      candles.push({
        timestamp: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      });

      current = close;
    }

    return candles;
  }

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    const stock = this.stockUniverse.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock || !stock.fundamentals) return null;
    return stock.fundamentals;
  }

  async getMutualFunds(): Promise<MutualFundItem[]> {
    return MOCK_MUTUAL_FUNDS;
  }

  private applyMicroTick(stock: StockItem): StockItem {
    const now = new Date();
    const sec = now.getSeconds();
    const drift = Math.sin(sec / 8 + stock.symbol.length) * (stock.currentPrice * 0.0006);
    const updatedLTP = parseFloat((stock.currentPrice + drift).toFixed(2));
    const newChange = parseFloat((updatedLTP - stock.previousClose).toFixed(2));
    const newChangePercent = parseFloat(((newChange / stock.previousClose) * 100).toFixed(2));

    return {
      ...stock,
      currentPrice: updatedLTP,
      change: newChange,
      changePercent: newChangePercent,
      dayHigh: Math.max(stock.dayHigh || updatedLTP, updatedLTP),
      dayLow: Math.min(stock.dayLow || updatedLTP, updatedLTP),
      lastTradedTime: now.toISOString(),
      dataFreshness: 'LIVE',
    };
  }
}

/**
 * Cloud Function Market Data Provider
 * Connects to the Minti Cloud Function API with local fallback
 */
export class CloudFunctionMarketDataProvider implements IMarketDataProvider {
  private fallbackProvider: DeterministicMarketDataProvider;
  private backendBaseUrl: string;

  constructor(baseUrl?: string) {
    this.fallbackProvider = new DeterministicMarketDataProvider();
    // Default Cloud Function URL / local emulator URL
    this.backendBaseUrl =
      baseUrl ||
      'https://us-central1-minti-finance-app.cloudfunctions.net/api' ||
      'http://10.0.2.2:5001/minti-finance-app/us-central1/api';
  }

  async getMarketStatus(): Promise<MarketStatusInfo> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/status`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getMarketStatus();
    }
  }

  async getOverview() {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/overview`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getOverview();
    }
  }

  async getStocks(): Promise<StockItem[]> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/search`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getStocks();
    }
  }

  async getStockQuote(symbol: string): Promise<StockItem | null> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/quote/${encodeURIComponent(symbol)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getStockQuote(symbol);
    }
  }

  async searchStocks(query: string): Promise<StockItem[]> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.searchStocks(query);
    }
  }

  async getHistoricalCandles(symbol: string, timeframe: string): Promise<HistoricalCandle[]> {
    try {
      const response = await fetch(
        `${this.backendBaseUrl}/api/market/history/${encodeURIComponent(symbol)}?range=${encodeURIComponent(timeframe)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data.candles;
    } catch {
      return this.fallbackProvider.getHistoricalCandles(symbol, timeframe);
    }
  }

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/fundamentals/${encodeURIComponent(symbol)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getCompanyFundamentals(symbol);
    }
  }

  async getMutualFunds(): Promise<MutualFundItem[]> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/market/mutual-funds`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return json.data;
    } catch {
      return this.fallbackProvider.getMutualFunds();
    }
  }
}

// Export singleton instance of MarketDataService
export const MarketDataService = new CloudFunctionMarketDataProvider();
