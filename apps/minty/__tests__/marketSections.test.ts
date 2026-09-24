import {
  MarketSections,
  PROVIDER_CAPABILITIES,
  TRADING_SCREENS,
  capSegmentOf,
  parseMarketCapCr,
  invalidateMarketCache,
} from '../src/services/marketSections';
import { StockItem } from '../src/types';
import { MarketDataService } from '../src/services/marketDataService';

function stock(overrides: Partial<StockItem>): StockItem {
  return {
    id: `id_${overrides.symbol}`,
    symbol: 'TEST',
    name: 'Test Co',
    exchange: 'NSE',
    sector: 'Information Technology',
    currentPrice: 100,
    previousClose: 100,
    changePercent: 0,
    risk: 'Moderate',
    description: '',
    marketCap: '₹50,000 Cr',
    peRatio: 20,
    dividendYield: 1,
    sparkline: [99, 100],
    historical1D: [99, 100],
    historical1W: [99, 100],
    historical1M: [99, 100],
    historical1Y: [99, 100],
    ...overrides,
  } as StockItem;
}

const universe: StockItem[] = [
  stock({ symbol: 'BIGUP', marketCap: '₹5.2 Lakh Cr', changePercent: 6.2, volume: 900000, dayHigh: 110, dayLow: 100 }),
  stock({ symbol: 'BIGDOWN', marketCap: '₹3.1 Lakh Cr', changePercent: -4.4, volume: 700000, dayHigh: 101, dayLow: 95 }),
  stock({ symbol: 'SMALLUP', marketCap: '₹8,000 Cr', changePercent: 3.1, volume: 400000, dayHigh: 104, dayLow: 100, sector: 'Automobile' }),
  stock({ symbol: 'SMALLDOWN', marketCap: '₹4,500 Cr', changePercent: -2.2, volume: 200000, dayHigh: 100, dayLow: 97, sector: 'Automobile' }),
  stock({ symbol: 'FLAT', marketCap: 'Not available', changePercent: 0, volume: 100000 }),
  // An index must never appear in equity sections.
  stock({ symbol: 'NIFTY 50', marketCap: '₹175 Lakh Cr', changePercent: 1.1, sector: 'Benchmark Index' }),
];

beforeEach(() => {
  invalidateMarketCache();
  jest.spyOn(MarketDataService, 'getStocks').mockResolvedValue(universe);
});

afterEach(() => {
  jest.restoreAllMocks();
  invalidateMarketCache();
});

describe('parseMarketCapCr', () => {
  it('parses both maintained formats', () => {
    expect(parseMarketCapCr('₹1.42 Lakh Cr')).toBe(142000);
    expect(parseMarketCapCr('₹50,000 Cr')).toBe(50000);
  });

  it('returns null rather than guessing', () => {
    expect(parseMarketCapCr('Not available')).toBeNull();
    expect(parseMarketCapCr('Live Market Instrument')).toBeNull();
    expect(parseMarketCapCr(undefined)).toBeNull();
    expect(parseMarketCapCr('')).toBeNull();
  });
});

describe('capSegmentOf', () => {
  it('segments on maintained metadata only', () => {
    expect(capSegmentOf(stock({ marketCap: '₹5.2 Lakh Cr' }))).toBe('large');
    expect(capSegmentOf(stock({ marketCap: '₹40,000 Cr' }))).toBe('mid');
    expect(capSegmentOf(stock({ marketCap: '₹8,000 Cr' }))).toBe('small');
    // Unknown size must not be inferred from price.
    expect(capSegmentOf(stock({ marketCap: 'Not available', currentPrice: 5 }))).toBe('unknown');
  });
});

