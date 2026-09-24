import {
  IMarketDataProvider,
  LicensedMarketDataProvider,
} from './marketDataProvider';
import {
  MarketQuote,
  HistoricalCandle,
  CompanyFundamentals,
  MutualFundData,
  MarketStatusInfo,
  SimulatedOrderRequest,
  SimulatedOrderResult,
  SimulatedChargeBreakdown,
} from './types';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export class MarketDataService {
  private provider: IMarketDataProvider;
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor(provider?: IMarketDataProvider) {
    this.provider = provider || new LicensedMarketDataProvider();
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, cachedAt: Date.now(), ttlMs });
  }

  async getMarketStatus(): Promise<MarketStatusInfo> {
    const cacheKey = 'market_status';
    const cached = this.getFromCache<MarketStatusInfo>(cacheKey);
    if (cached) return cached;

    const status = await this.provider.getMarketStatus();
    this.setCache(cacheKey, status, 10000); // 10s TTL
    return status;
  }

  async getMarketOverview() {
    const cacheKey = 'market_overview';
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const overview = await this.provider.getMarketOverview();
    this.setCache(cacheKey, overview, 3000); // 3s TTL
    return overview;
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const cacheKey = `quote_${symbol.toUpperCase()}`;
    const cached = this.getFromCache<MarketQuote>(cacheKey);
    if (cached) return cached;

    const quote = await this.provider.getQuote(symbol);
    if (quote) {
      this.setCache(cacheKey, quote, 3000); // 3s TTL
    }
    return quote;
  }

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    return this.provider.getQuotes(symbols);
  }

  async getHistoricalCandles(symbol: string, timeframe: string): Promise<HistoricalCandle[]> {
    const cacheKey = `candles_${symbol.toUpperCase()}_${timeframe}`;
    const cached = this.getFromCache<HistoricalCandle[]>(cacheKey);
    if (cached) return cached;

    const candles = await this.provider.getHistoricalCandles(symbol, timeframe);
    this.setCache(cacheKey, candles, 30000); // 30s TTL
    return candles;
  }

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    const cacheKey = `fundamentals_${symbol.toUpperCase()}`;
    const cached = this.getFromCache<CompanyFundamentals>(cacheKey);
    if (cached) return cached;

    const fundamentals = await this.provider.getCompanyFundamentals(symbol);
    if (fundamentals) {
      this.setCache(cacheKey, fundamentals, 300000); // 5 min TTL
    }
    return fundamentals;
  }

  async searchInstruments(query: string): Promise<MarketQuote[]> {
    return this.provider.searchInstruments(query);
  }

  async getMutualFunds(): Promise<MutualFundData[]> {
    const cacheKey = 'mutual_funds';
    const cached = this.getFromCache<MutualFundData[]>(cacheKey);
    if (cached) return cached;

    const funds = await this.provider.getMutualFunds();
    this.setCache(cacheKey, funds, 60000); // 1 min TTL
    return funds;
  }

  /**
   * Calculates realistic Indian statutory simulated charges
   * (STT, Exchange transaction fee, SEBI turnover, GST, Stamp duty)
   */
  calculateSimulatedCharges(grossValue: number, isBuy: boolean): SimulatedChargeBreakdown {
    const brokerage = 0.0; // ₹0 brokerage educational platform
    const stt = parseFloat((grossValue * 0.001).toFixed(2)); // 0.1% STT on equity delivery
    const exchangeTurnover = parseFloat((grossValue * 0.0000345).toFixed(2)); // 0.00345% NSE txn charge
    const sebiTurnover = parseFloat((grossValue * 0.000001).toFixed(2)); // ₹10 per crore
    const stampDuty = isBuy ? parseFloat((grossValue * 0.00015).toFixed(2)) : 0.0; // 0.015% on buy
    const gst = parseFloat(((exchangeTurnover + sebiTurnover) * 0.18).toFixed(2)); // 18% GST on exchange & SEBI charges

    const totalCharges = parseFloat(
      (brokerage + stt + exchangeTurnover + sebiTurnover + stampDuty + gst).toFixed(2)
    );

    return {
      brokerage,
      stt,
      exchangeTurnover,
      sebiTurnover,
      stampDuty,
      gst,
      totalCharges,
    };
  }

  /**
   * Validates and executes a simulated virtual market order
   */
  async simulateOrder(req: SimulatedOrderRequest): Promise<SimulatedOrderResult> {
    const quote = await this.getQuote(req.symbol);
    const orderId = `VORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    if (!quote) {
      return {
        orderId,
        symbol: req.symbol,
        type: req.type,
        quantity: req.quantity,
        executionPrice: 0,
        grossValue: 0,
        charges: this.calculateSimulatedCharges(0, req.type === 'BUY'),
        netTotalCost: 0,
        remainingCash: req.virtualCashAvailable,
        status: 'REJECTED',
        timestamp: now,
        marketDataTimestamp: now,
        statusReason: `Instrument ${req.symbol} not found on virtual exchange.`,
      };
    }

    const executionPrice = quote.currentPrice;
    const grossValue = parseFloat((executionPrice * req.quantity).toFixed(2));
    const isBuy = req.type === 'BUY';
    const charges = this.calculateSimulatedCharges(grossValue, isBuy);
    const netTotalCost = isBuy
      ? parseFloat((grossValue + charges.totalCharges).toFixed(2))
      : parseFloat((grossValue - charges.totalCharges).toFixed(2));

    if (isBuy && req.virtualCashAvailable < netTotalCost) {
      return {
        orderId,
        symbol: req.symbol,
        type: req.type,
        quantity: req.quantity,
        executionPrice,
        grossValue,
        charges,
        netTotalCost,
        remainingCash: req.virtualCashAvailable,
        status: 'REJECTED',
        timestamp: now,
        marketDataTimestamp: quote.lastTradedTime,
        statusReason: `Insufficient virtual cash. Required ₹${netTotalCost.toLocaleString('en-IN')}, Available ₹${req.virtualCashAvailable.toLocaleString('en-IN')}.`,
      };
    }

    const remainingCash = isBuy
      ? parseFloat((req.virtualCashAvailable - netTotalCost).toFixed(2))
      : parseFloat((req.virtualCashAvailable + netTotalCost).toFixed(2));

    return {
      orderId,
      symbol: req.symbol,
      type: req.type,
      quantity: req.quantity,
      executionPrice,
      grossValue,
      charges,
      netTotalCost,
      remainingCash,
      status: 'EXECUTED',
      timestamp: now,
      marketDataTimestamp: quote.lastTradedTime,
      statusReason: 'Simulated market order successfully executed at live market price.',
    };
  }
}
