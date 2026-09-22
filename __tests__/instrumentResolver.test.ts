import {
  findHolding,
  findStock,
  instrumentKey,
  isIndexSymbol,
  resolveInstrument,
  toInstrument,
} from '../src/services/instrumentResolver';
import { StockHolding, StockItem } from '../src/types';

const reliance = {
  id: 'stock_reliance',
  symbol: 'RELIANCE',
  name: 'Reliance Industries',
  exchange: 'NSE',
  sector: 'Energy',
  currentPrice: 2500,
  previousClose: 2450,
  changePercent: 2.04,
  risk: 'Low',
  description: '',
  marketCap: '₹17 Lakh Cr',
  peRatio: 24.5,
  dividendYield: 0.9,
  sparkline: [2400, 2500],
  historical1D: [2400, 2500],
  historical1W: [2400, 2500],
  historical1M: [2400, 2500],
  historical1Y: [2400, 2500],
} as StockItem;

const nifty = { ...reliance, id: 'idx_nifty', symbol: 'NIFTY 50', name: 'NIFTY 50 Index' };
const catalog: StockItem[] = [reliance, nifty];

const holding: StockHolding = {
  symbol: 'RELIANCE',
  name: 'Reliance Industries',
  shares: 10,
  averageBuyPrice: 2400,
  totalInvested: 24000,
  category: 'Equity',
};

describe('instrumentKey', () => {
  it('normalizes strings and objects to one upper-case key', () => {
    expect(instrumentKey('reliance')).toBe('RELIANCE');
    expect(instrumentKey(' Reliance ')).toBe('RELIANCE');
    expect(instrumentKey({ symbol: 'reliance' })).toBe('RELIANCE');
  });

  it('returns null when there is no identity', () => {
    expect(instrumentKey(null)).toBeNull();
    expect(instrumentKey('')).toBeNull();
    expect(instrumentKey('   ')).toBeNull();
    expect(instrumentKey({})).toBeNull();
    expect(instrumentKey(123)).toBeNull();
  });
});

describe('findStock / findHolding', () => {
  it('matches case-insensitively without throwing on broken rows', () => {
    const dirty = [null, {}, { symbol: null }, ...catalog] as unknown as StockItem[];
    expect(findStock(dirty, 'reliance')?.symbol).toBe('RELIANCE');
    expect(findStock(dirty, 'NOPE')).toBeNull();
    expect(findStock(undefined, 'RELIANCE')).toBeNull();
  });

  it('finds a holding by any identifier shape', () => {
    expect(findHolding([holding], 'reliance')?.shares).toBe(10);
    expect(findHolding([holding], { symbol: 'RELIANCE' })?.shares).toBe(10);
    expect(findHolding([holding], 'TCS')).toBeNull();
    expect(findHolding(null, 'RELIANCE')).toBeNull();
  });
});

describe('toInstrument', () => {
  it('marks equities tradable and indices not', () => {
    expect(toInstrument(reliance).tradable).toBe(true);
    expect(toInstrument(reliance).assetType).toBe('equity');
    expect(toInstrument(nifty).tradable).toBe(false);
    expect(toInstrument(nifty).assetType).toBe('index');
    expect(isIndexSymbol('SENSEX')).toBe(true);
  });
});

describe('resolveInstrument', () => {
  it('resolves from a full stock object', () => {
    const r = resolveInstrument({ stock: reliance }, catalog, [holding]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.instrument.symbol).toBe('RELIANCE');
      expect(r.holding?.shares).toBe(10);
    }
  });

  it('resolves from a bare symbol parameter', () => {
    const r = resolveInstrument({ symbol: 'reliance' }, catalog, [holding]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.stock.symbol).toBe('RELIANCE');
  });

  it('prefers the live catalog row over a stale snapshot', () => {
    const stale = { ...reliance, currentPrice: 1 };
    const r = resolveInstrument({ stock: stale }, catalog, []);
    expect(r.ok).toBe(true);
    // The tapped card's copy said 1; the live catalog says 2500.
    if (r.ok) expect(r.stock.currentPrice).toBe(2500);
  });

  it('falls back to the snapshot when the catalog has not loaded', () => {
    const r = resolveInstrument({ stock: reliance }, [], []);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.stock.currentPrice).toBe(2500);
  });

  it('reports missing-parameter instead of crashing', () => {
    for (const params of [null, undefined, {}, { stock: null }, { stock: {} }, 42]) {
      const r = resolveInstrument(params, catalog, []);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('missing-parameter');
    }
  });

  it('reports not-found for an unknown symbol', () => {
    const r = resolveInstrument({ symbol: 'DELISTED' }, catalog, []);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe('not-found');
      expect(r.requested).toBe('DELISTED');
    }
  });

  it('returns a null holding when the stock is not owned', () => {
    const r = resolveInstrument({ symbol: 'RELIANCE' }, catalog, []);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.holding).toBeNull();
  });

  it('survives corrupt holdings in the list', () => {
    const dirty = [null, { shares: 5 }, holding] as unknown as StockHolding[];
    const r = resolveInstrument({ symbol: 'RELIANCE' }, catalog, dirty);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.holding?.shares).toBe(10);
  });
});
