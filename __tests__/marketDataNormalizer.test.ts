import {
  candlesToCloseSeries,
  normalizeHistoricalData,
  normalizeMarketStatus,
  normalizeMutualFundList,
  normalizeQuote,
  normalizeStockItem,
  normalizeStockList,
  validateCandle,
} from '../src/services/marketDataNormalizer';
import { MarketStatusInfo } from '../src/types';

const goodQuote = {
  id: 'stock_reliance',
  symbol: 'RELIANCE',
  name: 'Reliance Industries',
  exchange: 'NSE',
  sector: 'Energy',
  currentPrice: 2500,
  previousClose: 2450,
  changePercent: 2.04,
  risk: 'Low',
  marketCap: '₹17 Lakh Cr',
  peRatio: 24.5,
  dividendYield: 0.9,
  description: 'Energy and retail conglomerate.',
  sparkline: [2400, 2450, 2500],
  historical1D: [2440, 2470, 2500],
  historical1W: [2380, 2450, 2500],
  historical1M: [2300, 2400, 2500],
  historical1Y: [2000, 2250, 2500],
};

describe('normalizeQuote', () => {
  it('accepts a well-formed quote', () => {
    const q = normalizeQuote(goodQuote);
    expect(q).not.toBeNull();
    expect(q!.symbol).toBe('RELIANCE');
    expect(q!.isPriced).toBe(true);
  });

  it('rejects rows with no identity', () => {
    expect(normalizeQuote(null)).toBeNull();
    expect(normalizeQuote({})).toBeNull();
    expect(normalizeQuote({ currentPrice: 100 })).toBeNull();
    expect(normalizeQuote('RELIANCE')).toBeNull();
    expect(normalizeQuote([])).toBeNull();
  });

  it('marks a quote with no usable price as unpriced instead of NaN', () => {
    const q = normalizeQuote({ symbol: 'X', currentPrice: null });
    expect(q!.isPriced).toBe(false);
    expect(q!.price).toBeNull();
    expect(Number.isNaN(q!.price as number)).toBe(false);
  });

  it('derives change and percent when the provider omits them', () => {
    const q = normalizeQuote({ symbol: 'X', currentPrice: 110, previousClose: 100 });
    expect(q!.change).toBe(10);
    expect(q!.changePercent).toBe(10);
  });

  it('upper-cases the symbol so lookups match across screens', () => {
    expect(normalizeQuote({ symbol: ' reliance ', currentPrice: 1 })!.symbol).toBe('RELIANCE');
  });
});

describe('normalizeStockItem / normalizeStockList', () => {
  it('always produces finite display numbers', () => {
    const item = normalizeStockItem({
      symbol: 'X',
      currentPrice: 100,
      previousClose: 'not a number',
      peRatio: NaN,
      dividendYield: undefined,
      sparkline: [1, NaN, 2, undefined],
    });
    expect(item).not.toBeNull();
    expect(Number.isFinite(item!.currentPrice)).toBe(true);
    expect(Number.isFinite(item!.previousClose)).toBe(true);
    expect(Number.isFinite(item!.changePercent)).toBe(true);
    expect(Number.isFinite(item!.peRatio)).toBe(true);
    expect(Number.isFinite(item!.dividendYield)).toBe(true);
    expect(item!.sparkline).toEqual([1, 2]);
  });

  it('drops unusable rows and duplicate symbols from a list', () => {
    const list = normalizeStockList([
      goodQuote,
      null,
      {},
      { symbol: 'NOPRICE' },
      { ...goodQuote, id: 'dupe' },
      'garbage',
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].symbol).toBe('RELIANCE');
  });

  it('returns an empty list for a non-array payload', () => {
    expect(normalizeStockList(undefined)).toEqual([]);
    expect(normalizeStockList({ data: [] })).toEqual([]);
    expect(normalizeStockList('oops')).toEqual([]);
  });
});

describe('validateCandle / normalizeHistoricalData', () => {
  const good = { timestamp: 't', open: 10, high: 12, low: 9, close: 11, volume: 100 };

  it('accepts a well-formed candle', () => {
    expect(validateCandle(good)).not.toBeNull();
  });

  it('rejects candles without usable open/close', () => {
    expect(validateCandle({ ...good, open: null })).toBeNull();
    expect(validateCandle({ ...good, close: 'x' })).toBeNull();
    expect(validateCandle({ ...good, open: -5 })).toBeNull();
    expect(validateCandle(null)).toBeNull();
  });

  it('rebuilds a missing high/low from open and close', () => {
    const c = validateCandle({ timestamp: 't', open: 10, close: 12 });
    expect(c!.high).toBe(12);
    expect(c!.low).toBe(10);
  });

  it('rejects an inverted high/low', () => {
    expect(validateCandle({ ...good, high: 5, low: 20 })).toBeNull();
  });

  it('discards only the malformed candles and keeps the good ones', () => {
    const out = normalizeHistoricalData([
      good,
      { ...good, close: undefined },
      { ...good, close: 13 },
      'junk',
      null,
    ]);
    expect(out).toHaveLength(2);
  });

  it('returns empty rather than throwing for a malformed payload', () => {
    expect(normalizeHistoricalData(undefined)).toEqual([]);
    expect(normalizeHistoricalData({ nope: true })).toEqual([]);
    expect(normalizeHistoricalData([null, undefined, 1, 'x'])).toEqual([]);
  });

  it('unwraps a { candles: [...] } envelope', () => {
    expect(normalizeHistoricalData({ candles: [good, good] })).toHaveLength(2);
  });

  it('candlesToCloseSeries yields only finite closes', () => {
    const series = candlesToCloseSeries(normalizeHistoricalData([good, { ...good, close: 13 }]));
    expect(series).toEqual([11, 13]);
    expect(series.every(Number.isFinite)).toBe(true);
  });
});

describe('normalizeMutualFundList', () => {
  it('drops funds with no id, name or NAV', () => {
    const list = normalizeMutualFundList([
      { id: 'f1', name: 'Fund One', nav: 100, minInvestment: 500 },
      { id: 'f2', name: 'No NAV' },
      { name: 'No id', nav: 10 },
      null,
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('f1');
  });
});

describe('normalizeMarketStatus', () => {
  const fallback: MarketStatusInfo = {
    session: 'CLOSED',
    exchange: 'NSE',
    currentTimeIST: '10:00 IST',
    isOpen: false,
    message: 'closed',
    nextSessionTime: 'tomorrow',
  };

  it('falls back field by field for a malformed payload', () => {
    expect(normalizeMarketStatus(null, fallback)).toEqual(fallback);
    expect(normalizeMarketStatus({ session: 'BOGUS' }, fallback).session).toBe('CLOSED');
    expect(normalizeMarketStatus({ isOpen: true }, fallback).isOpen).toBe(true);
  });
});