describe('sections backed by real data', () => {
  it('ranks gainers and losers by actual change, excluding indices', () => {
    return MarketSections.getTopMovers('gainers').then((res) => {
      expect(res.status).toBe('ok');
      expect(res.data[0].stock.symbol).toBe('BIGUP');
      expect(res.data.every((r) => r.changePercent > 0)).toBe(true);
      expect(res.data.some((r) => r.stock.symbol === 'NIFTY 50')).toBe(false);
    });
  });

  it('ranks losers most-negative first', async () => {
    const res = await MarketSections.getTopMovers('losers');
    expect(res.data[0].stock.symbol).toBe('BIGDOWN');
    expect(res.data.every((r) => r.changePercent < 0)).toBe(true);
  });

  it('segments movers by cap band', async () => {
    const large = await MarketSections.getTopMovers('gainers', 'large');
    expect(large.data.map((r) => r.stock.symbol)).toEqual(['BIGUP']);

    const small = await MarketSections.getTopMovers('gainers', 'small');
    expect(small.data.map((r) => r.stock.symbol)).toEqual(['SMALLUP']);
  });

  it('computes intraday range from real day high/low', async () => {
    const res = await MarketSections.getTopIntraday();
    expect(res.status).toBe('ok');
    // BIGUP moved 100 -> 110, the widest range in the universe.
    expect(res.data[0].stock.symbol).toBe('BIGUP');
    expect(res.data[0].rangePercent).toBeCloseTo(10, 1);
    // Instruments with no intraday prices are skipped, not defaulted.
    expect(res.data.some((r) => r.stock.symbol === 'FLAT')).toBe(false);
  });

  it('aggregates sectors from constituent quotes', async () => {
    const res = await MarketSections.getSectors();
    expect(res.status).toBe('ok');
    const auto = res.data.find((r) => r.sector === 'Automobile');
    expect(auto).toBeDefined();
    expect(auto!.instruments).toBe(2);
    expect(auto!.advancing).toBe(1);
    expect(auto!.declining).toBe(1);
  });

  it('runs every trading screen without throwing', async () => {
    for (const screen of TRADING_SCREENS) {
      const res = await MarketSections.runScreen(screen.id);
      expect(['ok', 'unavailable', 'error']).toContain(res.status);
      expect(Array.isArray(res.data)).toBe(true);
    }
  });
});

describe('sections the provider cannot supply', () => {
  it('reports unavailable instead of inventing a ranking', async () => {
    for (const load of [MarketSections.getMostBought(), MarketSections.getMostBoughtMTF()]) {
      const res = await load;
      expect(res.status).toBe('unavailable');
      expect(res.data).toEqual([]);
      expect(typeof res.reason).toBe('string');
      expect((res.reason ?? '').length).toBeGreaterThan(10);
    }
  });

  it('declares order flow and MTF as absent, ETFs and news as available', () => {
    expect(PROVIDER_CAPABILITIES.orderFlow).toBe(false);
    expect(PROVIDER_CAPABILITIES.mtf).toBe(false);
    expect(PROVIDER_CAPABILITIES.etfUniverse).toBe(true);
    expect(PROVIDER_CAPABILITIES.news).toBe(true);
  });

  it('serves real ETF quotes rather than an empty panel', async () => {
    jest.spyOn(MarketDataService, 'getStockQuote').mockImplementation(async (sym) =>
      stock({ symbol: sym.toUpperCase(), currentPrice: 250, volume: 100000, changePercent: 0.5 })
    );
    const res = await MarketSections.getMostBoughtETFs(5);
    expect(res.status).toBe('ok');
    expect(res.data.length).toBeGreaterThan(0);
    // Named ETFs, ranked by a real traded-volume figure.
    expect(res.data.every((r) => typeof r.category === 'string' && r.volume >= 0)).toBe(true);
  });

  it('drops ETFs the feed cannot price instead of showing a blank row', async () => {
    jest.spyOn(MarketDataService, 'getStockQuote').mockResolvedValue(null);
    const res = await MarketSections.getMostBoughtETFs(5);
    expect(res.status).toBe('unavailable');
    expect(res.data).toEqual([]);
  });

  it('does not substitute volume for buy-side order flow', async () => {
    const mostBought = await MarketSections.getMostBought();
    const highVolume = await MarketSections.runScreen('high-volume');
    // If "most bought" were faked from volume it would mirror this screen.
    expect(mostBought.data).toEqual([]);
    expect(highVolume.data.length).toBeGreaterThan(0);
  });
});

describe('resilience', () => {
  it('surfaces an error state when the feed throws', async () => {
    jest.spyOn(MarketDataService, 'getStocks').mockRejectedValue(new Error('network down'));
    invalidateMarketCache();
    const res = await MarketSections.getTopMovers('gainers');
    expect(res.status).toBe('error');
    expect(res.data).toEqual([]);
  });

  it('tolerates a malformed quote list', async () => {
    jest
      .spyOn(MarketDataService, 'getStocks')
      .mockResolvedValue([null, undefined, {}, 'junk'] as unknown as StockItem[]);
    invalidateMarketCache();
    const res = await MarketSections.getTopMovers('gainers');
    expect(res.status).toBe('ok');
    expect(res.data).toEqual([]);
  });

  it('shares one quote fetch across concurrent sections', async () => {
    const spy = jest.spyOn(MarketDataService, 'getStocks').mockResolvedValue(universe);
    invalidateMarketCache();
    await Promise.all([
      MarketSections.getTopMovers('gainers'),
      MarketSections.getTopIntraday(),
      MarketSections.getSectors(),
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
