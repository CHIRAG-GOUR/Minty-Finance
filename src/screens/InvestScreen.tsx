import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { StockCard } from '../components/cards/StockCard';
import { formatCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';
import { MarketDataService } from '../services/marketDataService';

type StockFilter = 'all' | 'large_cap' | 'mid_cap' | 'small_cap' | 'gainers' | 'losers' | 'most_active' | 'watchlist';

export const InvestScreen: React.FC = () => {
  const {
    wallet,
    stockCatalog,
    stockHoldings,
    marketStatus,
    watchlist,
    openModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<StockFilter>('all');
  const [liveSearchResults, setLiveSearchResults] = useState<StockItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  // Debounced real-time Yahoo Finance live search for any unlisted/global equity
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await MarketDataService.searchLiveYahoo(trimmed);
        if (!isCancelled) {
          setLiveSearchResults(results);
          setIsSearchingLive(false);
        }
      } catch {
        if (!isCancelled) {
          setIsSearchingLive(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filterChips: { id: StockFilter; label: string }[] = [
    { id: 'all', label: 'All Stocks' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'large_cap', label: 'Large Cap' },
    { id: 'gainers', label: 'Top Gainers' },
    { id: 'losers', label: 'Top Losers' },
    { id: 'most_active', label: 'Most Active' },
  ];

  const filteredStocks = useMemo(() => {
    let list = [...stockCatalog];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    // Category / Market mover filter
    switch (selectedFilter) {
      case 'watchlist':
        list = list.filter((s) => watchlist.includes(s.symbol.toUpperCase()));
        break;
      case 'large_cap':
        list = list.filter((s) => s.risk === 'Low' || s.symbol === 'NIFTY 50' || s.symbol === 'SENSEX');
        break;
      case 'gainers':
        list = list.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'losers':
        list = list.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
        break;
      case 'most_active':
        list = list.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        break;
      default:
        break;
    }

    return list;
  }, [stockCatalog, searchQuery, selectedFilter, watchlist]);

  // Additional live-discovered stocks from Yahoo Finance search not already in filteredStocks
  const additionalLiveStocks = useMemo(() => {
    if (!searchQuery.trim() || liveSearchResults.length === 0) return [];
    const localKeys = new Set(filteredStocks.map((s) => s.symbol.toUpperCase()));
    return liveSearchResults.filter((s) => !localKeys.has(s.symbol.toUpperCase()));
  }, [liveSearchResults, filteredStocks, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Stocks Trading Floor
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Real Indian market feeds · Virtual ₹1,00,000 practice capital
          </Text>
        </View>

        <View style={styles.cashBadge}>
          <Text style={styles.cashBadgeLabel}>Available Cash</Text>
          <Text style={styles.cashBadgeAmount} numberOfLines={1}>
            {formatCurrency(wallet.cashBalance)}
          </Text>
        </View>
      </View>

      {/* Safety Notice & Market Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusBannerLeft}>
          <View
            style={[
              styles.liveIndicatorDot,
              {
                backgroundColor: marketStatus.isOpen
                  ? THEME.colors.accentYellow
                  : THEME.colors.coral,
              },
            ]}
          />
          <Text style={styles.statusBannerText}>
            {marketStatus.isOpen
              ? 'NSE Live · 09:15 - 15:30 IST'
              : 'Market Closed'}
          </Text>
        </View>
        <Text style={styles.simulatedTag}>VIRTUAL</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          {/* Search Input */}
          <View style={styles.searchBarContainer}>
            <Icon name="search" size={16} color={THEME.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any stock or equity in real-time..."
              placeholderTextColor={THEME.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {isSearchingLive && (
              <ActivityIndicator size="small" color={THEME.colors.primaryDark} style={{ marginRight: 4 }} />
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={16} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips Horizontal Scroll */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            {filterChips.map((chip) => {
              const isSelected = selectedFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(chip.id)}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Results Count & Data Freshness Tag */}
          <View style={styles.resultsInfoRow}>
            <Text style={styles.resultsCountText}>
              {filteredStocks.length + additionalLiveStocks.length} instruments{' '}
              {searchQuery.trim().length >= 2 ? `for "${searchQuery}"` : ''}
            </Text>
            <View style={styles.liveBadgeRow}>
              <View style={styles.liveIndicatorDotGreen} />
              <Text style={styles.freshnessText}>LIVE EXCHANGE FEED</Text>
            </View>
          </View>

          {/* Stock Cards List (Catalog/Filtered) */}
          {filteredStocks.map((stock) => {
            const holding = stockHoldings.find((h) => h.symbol === stock.symbol);
            return (
              <StockCard
                key={stock.id}
                stock={stock}
                heldShares={holding?.shares || 0}
                onTradePress={(action) => openModal('stock_trade', { stock, action, holding })}
              />
            );
          })}

          {/* Live Exchange Discovery Section */}
          {additionalLiveStocks.length > 0 && (
            <View style={styles.liveDiscoverySection}>
              <View style={styles.liveDiscoveryHeader}>
                <View style={styles.liveDiscoveryHeaderLeft}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveDiscoveryTitle}>Live Market Search Results</Text>
                </View>
                <View style={styles.liveDiscoveryBadge}>
                  <Text style={styles.liveDiscoveryBadgeText}>LIVE FEED</Text>
                </View>
              </View>
              <Text style={styles.liveDiscoverySub}>
                Discovered from live exchange feed in real-time. Tap to trade or view live chart.
              </Text>

              {additionalLiveStocks.map((stock) => {
                const holding = stockHoldings.find((h) => h.symbol === stock.symbol);
                return (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    heldShares={holding?.shares || 0}
                    onTradePress={(action) => openModal('stock_trade', { stock, action, holding })}
                  />
                );
              })}
            </View>
          )}

          {/* Live Searching Indicator */}
          {isSearchingLive && filteredStocks.length === 0 && (
            <View style={styles.liveSearchingBox}>
              <ActivityIndicator size="small" color={THEME.colors.primaryDark} />
              <Text style={styles.liveSearchingText}>
                Searching live market exchanges for "{searchQuery}"...
              </Text>
            </View>
          )}

          {/* Empty State */}
          {!isSearchingLive && filteredStocks.length === 0 && additionalLiveStocks.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="search" size={32} color={THEME.colors.textMuted} />
              <Text style={styles.emptyStateTitle}>
                {searchQuery.trim() ? `No instruments found for "${searchQuery}"` : 'No instruments found'}
              </Text>
              <Text style={styles.emptyStateSub}>
                {searchQuery.trim()
                  ? 'Search any listed company or ticker symbol worldwide (e.g. SWIGGY, PAYTM, ZOMATO, MRF, AAPL, TSLA).'
                  : 'Try searching for Reliance, TCS, HDFC Bank, Infosys, or Tata Motors.'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    gap: 12,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  cashBadge: {
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radii.pill,
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '45%',
  },
  cashBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  cashBadgeAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.accentYellow,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 6,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: 6,
    borderRadius: THEME.radii.md,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  simulatedTag: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.xs,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  sectionContainer: {
    marginTop: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 8,
    ...THEME.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
    padding: 0,
  },
  filterChipsScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  filterChip: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
  },
  filterChipSelected: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveIndicatorDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D09C',
  },
  freshnessText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  liveDiscoverySection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
  },
  liveDiscoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  liveDiscoveryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D09C',
  },
  liveDiscoveryTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  liveDiscoveryBadge: {
    backgroundColor: '#00D09C15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.xs,
    borderWidth: 1,
    borderColor: '#00D09C40',
  },
  liveDiscoveryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D09C',
    letterSpacing: 0.5,
  },
  liveDiscoverySub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  liveSearchingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  liveSearchingText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptyStateSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
