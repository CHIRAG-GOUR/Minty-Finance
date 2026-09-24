import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { StockCard } from '../components/cards/StockCard';
import { StockLineChart } from '../components/charts/StockLineChart';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';
import { MarketDataService } from '../services/marketDataService';
import {
  MarketSections,
  TRADING_SCREENS,
  ScreenId,
  CapSegment,
  invalidateMarketCache,
  getQuotes,
} from '../services/marketSections';
import { useMarketSection } from '../hooks/useMarketSection';
import {
  SectionHeader,
  SectionStateView,
  RankedRow,
  MetricBarRow,
  RailTile,
  HeatCell,
  BreadthPanel,
  FeaturedStockTile,
  EtfRowView,
  NewsRowView,
  LearnChip,
  moveColor,
} from '../components/markets/MarketSectionViews';
import {
  formatCompactNumber,
  formatCurrencyOrDash,
  formatPercentage,
  formatTime,
} from '../utils/formatters';
import { isIndexSymbol } from '../services/instrumentResolver';
import { toFiniteNumber, clamp } from '../utils/safeNumber';
import { Linking } from 'react-native';

type MoverDirection = 'gainers' | 'losers';
type MoverSegment = CapSegment | 'all';

/** Short explainers, kept to one sentence so Markets does not become a textbook. */
const EXPLAINERS: Record<string, { title: string; body: string }> = {
  volume: {
    title: 'What is volume?',
    body: 'Volume is how many shares changed hands today. High volume means lots of people agreed to trade at these prices.',
  },
  rvol: {
    title: 'What is relative volume?',
    body: "Today's volume compared with the same stock's own recent average. 3x means three times its usual activity — something is going on.",
  },
  intraday: {
    title: 'What does intraday mean?',
    body: "Intraday means within a single trading day. A wide intraday range means the price swung a lot between the day's high and low.",
  },
  marketCap: {
    title: 'What does market cap mean?',
    body: 'Market cap is the total value of all a company\'s shares. Large caps are usually steadier; small caps can move much faster.',
  },
  mtf: {
    title: 'What is MTF?',
    body: 'Margin Trading Facility lets investors borrow from a broker to buy more shares than their cash allows. It magnifies both gains and losses.',
  },
  etf: {
    title: 'What is an ETF?',
    body: 'An ETF is a basket of many shares you can buy in one trade, so your money is spread across lots of companies at once.',
  },
};

