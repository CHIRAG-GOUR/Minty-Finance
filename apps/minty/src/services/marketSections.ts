import { StockItem } from '../types';
import { MarketDataService } from './marketDataService';
import { isIndexSymbol } from './instrumentResolver';
import { isFiniteNumber, safeDivide, toFiniteNumber, round } from '../utils/safeNumber';

/**
 * Aggregates the Markets dashboard sections from the configured data provider.
 *
 * Each section declares honestly whether the *configured* provider can actually
 * supply its metric. Sections whose metric needs broker order-flow (what people
 * are really buying, MTF positions) or a licensed news feed report
 * `unavailable` with a reason rather than inventing a ranking — a fabricated
 * "most bought" list would teach students something false about the market.
 *
 * To light one of those up, implement the matching hook on a provider and flip
 * its capability; the UI needs no changes.
 */

export type SectionStatus = 'ok' | 'unavailable' | 'error';

export interface SectionResult<T> {
  status: SectionStatus;
  data: T[];
  /** Why the section has no data. Shown verbatim in the empty state. */
  reason?: string;
  /** Epoch ms the data was produced, for the "Updated HH:MM" label. */
  asOf: number;
}

/** What the currently configured provider can supply. */
export interface ProviderCapabilities {
  /** Ranking by actual buy-side order flow (broker data). */
  orderFlow: boolean;
  /** Margin Trading Facility positions / rankings. */
  mtf: boolean;
  /** Company news headlines. */
  news: boolean;
  /** A published ETF universe with quotes. */
  etfUniverse: boolean;
  /** Historical volume, needed for a relative-volume baseline. */
  historicalVolume: boolean;
  /** Maintained market-cap metadata for cap segmentation. */
  marketCapMetadata: boolean;
}

/**
 * The live feed supplies quotes (price, change, volume, 52-week range) and
 * historical candles. It does not expose order flow, MTF or news.
 */
export const PROVIDER_CAPABILITIES: ProviderCapabilities = {
  orderFlow: false,
  mtf: false,
  news: true,
  etfUniverse: true,
  historicalVolume: true,
  marketCapMetadata: true,
};

/**
 * Exchange-traded funds listed on the NSE, quoted live through the same feed as
 * equities. A maintained list because the feed publishes no ETF directory.
 */
