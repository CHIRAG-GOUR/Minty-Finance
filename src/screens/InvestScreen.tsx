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
import { SegmentedControl } from '../components/common/SegmentedControl';
import { StockCard } from '../components/cards/StockCard';
import { FundCard } from '../components/cards/FundCard';
import { FDCard } from '../components/cards/FDCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { calculateFDMaturity } from '../utils/financialMath';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';
import { MarketDataService } from '../services/marketDataService';

type InvestTab = 'stocks' | 'funds' | 'fds' | 'shark_tank';
type StockFilter = 'all' | 'large_cap' | 'mid_cap' | 'small_cap' | 'gainers' | 'losers' | 'most_active' | 'watchlist';

export const InvestScreen: React.FC = () => {
  const {
    wallet,
    stockCatalog,
    fundCatalog,
    sharkTankStartups,
    stockHoldings,
    fundHoldings,
    fdHoldings,
    marketStatus,
    watchlist,
    openModal,
  } = useApp();

  const [selectedSubTab, setSelectedSubTab] = useState<InvestTab>('stocks');
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

  // FD Simulator state
  const [fdPrincipal, setFdPrincipal] = useState<number>(25000);
  const [fdMonths, setFdMonths] = useState<number>(12);
  const [fdRate, setFdRate] = useState<number>(7.2); // HDFC Bank / SBI benchmark
  const [selectedBank, setSelectedBank] = useState<string>('State Bank of India');

  const fdCalc = calculateFDMaturity(fdPrincipal, fdRate, fdMonths);

  const subTabOptions = [
    { id: 'stocks' as InvestTab, label: 'Stocks', iconName: 'stocks' },
    { id: 'funds' as InvestTab, label: 'Mutual Funds', iconName: 'funds' },
    { id: 'fds' as InvestTab, label: 'Fixed Deposits', iconName: 'fd' },
    { id: 'shark_tank' as InvestTab, label: 'Shark Tank', iconName: 'rocket' },
  ];

  const filterChips: { id: StockFilter; label: string }[] = [
    { id: 'all', label: 'All Stocks' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'large_cap', label: 'Large Cap' },
    { id: 'gainers', label: 'Top Gainers' },
    { id: 'losers', label: 'Top Losers' },
    { id: 'most_active', label: 'Most Active' },
  ];

  const bankOptions = [
    { name: 'State Bank of India', rate: 6.8 },
    { name: 'HDFC Bank', rate: 7.2 },
    { name: 'ICICI Bank', rate: 7.1 },
    { name: 'Kotak Mahindra Bank', rate: 7.4 },
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
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Market Trading Floor
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Real Indian market feeds · Virtual ₹1,00,000 practice capital
          </Text>
        </View>

        <View style={styles.cashBadge}>
          <Text style={styles.cashBadgeLabel}>Cash</Text>
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

      {/* Segmented Control */}
      <View style={styles.tabContainer}>
        <SegmentedControl<InvestTab>
          options={subTabOptions}
          selectedId={selectedSubTab}
          onSelect={setSelectedSubTab}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STOCKS TAB */}
        {selectedSubTab === 'stocks' && (
          <View style={styles.sectionContainer}>
            {/* Search Input */}
            <View style={styles.searchBarContainer}>
              <Icon name="search" size={16} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search any stock on Yahoo in real-time (e.g. Swiggy, Paytm, Tesla, MRF)..."
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

            {/* Quick Suggestions when search input is empty */}
            {searchQuery.length === 0 && (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionChipsScroll}
              >
                <Text style={styles.suggestionLabel}>Try searching:</Text>
                {['Swiggy', 'Paytm', 'Zomato', 'Tata Motors', 'Tesla', 'MRF', 'Suzlon', 'Apple'].map((term) => (
                  <TouchableOpacity
                    key={term}
                    activeOpacity={0.7}
                    onPress={() => setSearchQuery(term)}
                    style={styles.suggestionChip}
                  >
                    <Text style={styles.suggestionChipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

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
                <Text style={styles.freshnessText}>YAHOO LIVE FEED</Text>
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

            {/* Live Yahoo Finance Discovery Section */}
            {additionalLiveStocks.length > 0 && (
              <View style={styles.liveDiscoverySection}>
                <View style={styles.liveDiscoveryHeader}>
                  <View style={styles.liveDiscoveryHeaderLeft}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveDiscoveryTitle}>Live Yahoo Real-Time Results</Text>
                  </View>
                  <View style={styles.liveDiscoveryBadge}>
                    <Text style={styles.liveDiscoveryBadgeText}>YAHOO LIVE</Text>
                  </View>
                </View>
                <Text style={styles.liveDiscoverySub}>
                  Discovered from live Yahoo exchange feed in real-time. Tap to trade or view live chart.
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
                  Searching Yahoo Finance live exchange for "{searchQuery}"...
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
        )}

        {/* MUTUAL FUNDS TAB */}
        {selectedSubTab === 'funds' && (
          <View style={styles.sectionContainer}>
            <View style={styles.tabIntro}>
              <Text style={styles.introHeading}>Indian Mutual Funds Universe</Text>
              <Text style={styles.introText}>
                Diversify across professionally managed baskets of Indian equities. Track real NAVs and simulate systematic SIP investments.
              </Text>
            </View>

            {fundCatalog.map((fund) => {
              const holding = fundHoldings.find((h) => h.id === fund.id);
              return (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  heldUnits={holding?.units || 0}
                  onInvestPress={() => openModal('fund_invest', { fund, holding })}
                />
              );
            })}
          </View>
        )}

        {/* FIXED DEPOSITS TAB */}
        {selectedSubTab === 'fds' && (
          <View style={styles.sectionContainer}>
            <View style={styles.tabIntro}>
              <Text style={styles.introHeading}>Guaranteed Fixed Deposits</Text>
              <Text style={styles.introText}>
                Lock away virtual cash in regulated banking Fixed Deposits. Learn how compounding interest guarantees capital growth without market volatility.
              </Text>
            </View>

            {/* Interactive FD Simulator Tool Card */}
            <View style={styles.fdCalcCard}>
              <View style={styles.fdCalcHeader}>
                <View style={styles.fdIconBox}>
                  <Icon name="shield" size={18} color={THEME.colors.obsidian} />
                </View>
                <View>
                  <Text style={styles.fdCalcTitle}>FD Maturity & Compound Calculator</Text>
                  <Text style={styles.fdCalcSub}>
                    Simulate interest compounding across Indian banks
                  </Text>
                </View>
              </View>

              {/* Bank Selector */}
              <Text style={styles.inputLabel}>Select Bank & Annual Interest Rate</Text>
              <View style={styles.bankGrid}>
                {bankOptions.map((bank) => {
                  const isBankSelected = selectedBank === bank.name;
                  return (
                    <TouchableOpacity
                      key={bank.name}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedBank(bank.name);
                        setFdRate(bank.rate);
                      }}
                      style={[
                        styles.bankCard,
                        isBankSelected && styles.bankCardSelected,
                      ]}
                    >
                      <Text style={[styles.bankName, isBankSelected && styles.bankNameSelected]}>
                        {bank.name}
                      </Text>
                      <Text style={[styles.bankRate, isBankSelected && styles.bankRateSelected]}>
                        {bank.rate}% p.a.
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Principal Amount Buttons */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Deposit Amount (Virtual Cash)</Text>
              <View style={styles.chipRow}>
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setFdPrincipal(amt)}
                    style={[
                      styles.amtChip,
                      fdPrincipal === amt && styles.amtChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.amtChipText,
                        fdPrincipal === amt && styles.amtChipTextSelected,
                      ]}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration Buttons */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tenure / Lock-in Duration</Text>
              <View style={styles.chipRow}>
                {[
                  { m: 6, label: '6 Months' },
                  { m: 12, label: '1 Year' },
                  { m: 36, label: '3 Years' },
                  { m: 60, label: '5 Years' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.m}
                    onPress={() => setFdMonths(item.m)}
                    style={[
                      styles.amtChip,
                      fdMonths === item.m && styles.amtChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.amtChipText,
                        fdMonths === item.m && styles.amtChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Maturity Calculation Results Box */}
              <View style={styles.maturityBox}>
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityLabel}>Principal Invested</Text>
                  <Text style={styles.maturityValue}>{formatCurrency(fdPrincipal)}</Text>
                </View>
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityLabel}>Guaranteed Interest Earned</Text>
                  <Text style={[styles.maturityValue, { color: THEME.colors.primaryDark }]}>
                    +{formatCurrency(fdCalc.earnedInterest)}
                  </Text>
                </View>
                <View style={styles.maturityDivider} />
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityTotalLabel}>Estimated Maturity Amount</Text>
                  <Text style={styles.maturityTotalValue}>
                    {formatCurrency(fdCalc.maturityAmount)}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={`Lock ₹${fdPrincipal.toLocaleString('en-IN')} in ${selectedBank}`}
                  onPress={() =>
                    openModal('open_fd_confirm', {
                      principal: fdPrincipal,
                      durationMonths: fdMonths,
                      rate: fdRate,
                      maturityAmount: fdCalc.maturityAmount,
                      bankName: selectedBank,
                    })
                  }
                />
              </View>
            </View>

            {/* Active Fixed Deposits */}
            {fdHoldings.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.activeFDHeading}>Active Fixed Deposits ({fdHoldings.length})</Text>
                {fdHoldings.map((fd) => (
                  <FDCard key={fd.id} fd={fd} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* SHARK TANK TAB */}
        {selectedSubTab === 'shark_tank' && (
          <View style={styles.sectionContainer}>
            <View style={styles.tabIntro}>
              <Text style={styles.introHeading}>Student Venture Pitch Arena</Text>
              <Text style={styles.introText}>
                Step into the shoes of an angel investor. Evaluate student business models, unit economics, and negotiate equity deals.
              </Text>
            </View>

            {sharkTankStartups.map((startup) => (
              <TouchableOpacity
                key={startup.id}
                activeOpacity={0.8}
                onPress={() => openModal('shark_tank', startup)}
                style={styles.startupCard}
              >
                <View style={styles.startupHeader}>
                  <View>
                    <Text style={styles.startupName}>{startup.name}</Text>
                    <Text style={styles.startupTagline}>{startup.tagline}</Text>
                  </View>
                  <View style={styles.cohortBadge}>
                    <Text style={styles.cohortBadgeText}>{startup.cohort}</Text>
                  </View>
                </View>

                <View style={styles.startupMetricsRow}>
                  <View style={styles.startupMetric}>
                    <Text style={styles.startupMetricLabel}>Ask</Text>
                    <Text style={styles.startupMetricVal}>
                      {formatCurrency(startup.askAmount)} ({startup.askEquityPercent}%)
                    </Text>
                  </View>
                  <View style={styles.startupMetric}>
                    <Text style={styles.startupMetricLabel}>Valuation</Text>
                    <Text style={styles.startupMetricVal}>{formatCurrency(startup.valuation)}</Text>
                  </View>
                  <View style={styles.startupMetric}>
                    <Text style={styles.startupMetricLabel}>Monthly Sales</Text>
                    <Text style={styles.startupMetricVal}>
                      {formatCurrency(startup.monthlyRevenue)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => openModal('shark_tank', startup)}
                  style={styles.evaluateDealBtn}
                >
                  <Text style={styles.evaluateDealBtnText}>Evaluate Pitch & Invest</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  /**
   * React Native defaults flexShrink to 0, so without this the long subtitle
   * kept its intrinsic width and pushed the cash badge off the right edge.
   */
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
  tabContainer: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  sectionContainer: {
    marginTop: 8,
  },
  tabIntro: {
    marginBottom: 12,
  },
  introHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  introText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
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
  suggestionChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  suggestionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginRight: 2,
  },
  suggestionChip: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderSubtle,
  },
  suggestionChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
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
    marginBottom: 6,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#00D09C33',
  },
  liveDiscoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
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
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  liveDiscoveryBadge: {
    backgroundColor: '#00D09C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDiscoveryBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveDiscoverySub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  liveSearchingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    marginVertical: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  liveSearchingText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptyStateSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  fdCalcCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    ...THEME.shadows.card,
  },
  fdCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  fdIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fdCalcTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  fdCalcSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    borderColor: THEME.colors.cardBorderSubtle,
    borderWidth: 1,
  },
  bankCardSelected: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primary,
    borderWidth: 1.5,
  },
  bankName: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  bankNameSelected: {
    color: THEME.colors.primaryDark,
    fontWeight: '900',
  },
  bankRate: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  bankRateSelected: {
    color: THEME.colors.primaryDark,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amtChip: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingVertical: 8,
    alignItems: 'center',
    borderColor: THEME.colors.cardBorderSubtle,
    borderWidth: 1,
  },
  amtChipSelected: {
    backgroundColor: THEME.colors.accentYellow,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1.5,
  },
  amtChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  amtChipTextSelected: {
    color: THEME.colors.obsidian,
  },
  maturityBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  maturityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maturityLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  maturityValue: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  maturityDivider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 4,
  },
  maturityTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  maturityTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  activeFDHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  startupCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    marginBottom: 12,
    ...THEME.shadows.card,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  startupName: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  startupTagline: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  cohortBadge: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cohortBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  startupMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 10,
  },
  startupMetric: {
    gap: 2,
  },
  startupMetricLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  startupMetricVal: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  evaluateDealBtn: {
    backgroundColor: THEME.colors.accentYellow,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1.5,
    paddingVertical: 9,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evaluateDealBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
});