export const InvestScreen: React.FC = () => {
  const { stockCatalog, stockHoldings, marketStatus, openModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [liveSearchResults, setLiveSearchResults] = useState<StockItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [moverDirection, setMoverDirection] = useState<MoverDirection>('gainers');
  const [moverSegment, setMoverSegment] = useState<MoverSegment>('all');
  const [activeScreen, setActiveScreen] = useState<ScreenId>('near-52w-high');
  const [openExplainer, setOpenExplainer] = useState<string | null>(null);

  // --- live search -------------------------------------------------------
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await MarketDataService.searchLiveYahoo(trimmed);
        if (!cancelled) setLiveSearchResults(Array.isArray(results) ? results : []);
      } catch {
        if (!cancelled) setLiveSearchResults([]);
      } finally {
        if (!cancelled) setIsSearchingLive(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // --- sections ----------------------------------------------------------
  const movers = useMarketSection(
    () => MarketSections.getTopMovers(moverDirection, moverSegment),
    [moverDirection, moverSegment],
    refreshKey
  );
  const shockers = useMarketSection(() => MarketSections.getVolumeShockers(), [], refreshKey);
  const intraday = useMarketSection(() => MarketSections.getTopIntraday(), [], refreshKey);
  const sectors = useMarketSection(() => MarketSections.getSectors(), [], refreshKey);
  const screenResults = useMarketSection(
    () => MarketSections.runScreen(activeScreen),
    [activeScreen],
    refreshKey
  );
  const topStocks = useMarketSection(() => MarketSections.getTopStocks(8), [], refreshKey);
  const mostBought = useMarketSection(() => MarketSections.getMostBought(), [], refreshKey);
  const etfs = useMarketSection(() => MarketSections.getMostBoughtETFs(), [], refreshKey);
  const news = useMarketSection(() => MarketSections.getStocksInNews(), [], refreshKey);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    invalidateMarketCache();
    try {
      await getQuotes(true);
    } catch {
      // Sections surface their own failures; the gesture itself always ends.
    }
    setRefreshKey((n) => n + 1);
    setIsRefreshing(false);
  }, []);

  /** Every instrument anywhere in Markets opens this one detail route. */
  const openDetail = useCallback(
    (stock: StockItem) => {
      const holding = stockHoldings.find(
        (h) => h.symbol?.toUpperCase() === stock.symbol?.toUpperCase()
      );
      openModal('stock_trade', { stock, action: 'buy', holding });
    },
    [openModal, stockHoldings]
  );

  const indices = useMemo(
    () => stockCatalog.filter((s) => isIndexSymbol(s.symbol)),
    [stockCatalog]
  );

  const breadth = useMemo(() => {
    const equities = stockCatalog.filter((s) => s && !isIndexSymbol(s.symbol));
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let totalVolume = 0;
    for (const s of equities) {
      const change = toFiniteNumber(s.changePercent, 0);
      if (change > 0) advancing += 1;
      else if (change < 0) declining += 1;
      else unchanged += 1;
      totalVolume += toFiniteNumber(s.volume, 0);
    }
    return { advancing, declining, unchanged, totalVolume };
  }, [stockCatalog]);

  const lastUpdated = movers.asOf ?? sectors.asOf ?? null;
  const isSearching = searchQuery.trim().length >= 2;

  const searchRows = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (q.length < 2) return [];
    const local = stockCatalog.filter(
      (s) =>
        s.symbol?.toUpperCase().includes(q) ||
        s.name?.toUpperCase().includes(q) ||
        s.sector?.toUpperCase().includes(q)
    );
    const seen = new Set(local.map((s) => s.symbol?.toUpperCase()));
    const remote = liveSearchResults.filter((s) => !seen.has(s.symbol?.toUpperCase()));
    return [...local, ...remote];
  }, [searchQuery, stockCatalog, liveSearchResults]);

  const explainer = openExplainer ? EXPLAINERS[openExplainer] : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Markets
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: marketStatus.isOpen ? THEME.colors.primary : THEME.colors.textMuted },
              ]}
            />
            <Text style={styles.statusText} numberOfLines={1}>
              {marketStatus.isOpen ? 'Market open' : 'Market closed'}
              {lastUpdated ? ` · Updated ${formatTime(new Date(lastUpdated).toISOString())}` : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh market data"
        >
          <Icon name="refresh" size={15} color={THEME.colors.obsidian} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={THEME.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks, ETFs, symbols"
          placeholderTextColor={THEME.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
        />
        {isSearchingLive ? <ActivityIndicator size="small" color={THEME.colors.textMuted} /> : null}
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Icon name="close" size={15} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={THEME.colors.primary} />
        }
      >
        {isSearching ? (
          /* --- Search results replace the dashboard while a query is active --- */
          <View style={styles.block}>
            <SectionHeader
              title={`${searchRows.length} result${searchRows.length === 1 ? '' : 's'}`}
              subtitle={`Matching "${searchQuery.trim()}"`}
            />
            {searchRows.length === 0 && !isSearchingLive ? (
              <View style={styles.emptySearch}>
                <Icon name="search" size={24} color={THEME.colors.textMuted} />
                <Text style={styles.emptySearchText}>
                  No instruments matched. Try a company name or ticker symbol.
                </Text>
              </View>
            ) : (
              searchRows.map((stock) => {
                const holding = stockHoldings.find(
                  (h) => h.symbol?.toUpperCase() === stock.symbol?.toUpperCase()
                );
                return (
                  <StockCard
                    key={`${stock.id}-${stock.symbol}`}
                    stock={stock}
                    heldShares={holding?.shares ?? 0}
                    onCardPress={() => openDetail(stock)}
                    onTradePress={() => openDetail(stock)}
                  />
                );
              })
            )}
          </View>
        ) : (
          <>
            {/* --- Index ticker strip --- */}
            {indices.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tickerStrip}
              >
                {indices.map((index) => (
                  <TouchableOpacity
                    key={index.id}
                    activeOpacity={0.85}
                    onPress={() => openDetail(index)}
                    style={styles.tickerCard}
                    accessibilityRole="button"
                  >
                    <Text style={styles.tickerSymbol} numberOfLines={1}>
                      {index.symbol}
                    </Text>
                    <Text style={styles.tickerPrice} numberOfLines={1}>
                      {formatCurrencyOrDash(index.currentPrice)}
                    </Text>
                    <Text
                      style={[styles.tickerChange, { color: moveColor(index.changePercent) }]}
                      numberOfLines={1}
                    >
                      {formatPercentage(index.changePercent, true, 2)}
                    </Text>
                    <View style={styles.tickerSpark}>
                      <StockLineChart
                        data={index.sparkline}
                        color={moveColor(index.changePercent)}
                        height={32}
                        showLabels={false}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {/* --- Top stocks: featured rail with company logos --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Top Stocks"
                subtitle="India's largest listed companies by market value"
              />
              {topStocks.phase === 'ok' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rail}
                >
                  {topStocks.data.map((row) => (
                    <FeaturedStockTile
                      key={row.stock.symbol}
                      stock={row.stock}
                      onPress={() => openDetail(row.stock)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <SectionStateView state={topStocks} skeletonRows={2} />
              )}
              <LearnChip
                label="What does market cap mean?"
                onPress={() => setOpenExplainer(openExplainer === 'marketCap' ? null : 'marketCap')}
              />
            </View>

            {/* --- Market snapshot --- */}
            <View style={styles.block}>
              <BreadthPanel
                advancing={breadth.advancing}
                declining={breadth.declining}
                unchanged={breadth.unchanged}
                totalVolume={breadth.totalVolume}
              />
            </View>

            {/* --- Most bought (order-flow data) --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Most Bought"
                subtitle="What investors are buying most today"
              />
              <SectionStateView state={mostBought} />
            </View>

            {/* --- Top movers: ranked list with its own filters --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Top Movers Today"
                subtitle="Biggest percentage moves, by company size"
              />

              <View style={styles.toggleRow}>
                {(['gainers', 'losers'] as MoverDirection[]).map((dir) => {
                  const active = moverDirection === dir;
                  return (
                    <TouchableOpacity
                      key={dir}
                      onPress={() => setMoverDirection(dir)}
                      style={[
                        styles.toggleBtn,
                        active && {
                          backgroundColor: dir === 'gainers' ? '#E8FAF2' : '#FFEBEF',
                          borderColor: dir === 'gainers' ? THEME.colors.primary : THEME.colors.coral,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Icon
                        name={dir === 'gainers' ? 'arrow-up-right' : 'arrow-down-right'}
                        size={13}
                        color={active ? (dir === 'gainers' ? THEME.colors.primaryDark : THEME.colors.coral) : THEME.colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          active && {
                            color: dir === 'gainers' ? THEME.colors.primaryDark : THEME.colors.coral,
                          },
                        ]}
                      >
                        {dir === 'gainers' ? 'Gainers' : 'Losers'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {(
                  [
                    ['all', 'All'],
                    ['large', 'Large cap'],
                    ['mid', 'Mid cap'],
                    ['small', 'Small cap'],
                  ] as [MoverSegment, string][]
                ).map(([seg, label]) => {
                  const active = moverSegment === seg;
                  return (
                    <TouchableOpacity
                      key={seg}
                      onPress={() => setMoverSegment(seg)}
                      style={[styles.chip, active && styles.chipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.listCard}>
                <SectionStateView state={movers} skeletonRows={5} />
                {movers.phase === 'ok'
                  ? movers.data.map((row, i) => (
                      <RankedRow
                        key={row.stock.symbol}
                        rank={i + 1}
                        stock={row.stock}
                        onPress={() => openDetail(row.stock)}
                      />
                    ))
                  : null}
              </View>

              <LearnChip
                label="What does market cap mean?"
                onPress={() => setOpenExplainer(openExplainer === 'marketCap' ? null : 'marketCap')}
              />
            </View>

            {/* --- Volume shockers: relative-volume bars --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Volume Shockers"
                subtitle="Trading far above their own normal activity"
              />
              <View style={styles.listCard}>
                <SectionStateView
                  state={shockers}
                  skeletonRows={4}
                  emptyLabel="Nothing is trading unusually heavily right now."
                />
                {shockers.phase === 'ok'
                  ? shockers.data.map((row) => (
                      <MetricBarRow
                        key={row.stock.symbol}
                        stock={row.stock}
                        // 5x relative volume fills the bar.
                        fill={clamp(row.relativeVolume / 5, 0, 1)}
                        headline={`${row.relativeVolume.toFixed(1)}x`}
                        caption={`${formatCompactNumber(row.volume)} vs ${formatCompactNumber(
                          row.averageVolume
                        )} average`}
                        onPress={() => openDetail(row.stock)}
                      />
                    ))
                  : null}
              </View>
              <LearnChip
                label="What is relative volume?"
                onPress={() => setOpenExplainer(openExplainer === 'rvol' ? null : 'rvol')}
              />
            </View>

            {/* --- Top intraday: horizontal rail --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Top Intraday"
                subtitle="Widest swing between today's high and low"
              />
              {intraday.phase === 'ok' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rail}
                >
                  {intraday.data.map((row) => (
                    <RailTile
                      key={row.stock.symbol}
                      stock={row.stock}
                      metricLabel="Day range"
                      metricValue={`${row.rangePercent.toFixed(2)}%`}
                      onPress={() => openDetail(row.stock)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <SectionStateView state={intraday} skeletonRows={2} />
              )}
              <LearnChip
                label="What does intraday mean?"
                onPress={() => setOpenExplainer(openExplainer === 'intraday' ? null : 'intraday')}
              />
            </View>

            {/* --- Trading screens: filter tiles + inline results --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Trading Screens"
                subtitle="Filter the market by what is actually happening"
              />
              <View style={styles.screenGrid}>
                {TRADING_SCREENS.map((screen) => {
                  const active = activeScreen === screen.id;
                  return (
                    <TouchableOpacity
                      key={screen.id}
                      onPress={() => setActiveScreen(screen.id)}
                      style={[styles.screenTile, active && styles.screenTileActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.screenLabel, active && styles.screenLabelActive]} numberOfLines={1}>
                        {screen.label}
                      </Text>
                      <Text style={[styles.screenDesc, active && styles.screenDescActive]} numberOfLines={2}>
                        {screen.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.listCard}>
                <SectionStateView
                  state={screenResults}
                  skeletonRows={4}
                  emptyLabel="No instruments match this screen today."
                />
                {screenResults.phase === 'ok'
                  ? screenResults.data.slice(0, 8).map((stock, i) => (
                      <RankedRow
                        key={stock.symbol}
                        rank={i + 1}
                        stock={stock}
                        onPress={() => openDetail(stock)}
                      />
                    ))
                  : null}
              </View>

              <Text style={styles.screenHint}>
                {TRADING_SCREENS.find((s) => s.id === activeScreen)?.hint}
              </Text>
            </View>

            {/* --- Sectors: heatmap --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Sectors Trading Today"
                subtitle="Stronger colour means a bigger average move"
              />
              {sectors.phase === 'ok' ? (
                <View style={styles.heatGrid}>
                  {sectors.data.map((row) => (
                    <HeatCell
                      key={row.sector}
                      label={row.sector}
                      changePercent={row.averageChangePercent}
                      advancing={row.advancing}
                      declining={row.declining}
                      onPress={() => setSearchQuery(row.sector)}
                    />
                  ))}
                </View>
              ) : (
                <SectionStateView state={sectors} skeletonRows={3} />
              )}
            </View>


            {/* --- ETFs --- */}
            <View style={styles.block}>
              <SectionHeader
                title="ETFs"
                subtitle="Most actively traded today, by shares changing hands"
              />
              <View style={styles.listCard}>
                <SectionStateView state={etfs} skeletonRows={4} />
                {etfs.phase === 'ok'
                  ? etfs.data.map((row) => (
                      <EtfRowView
                        key={row.stock.symbol}
                        stock={row.stock}
                        category={row.category}
                        volume={row.volume}
                        onPress={() => openDetail(row.stock)}
                      />
                    ))
                  : null}
              </View>
              <LearnChip
                label="What is an ETF?"
                onPress={() => setOpenExplainer(openExplainer === 'etf' ? null : 'etf')}
              />
            </View>

            {/* --- News --- */}
            <View style={styles.block}>
              <SectionHeader
                title="Stocks in News"
                subtitle="Headlines about today's biggest movers"
              />
              <View style={styles.listCard}>
                <SectionStateView
                  state={news}
                  skeletonRows={3}
                  emptyLabel="No headlines published for today's movers yet."
                />
                {news.phase === 'ok'
                  ? news.data.map((row) => (
                      <NewsRowView
                        key={row.id}
                        headline={row.headline}
                        source={row.source}
                        publishedAt={row.publishedAt}
                        stock={row.stock}
                        onPress={() => {
                          // Tapping opens the article; the ticker chip above it
                          // still routes to the same stock detail as everywhere.
                          if (row.url) Linking.openURL(row.url).catch(() => openDetail(row.stock));
                          else openDetail(row.stock);
                        }}
                      />
                    ))
                  : null}
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Explainer sheet */}
      {explainer ? (
        <TouchableOpacity
          style={styles.explainerBackdrop}
          activeOpacity={1}
          onPress={() => setOpenExplainer(null)}
        >
          <View style={styles.explainerCard}>
            <View style={styles.explainerHeader}>
              <Icon name="lightbulb" size={16} color={THEME.colors.amberDark} />
              <Text style={styles.explainerTitle}>{explainer.title}</Text>
            </View>
            <Text style={styles.explainerBody}>{explainer.body}</Text>
            <TouchableOpacity
              onPress={() => setOpenExplainer(null)}
              style={styles.explainerClose}
              accessibilityRole="button"
            >
              <Text style={styles.explainerCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 6,
  },
  headerTextCol: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '600', color: THEME.colors.textMuted, flexShrink: 1 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentYellow,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    paddingVertical: 10,
  },

  scroll: { paddingBottom: 20 },
  block: { paddingHorizontal: THEME.spacing.lg, marginBottom: 22, gap: 10 },
  bottomSpace: { height: 110 },

  tickerStrip: { paddingHorizontal: THEME.spacing.lg, gap: 10, paddingBottom: 18 },
  tickerCard: {
    width: 152,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
  },
  tickerSymbol: { fontSize: 11, fontWeight: '800', color: THEME.colors.textMuted },
  tickerPrice: { fontSize: 17, fontWeight: '900', color: THEME.colors.textPrimary, marginTop: 3 },
  tickerChange: { fontSize: 12, fontWeight: '800', marginTop: 1 },
  tickerSpark: { height: 32, marginTop: 6 },

  listCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.card,
  },
  toggleText: { fontSize: 12, fontWeight: '800', color: THEME.colors.textMuted },

  chipRow: { gap: 7, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: THEME.colors.obsidian, borderColor: THEME.colors.obsidian },
  chipText: { fontSize: 11, fontWeight: '800', color: THEME.colors.textSecondary },
  chipTextActive: { color: THEME.colors.accentYellow },

  rail: { gap: 10, paddingVertical: 2, paddingRight: 4 },

  screenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  screenTile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.card,
    padding: 10,
    gap: 2,
  },
  screenTileActive: { backgroundColor: THEME.colors.obsidian, borderColor: THEME.colors.obsidian },
  screenLabel: { fontSize: 12, fontWeight: '800', color: THEME.colors.textPrimary },
  screenLabelActive: { color: THEME.colors.accentYellow },
  screenDesc: { fontSize: 9, lineHeight: 13, color: THEME.colors.textMuted },
  screenDescActive: { color: '#CBD5E1' },
  screenHint: { fontSize: 11, lineHeight: 16, color: THEME.colors.textMuted, fontStyle: 'italic' },

  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  emptySearch: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptySearchText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  explainerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,19,43,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  explainerCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    gap: 10,
  },
  explainerHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  explainerTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: THEME.colors.textPrimary },
  explainerBody: { fontSize: 13, lineHeight: 19, color: THEME.colors.textSecondary },
  explainerClose: {
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.obsidian,
  },
  explainerCloseText: { fontSize: 12, fontWeight: '800', color: THEME.colors.accentYellow },
});
