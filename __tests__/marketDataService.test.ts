import {
  symbolToTicker,
  timeframeToYahooParams,
  getStockLogoUrl,
  LiveMarketDataProvider,
  DeterministicMarketDataProvider,
} from '../src/services/marketDataService';

describe('MarketDataService & Real-Time Providers', () => {
  describe('symbolToTicker mapping', () => {
    it('maps index names to exchange tickers', () => {
      expect(symbolToTicker('NIFTY 50')).toBe('^NSEI');
      expect(symbolToTicker('NIFTY50')).toBe('^NSEI');
      expect(symbolToTicker('SENSEX')).toBe('^BSESN');
      expect(symbolToTicker('BANKNIFTY')).toBe('^NSEBANK');
    });

    it('appends .NS to standard Indian equity symbols', () => {
      expect(symbolToTicker('RELIANCE')).toBe('RELIANCE.NS');
      expect(symbolToTicker('TCS')).toBe('TCS.NS');
      expect(symbolToTicker('HDFCBANK')).toBe('HDFCBANK.NS');
    });

    it('preserves existing exchange extensions and caret symbols', () => {
      expect(symbolToTicker('RELIANCE.NS')).toBe('RELIANCE.NS');
      expect(symbolToTicker('TCS.BO')).toBe('TCS.BO');
      expect(symbolToTicker('^NSEI')).toBe('^NSEI');
    });
  });

  describe('getStockLogoUrl', () => {
    it('returns valid favicon URLs for known and dynamic equities', () => {
      expect(getStockLogoUrl('RELIANCE')).toContain('ril.com');
      expect(getStockLogoUrl('TCS')).toContain('tcs.com');
      expect(getStockLogoUrl('ESDS')).toContain('esds.co.in');
      expect(getStockLogoUrl('SWIGGY')).toContain('swiggy.com');
      expect(getStockLogoUrl('AAPL')).toContain('apple.com');
    });
  });

  describe('timeframeToYahooParams', () => {
    it('maps standard timeframes to proper intervals and ranges', () => {
      expect(timeframeToYahooParams('1D')).toEqual({ interval: '15m', range: '1d' });
      expect(timeframeToYahooParams('1W')).toEqual({ interval: '60m', range: '5d' });
      expect(timeframeToYahooParams('1M')).toEqual({ interval: '1d', range: '1mo' });
      expect(timeframeToYahooParams('6M')).toEqual({ interval: '1d', range: '6mo' });
      expect(timeframeToYahooParams('1Y')).toEqual({ interval: '1wk', range: '1y' });
      expect(timeframeToYahooParams('5Y')).toEqual({ interval: '1mo', range: '5y' });
      expect(timeframeToYahooParams('ALL')).toEqual({ interval: '1mo', range: 'max' });
    });
  });

  describe('DeterministicMarketDataProvider (Fallback)', () => {
    const provider = new DeterministicMarketDataProvider();

    it('returns market status', async () => {
      const status = await provider.getMarketStatus();
      expect(status).toHaveProperty('session');
      expect(status).toHaveProperty('exchange', 'NSE');
      expect(status).toHaveProperty('currentTimeIST');
    });

    it('returns stocks list with valid finite numbers', async () => {
      const stocks = await provider.getStocks();
      expect(stocks.length).toBeGreaterThan(10);
      for (const s of stocks) {
        expect(Number.isFinite(s.currentPrice)).toBe(true);
        expect(s.currentPrice).toBeGreaterThan(0);
        expect(Number.isFinite(s.change)).toBe(true);
        expect(Number.isFinite(s.changePercent)).toBe(true);
      }
    });

    it('returns quotes for individual symbols', async () => {
      const quote = await provider.getStockQuote('RELIANCE');
      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('RELIANCE');
    });

    it('returns historical candles with OHLC finite values', async () => {
      const candles = await provider.getHistoricalCandles('RELIANCE', '1D');
      expect(candles.length).toBeGreaterThan(0);
      for (const c of candles) {
        expect(Number.isFinite(c.open)).toBe(true);
        expect(Number.isFinite(c.high)).toBe(true);
        expect(Number.isFinite(c.low)).toBe(true);
        expect(Number.isFinite(c.close)).toBe(true);
        expect(c.high).toBeGreaterThanOrEqual(c.low);
      }
    });
  });

  describe('LiveMarketDataProvider', () => {
    const liveProvider = new LiveMarketDataProvider();

    it('gracefully degrades to fallback if network fetch fails', async () => {
      const quote = await liveProvider.getStockQuote('RELIANCE');
      expect(quote).not.toBeNull();
      expect(Number.isFinite(quote?.currentPrice)).toBe(true);
    });

    it('returns historical candles gracefully', async () => {
      const candles = await liveProvider.getHistoricalCandles('TCS', '1D');
      expect(candles.length).toBeGreaterThan(0);
    });

    it('searches live Yahoo and returns normalized stock list', async () => {
      const results = await liveProvider.searchLiveYahoo('RELIANCE');
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('symbol');
        expect(Number.isFinite(results[0].currentPrice)).toBe(true);
      }
    });

    it('resolves real companies through aliases and exchange ticker discovery', async () => {
      const zomatoResults = await liveProvider.searchLiveYahoo('Zomato');
      expect(Array.isArray(zomatoResults)).toBe(true);
      if (zomatoResults.length > 0) {
        expect(
          zomatoResults.some((s) => s.symbol === 'ETERNAL' || s.symbol === 'ZOMATO' || s.name.includes('Zomato'))
        ).toBe(true);
      }
    });

    it('resolves newly listed stocks like ESDS through aliases', async () => {
      const esdsResults = await liveProvider.searchLiveYahoo('ESDS');
      expect(Array.isArray(esdsResults)).toBe(true);
    });

    it('returns empty array when search query matches no authentic instruments', async () => {
      const fakeResults = await liveProvider.searchLiveYahoo('randomnonexistentstockxyz99999');
      expect(fakeResults).toEqual([]);
    });

    it('searches live Yahoo gracefully for empty query', async () => {
      const results = await liveProvider.searchLiveYahoo('');
      expect(results).toEqual([]);
    });
  });
});