export const ETF_UNIVERSE: { symbol: string; name: string; category: string }[] = [
  { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50 BeES', category: 'Large Cap' },
  { symbol: 'BANKBEES', name: 'Nippon India ETF Nifty Bank BeES', category: 'Banking' },
  { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', category: 'Gold' },
  { symbol: 'JUNIORBEES', name: 'Nippon India ETF Nifty Next 50', category: 'Mid Cap' },
  { symbol: 'SILVERBEES', name: 'Nippon India Silver ETF', category: 'Silver' },
  { symbol: 'ITBEES', name: 'Nippon India ETF Nifty IT', category: 'Technology' },
  { symbol: 'MON100', name: 'Motilal Oswal NASDAQ 100 ETF', category: 'International' },
  { symbol: 'CPSEETF', name: 'CPSE ETF', category: 'Public Sector' },
  { symbol: 'SETFNIF50', name: 'SBI Nifty 50 ETF', category: 'Large Cap' },
  { symbol: 'PSUBNKBEES', name: 'Nippon India ETF Nifty PSU Bank', category: 'Banking' },
  { symbol: 'MAFANG', name: 'Mirae Asset NYSE FANG+ ETF', category: 'International' },
  { symbol: 'LIQUIDBEES', name: 'Nippon India ETF Liquid BeES', category: 'Liquid' },
];

export interface EtfRow {
  stock: StockItem;
  category: string;
  volume: number;
}

export interface NewsRow {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  /** The instrument the headline was found for, so the row opens its detail. */
  stock: StockItem;
}

const UNAVAILABLE_REASONS = {
  orderFlow:
    'Buy-side order flow is broker data. The market feed connected to Minty reports prices and volume, not what investors are buying.',
  mtf: 'Margin Trading Facility positions are published by brokers, not by the market data feed connected to Minty.',
  news: 'A licensed news feed is not connected to Minty yet.',
  etf: 'An ETF universe is not published by the market data feed connected to Minty yet.',
};

// ---------------------------------------------------------------------------
// Instrument metadata
// ---------------------------------------------------------------------------

export type CapSegment = 'large' | 'mid' | 'small' | 'unknown';

/**
 * Parses the maintained market-cap string ("₹1.42 Lakh Cr", "₹50,000 Cr") into
 * crores. Returns null when the string carries no real figure, so an instrument
 * with unknown size is excluded from cap-segmented lists rather than guessed at.
 */
export function parseMarketCapCr(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text === '' || /not available|live market instrument/i.test(text)) return null;

  const match = text.replace(/,/g, '').match(/([\d.]+)/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  // "Lakh Cr" = 100,000 crore.
  if (/lakh\s*cr/i.test(text)) return n * 100000;
  if (/\bcr\b/i.test(text)) return n;
  return null;
}

/** SEBI-style thresholds, in crores. */
export function capSegmentOf(stock: StockItem): CapSegment {
  const cr = parseMarketCapCr(stock.marketCap);
  if (cr === null) return 'unknown';
  if (cr >= 100000) return 'large';
  if (cr >= 25000) return 'mid';
  return 'small';
}

// ---------------------------------------------------------------------------
// Derived section models
// ---------------------------------------------------------------------------

export interface MoverRow {
  stock: StockItem;
  changePercent: number;
}

export interface VolumeShockerRow {
  stock: StockItem;
  volume: number;
  averageVolume: number;
  /** Current volume divided by its own historical average. */
  relativeVolume: number;
}

export interface IntradayRow {
  stock: StockItem;
  /** Intraday high-low range as a percentage of the day's low. */
  rangePercent: number;
  volume: number;
}

export interface SectorRow {
  sector: string;
  averageChangePercent: number;
  advancing: number;
  declining: number;
  totalVolume: number;
  instruments: number;
}

export type ScreenId =
  | 'near-52w-high'
  | 'near-52w-low'
  | 'high-volume'
  | 'high-volatility'
  | 'large-cap'
  | 'small-cap';

export interface ScreenDefinition {
  id: ScreenId;
  label: string;
  description: string;
  /** Educational one-liner shown under the tile. */
  hint: string;
}

export const TRADING_SCREENS: ScreenDefinition[] = [
  {
    id: 'near-52w-high',
    label: 'Near 52W High',
    description: 'Within 5% of the highest price of the last year',
    hint: 'Strength, but also a reminder that past highs are not a promise.',
  },
  {
    id: 'near-52w-low',
    label: 'Near 52W Low',
    description: 'Within 5% of the lowest price of the last year',
    hint: 'Cheap is not the same as good value — check why it fell.',
  },
  {
    id: 'high-volume',
    label: 'High Volume',
    description: 'Most shares traded today',
    hint: 'Volume shows how many people agreed to trade at these prices.',
  },
  {
    id: 'high-volatility',
    label: 'High Volatility',
    description: 'Widest high-to-low move today',
    hint: 'Bigger swings mean bigger gains and bigger losses.',
  },
  {
    id: 'large-cap',
    label: 'Large Cap',
    description: 'Companies above ₹1,00,000 crore',
    hint: 'Bigger companies usually move more slowly.',
  },
  {
    id: 'small-cap',
    label: 'Small Cap',
    description: 'Companies below ₹25,000 crore',
    hint: 'Smaller companies can grow faster and fall harder.',
  },
];

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** Quotes are shared by every section, so they are fetched once per window. */
const QUOTE_TTL_MS = 20000;
/** Volume baselines change slowly; refetching them per pull would be wasteful. */
const BASELINE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  at: number;
}

let quoteCache: CacheEntry<StockItem[]> | null = null;
let quoteInFlight: Promise<StockItem[]> | null = null;
const baselineCache = new Map<string, CacheEntry<number>>();

function tradableEquities(all: StockItem[]): StockItem[] {
  return all.filter((s) => s && !isIndexSymbol(s.symbol) && isFiniteNumber(s.currentPrice));
}

/**
 * One shared quote fetch. Concurrent callers join the in-flight request rather
 * than each firing their own, so opening Markets costs one network round trip
 * however many sections are on screen.
 */
export async function getQuotes(forceRefresh = false): Promise<StockItem[]> {
  const now = Date.now();
  if (!forceRefresh && quoteCache && now - quoteCache.at < QUOTE_TTL_MS) {
    return quoteCache.value;
  }
  if (quoteInFlight) return quoteInFlight;

  quoteInFlight = (async () => {
    try {
      const list = await MarketDataService.getStocks();
      const value = Array.isArray(list) ? list : [];
      quoteCache = { value, at: Date.now() };
      return value;
    } finally {
      quoteInFlight = null;
    }
  })();

  return quoteInFlight;
}

export function invalidateMarketCache(): void {
  quoteCache = null;
}

function ok<T>(data: T[]): SectionResult<T> {
  return { status: 'ok', data, asOf: Date.now() };
}

function unavailable<T>(reason: string): SectionResult<T> {
  return { status: 'unavailable', data: [], reason, asOf: Date.now() };
}

function failed<T>(reason: string): SectionResult<T> {
  return { status: 'error', data: [], reason, asOf: Date.now() };
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const MarketSections = {
  capabilities: PROVIDER_CAPABILITIES,

  /**
   * Requires buy-side order flow, which a price/volume feed does not carry.
   * Deliberately not approximated by volume: the two answer different questions
   * and presenting one as the other would be misleading.
   */
  async getMostBought(): Promise<SectionResult<MoverRow>> {
    if (!PROVIDER_CAPABILITIES.orderFlow) {
      return unavailable(UNAVAILABLE_REASONS.orderFlow);
    }
    return unavailable(UNAVAILABLE_REASONS.orderFlow);
  },

  async getMostBoughtMTF(): Promise<SectionResult<MoverRow>> {
    if (!PROVIDER_CAPABILITIES.mtf) {
      return unavailable(UNAVAILABLE_REASONS.mtf);
    }
    return unavailable(UNAVAILABLE_REASONS.mtf);
  },

  /**
   * Headlines for the instruments moving most today, from a real news feed.
   * Nothing is summarised or rewritten — each row is a publisher's own headline
   * with its source and timestamp, and links back to the original article.
   */
  async getStocksInNews(limit = 6): Promise<SectionResult<NewsRow>> {
    if (!PROVIDER_CAPABILITIES.news) return unavailable(UNAVAILABLE_REASONS.news);
    try {
      const equities = tradableEquities(await getQuotes())
        .sort(
          (a, b) =>
            Math.abs(toFiniteNumber(b.changePercent, 0)) -
            Math.abs(toFiniteNumber(a.changePercent, 0))
        )
        .slice(0, limit);

      const rows: NewsRow[] = [];
      for (const stock of equities) {
        const item = await topHeadlineFor(stock);
        if (item) rows.push(item);
      }

      if (rows.length === 0) {
        return ok([]); // Genuinely nothing published for today's movers.
      }
      return ok(rows);
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /**
   * ETFs ranked by the shares actually traded today. Named for the metric the
   * feed really provides — volume — rather than "most bought", which would
   * require broker order flow.
   */
  async getMostBoughtETFs(limit = 8): Promise<SectionResult<EtfRow>> {
    if (!PROVIDER_CAPABILITIES.etfUniverse) return unavailable(UNAVAILABLE_REASONS.etf);
    try {
      const rows: EtfRow[] = [];
      for (const entry of ETF_UNIVERSE) {
        const quote = await MarketDataService.getStockQuote(entry.symbol);
        if (!quote || !isFiniteNumber(quote.currentPrice) || quote.currentPrice <= 0) continue;
        rows.push({
          stock: { ...quote, name: entry.name },
          category: entry.category,
          volume: toFiniteNumber(quote.volume, 0),
        });
      }

      if (rows.length === 0) {
        return unavailable('ETF quotes are not available from the market feed right now.');
      }
      rows.sort((a, b) => b.volume - a.volume);
      return ok(rows.slice(0, limit));
    } catch {
      return failed('Unable to load this section.');
    }
  },


  /**
   * The headline instruments for the top of the Stocks tab: the largest listed
   * companies by maintained market cap, which is what a student recognises
   * first. Ranked by size, not by a "best" judgement Minty is in no position to
   * make about anyone's investments.
   */
  async getTopStocks(limit = 8): Promise<SectionResult<MoverRow>> {
    try {
      const equities = tradableEquities(await getQuotes());
      const sized = equities
        .map((stock) => ({ stock, cr: parseMarketCapCr(stock.marketCap) }))
        .filter((r): r is { stock: StockItem; cr: number } => r.cr !== null)
        .sort((a, b) => b.cr - a.cr)
        .slice(0, limit)
        .map(({ stock }) => ({
          stock,
          changePercent: toFiniteNumber(stock.changePercent, 0),
        }));

      if (sized.length === 0) {
        return unavailable('Market cap data is not available for these instruments yet.');
      }
      return ok(sized);
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /** Gainers and losers, ranked by today's real percentage change. */
  async getTopMovers(
    direction: 'gainers' | 'losers',
    segment: CapSegment | 'all' = 'all',
    limit = 8
  ): Promise<SectionResult<MoverRow>> {
    try {
      const equities = tradableEquities(await getQuotes());
      const scoped =
        segment === 'all'
          ? equities
          : equities.filter((s) => capSegmentOf(s) === segment);

      if (segment !== 'all' && scoped.length === 0) {
        return unavailable(
          'No instruments in this size band have maintained market-cap data yet.'
        );
      }

      const rows = scoped
        .map((stock) => ({ stock, changePercent: toFiniteNumber(stock.changePercent, 0) }))
        .filter((r) => (direction === 'gainers' ? r.changePercent > 0 : r.changePercent < 0))
        .sort((a, b) =>
          direction === 'gainers'
            ? b.changePercent - a.changePercent
            : a.changePercent - b.changePercent
        )
        .slice(0, limit);

      return ok(rows);
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /**
   * Widest intraday range, as a share of the day's low. Uses the real day high
   * and low, so instruments the feed did not price intraday are skipped.
   */
  async getTopIntraday(limit = 6): Promise<SectionResult<IntradayRow>> {
    try {
      const rows = tradableEquities(await getQuotes())
        .map((stock) => {
          const high = toFiniteNumber(stock.dayHigh, NaN);
          const low = toFiniteNumber(stock.dayLow, NaN);
          if (!Number.isFinite(high) || !Number.isFinite(low) || low <= 0 || high <= low) {
            return null;
          }
          return {
            stock,
            rangePercent: round(safeDivide(high - low, low) * 100, 2),
            volume: toFiniteNumber(stock.volume, 0),
          };
        })
        .filter((r): r is IntradayRow => r !== null)
        .sort((a, b) => b.rangePercent - a.rangePercent)
        .slice(0, limit);

      if (rows.length === 0) {
        return unavailable('Intraday high and low prices are not being published right now.');
      }
      return ok(rows);
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /**
   * Relative volume: today's volume against that instrument's own historical
   * average, rather than a raw volume sort (which would just rank the biggest
   * companies every day). The baseline comes from real daily candles.
   */
  async getVolumeShockers(limit = 6): Promise<SectionResult<VolumeShockerRow>> {
    if (!PROVIDER_CAPABILITIES.historicalVolume) {
      return unavailable('A historical volume baseline is not available from this feed.');
    }
    try {
      const equities = tradableEquities(await getQuotes())
        .filter((s) => toFiniteNumber(s.volume, 0) > 0)
        // Bound the work: computing a baseline costs one request per symbol.
        .sort((a, b) => toFiniteNumber(b.volume, 0) - toFiniteNumber(a.volume, 0))
        .slice(0, 18);

      const rows: VolumeShockerRow[] = [];
      for (const stock of equities) {
        const averageVolume = await averageVolumeFor(stock.symbol);
        if (averageVolume === null || averageVolume <= 0) continue;
        const volume = toFiniteNumber(stock.volume, 0);
        const relativeVolume = round(safeDivide(volume, averageVolume), 2);
        // Only genuinely unusual activity belongs in this section.
        if (relativeVolume < 1.5) continue;
        rows.push({ stock, volume, averageVolume, relativeVolume });
      }

      rows.sort((a, b) => b.relativeVolume - a.relativeVolume);
      if (rows.length === 0) {
        return ok([]); // Real answer: nothing is unusually active right now.
      }
      return ok(rows.slice(0, limit));
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /** Sector activity aggregated from the real quotes of their constituents. */
  async getSectors(limit = 10): Promise<SectionResult<SectorRow>> {
    try {
      const equities = tradableEquities(await getQuotes());
      const buckets = new Map<string, { sum: number; up: number; down: number; vol: number; n: number }>();

      for (const s of equities) {
        const sector = (s.sector ?? '').trim();
        if (sector === '' || sector === 'Unclassified') continue;
        const change = toFiniteNumber(s.changePercent, 0);
        const bucket = buckets.get(sector) ?? { sum: 0, up: 0, down: 0, vol: 0, n: 0 };
        bucket.sum += change;
        bucket.n += 1;
        bucket.vol += toFiniteNumber(s.volume, 0);
        if (change > 0) bucket.up += 1;
        else if (change < 0) bucket.down += 1;
        buckets.set(sector, bucket);
      }

      const rows: SectorRow[] = Array.from(buckets.entries())
        .map(([sector, b]) => ({
          sector,
          averageChangePercent: round(safeDivide(b.sum, b.n), 2),
          advancing: b.up,
          declining: b.down,
          totalVolume: b.vol,
          instruments: b.n,
        }))
        .sort((a, b) => Math.abs(b.averageChangePercent) - Math.abs(a.averageChangePercent))
        .slice(0, limit);

      if (rows.length === 0) {
        return unavailable('Sector data is not available right now.');
      }
      return ok(rows);
    } catch {
      return failed('Unable to load this section.');
    }
  },

  /** Runs one of the data-driven screens. */
  async runScreen(id: ScreenId, limit = 12): Promise<SectionResult<StockItem>> {
    try {
      const equities = tradableEquities(await getQuotes());

      const near = (price: number, target: number) =>
        target > 0 && Math.abs(safeDivide(price - target, target)) <= 0.05;

      let rows: StockItem[] = [];
      switch (id) {
        case 'near-52w-high':
          rows = equities.filter(
            (s) =>
              isFiniteNumber(s.fiftyTwoWeekHigh) && near(s.currentPrice, s.fiftyTwoWeekHigh)
          );
          break;
        case 'near-52w-low':
          rows = equities.filter(
            (s) => isFiniteNumber(s.fiftyTwoWeekLow) && near(s.currentPrice, s.fiftyTwoWeekLow)
          );
          break;
        case 'high-volume':
          rows = [...equities]
            .filter((s) => toFiniteNumber(s.volume, 0) > 0)
            .sort((a, b) => toFiniteNumber(b.volume, 0) - toFiniteNumber(a.volume, 0));
          break;
        case 'high-volatility':
          rows = [...equities]
            .filter(
              (s) =>
                isFiniteNumber(s.dayHigh) &&
                isFiniteNumber(s.dayLow) &&
                (s.dayLow as number) > 0 &&
                (s.dayHigh as number) > (s.dayLow as number)
            )
            .sort(
              (a, b) =>
                safeDivide((b.dayHigh as number) - (b.dayLow as number), b.dayLow) -
                safeDivide((a.dayHigh as number) - (a.dayLow as number), a.dayLow)
            );
          break;
        case 'large-cap':
          rows = equities.filter((s) => capSegmentOf(s) === 'large');
          break;
        case 'small-cap':
          rows = equities.filter((s) => capSegmentOf(s) === 'small');
          break;
      }

      if (rows.length === 0) {
        return ok([]); // A screen with no matches today is a real result.
      }
      return ok(rows.slice(0, limit));
    } catch {
      return failed('Unable to load this screen.');
    }
  },
};


/** Decodes the handful of XML entities that appear in RSS titles. */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Headlines are cached per symbol; the feed updates far slower than quotes. */
const NEWS_TTL_MS = 10 * 60 * 1000;
const newsCache = new Map<string, CacheEntry<NewsRow | null>>();

/**
 * Most recent published headline for one instrument, from a real news feed.
 * Returns null rather than inventing a story when nothing is published.
 */
async function topHeadlineFor(stock: StockItem): Promise<NewsRow | null> {
  const key = stock.symbol.toUpperCase();
  const cached = newsCache.get(key);
  if (cached && Date.now() - cached.at < NEWS_TTL_MS) {
    return cached.value ? { ...cached.value, stock } : null;
  }

  // Strip the corporate suffix: "Reliance Industries Ltd" searches far better
  // as "Reliance Industries share".
  const query = `${stock.name.replace(/\s+(Ltd|Limited|Corp|Corporation)\.?$/i, '')} share`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-IN&gl=IN&ceid=IN:en`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();

    const first = /<item>([\s\S]*?)<\/item>/.exec(xml);
    if (!first) {
      newsCache.set(key, { value: null, at: Date.now() });
      return null;
    }

    const block = first[1];
    const rawTitle = (/<title>([\s\S]*?)<\/title>/.exec(block) ?? [])[1] ?? '';
    const link = (/<link>([\s\S]*?)<\/link>/.exec(block) ?? [])[1] ?? '';
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(block) ?? [])[1] ?? '';
    const source = (/<source[^>]*>([\s\S]*?)<\/source>/.exec(block) ?? [])[1] ?? '';

    const publisher = decodeEntities(source);
    let title = decodeEntities(rawTitle);
    // Google appends " - Publisher" to every headline and the publisher is
    // shown on its own line. Strip it by name, since publisher names can
    // themselves contain hyphens ("ad-hoc-news.de").
    if (publisher && title.endsWith(` - ${publisher}`)) {
      title = title.slice(0, -(publisher.length + 3)).trim();
    } else {
      title = title.replace(/\s+-\s+[^-]{2,40}$/, '').trim();
    }

    if (title === '') {
      newsCache.set(key, { value: null, at: Date.now() });
      return null;
    }

    const row: NewsRow = {
      id: `${key}-${pubDate}`,
      headline: title,
      source: publisher || 'News',
      publishedAt: pubDate.trim(),
      url: decodeEntities(link),
      stock,
    };
    newsCache.set(key, { value: row, at: Date.now() });
    return row;
  } catch {
    newsCache.set(key, { value: null, at: Date.now() });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mean daily volume from real historical candles, cached because it barely
 * moves within a session. Returns null when there is not enough history to
 * form an honest baseline.
 */
async function averageVolumeFor(symbol: string): Promise<number | null> {
  const key = symbol.toUpperCase();
  const cached = baselineCache.get(key);
  if (cached && Date.now() - cached.at < BASELINE_TTL_MS) return cached.value;

  try {
    const candles = await MarketDataService.getHistoricalCandles(symbol, '1M');
    const volumes = candles
      .map((c) => toFiniteNumber(c.volume, 0))
      .filter((v) => v > 0);
    if (volumes.length < 5) return null;

    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    if (!Number.isFinite(mean) || mean <= 0) return null;

    baselineCache.set(key, { value: mean, at: Date.now() });
    return mean;
  } catch {
    return null;
  }
}
