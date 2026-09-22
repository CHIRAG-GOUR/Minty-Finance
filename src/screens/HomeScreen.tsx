import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { BalanceCard } from '../components/cards/BalanceCard';
import { XPProgressCard } from '../components/cards/XPProgressCard';
import { StockLineChart } from '../components/charts/StockLineChart';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';

export const HomeScreen: React.FC = () => {
  const {
    stockCatalog,
    sharkTankStartups,
    challenges,
    userProfile,
    marketStatus,
    watchlist,
    transactions,
    setActiveTab,
    openModal,
    refreshMarketData,
  } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const activeMission = challenges.find((c) => !c.isCompleted) || challenges[0];
  const nifty = stockCatalog.find((s) => s.symbol === 'NIFTY 50');
  const sensex = stockCatalog.find((s) => s.symbol === 'SENSEX');
  const watchedStocks = stockCatalog.filter((s) => watchlist.includes(s.symbol));
  const topGainers = stockCatalog
    .filter((s) => s.symbol !== 'NIFTY 50' && s.symbol !== 'SENSEX')
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 4);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Virtual Portfolio & Cash Command Card */}
        <BalanceCard />

        {/* Level & XP Progress Card */}
        <XPProgressCard />

        {/* Market Status — clean minimal row */}
        <View style={styles.marketStatusBar}>
          <View style={styles.marketStatusLeft}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: marketStatus.isOpen
                    ? THEME.colors.accentYellow
                    : THEME.colors.coral,
                },
              ]}
            />
            <View>
              <Text style={styles.marketStatusText}>
                {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
              </Text>
              <Text style={styles.marketTimingSub}>
                {marketStatus.isOpen ? '09:15 — 15:30 IST' : marketStatus.nextSessionTime}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={refreshMarketData}
            style={styles.refreshBtn}
          >
            <Icon name="refresh" size={14} color={THEME.colors.obsidian} />
          </TouchableOpacity>
        </View>

        {/* Benchmark Indices */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Indices</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('markets')}>
              <Text style={styles.seeAllText}>All Equities →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.indicesRow}>
            {nifty && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openModal('stock_trade', { stock: nifty, action: 'buy' })}
                style={styles.indexCard}
              >
                <Text style={styles.indexSymbol}>NIFTY 50</Text>
                <Text style={styles.indexPrice}>
                  {formatCurrency(nifty.currentPrice, false)}
                </Text>
                <View style={styles.indexChangeRow}>
                  <Icon
                    name={nifty.changePercent >= 0 ? 'arrow-up-right' : 'arrow-down-left'}
                    size={12}
                    color={nifty.changePercent >= 0 ? '#00D09C' : THEME.colors.coral}
                  />
                  <Text
                    style={[
                      styles.indexChangeText,
                      { color: nifty.changePercent >= 0 ? '#00D09C' : THEME.colors.coral },
                    ]}
                  >
                    {formatPercentage(nifty.changePercent)}
                  </Text>
                </View>
                <View style={{ height: 40, marginTop: 4 }}>
                  <StockLineChart
                    data={nifty.sparkline}
                    color={nifty.changePercent >= 0 ? '#00D09C' : THEME.colors.coral}
                    height={40}
                    showLabels={false}
                  />
                </View>
              </TouchableOpacity>
            )}

            {sensex && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openModal('stock_trade', { stock: sensex, action: 'buy' })}
                style={styles.indexCard}
              >
                <Text style={styles.indexSymbol}>SENSEX</Text>
                <Text style={styles.indexPrice}>
                  {formatCurrency(sensex.currentPrice, false)}
                </Text>
                <View style={styles.indexChangeRow}>
                  <Icon
                    name={sensex.changePercent >= 0 ? 'arrow-up-right' : 'arrow-down-left'}
                    size={12}
                    color={sensex.changePercent >= 0 ? '#00D09C' : THEME.colors.coral}
                  />
                  <Text
                    style={[
                      styles.indexChangeText,
                      { color: sensex.changePercent >= 0 ? '#00D09C' : THEME.colors.coral },
                    ]}
                  >
                    {formatPercentage(sensex.changePercent)}
                  </Text>
                </View>
                <View style={{ height: 40, marginTop: 4 }}>
                  <StockLineChart
                    data={sensex.sparkline}
                    color={sensex.changePercent >= 0 ? '#00D09C' : THEME.colors.coral}
                    height={40}
                    showLabels={false}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Watchlist */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('markets')}>
              <Text style={styles.seeAllText}>Explore →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marketScroll}
          >
            {watchedStocks.map((stock) => {
              const isPos = stock.changePercent >= 0;
              return (
                <TouchableOpacity
                  key={stock.id}
                  activeOpacity={0.85}
                  onPress={() => openModal('stock_trade', { stock, action: 'buy' })}
                  style={styles.marketCard}
                >
                  <Text style={styles.watchSymbol}>{stock.symbol}</Text>
                  <Text style={styles.watchName} numberOfLines={1}>
                    {stock.name}
                  </Text>
                  <Text style={styles.watchPrice}>
                    {formatCurrency(stock.currentPrice, true)}
                  </Text>
                  <View style={styles.watchChangeRow}>
                    <Icon
                      name={isPos ? 'arrow-up-right' : 'arrow-down-right'}
                      size={11}
                      color={isPos ? '#16A34A' : THEME.colors.coral}
                    />
                    <Text
                      style={[
                        styles.watchChangeText,
                        { color: isPos ? '#16A34A' : THEME.colors.coral },
                      ]}
                    >
                      {formatPercentage(stock.changePercent)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Top Market Movers */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Movers</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('markets')}>
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moversList}>
            {topGainers.map((stock, index) => (
              <TouchableOpacity
                key={stock.id}
                activeOpacity={0.85}
                onPress={() => openModal('stock_trade', { stock, action: 'buy' })}
                style={[
                  styles.moverItem,
                  index < topGainers.length - 1 && styles.moverItemBorder,
                ]}
              >
                <View style={styles.moverLeft}>
                  <View style={styles.moverIconBox}>
                    <Text style={styles.moverSymbol}>{stock.symbol.substring(0, 3)}</Text>
                  </View>
                  <View>
                    <Text style={styles.moverName}>{stock.name}</Text>
                    <Text style={styles.moverSector}>{stock.sector}</Text>
                  </View>
                </View>

                <View style={styles.moverRight}>
                  <Text style={styles.moverPrice}>
                    {formatCurrency(stock.currentPrice, true)}
                  </Text>
                  <Text
                    style={[
                      styles.moverChange,
                      {
                        color: stock.changePercent >= 0 ? '#16A34A' : THEME.colors.coral,
                      },
                    ]}
                  >
                    {formatPercentage(stock.changePercent)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily Investment Challenge */}
        {activeMission && (
          <View style={styles.section}>
            <View style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <Text style={styles.missionBadgeText}>Daily Mission</Text>
                <Text style={styles.missionXP}>+{activeMission.xpReward} XP</Text>
              </View>

              <Text style={styles.missionTitle}>{activeMission.title}</Text>
              <Text style={styles.missionDesc}>{activeMission.description}</Text>

              <View style={styles.missionFooter}>
                <View style={styles.missionProgressBox}>
                  <View
                    style={[
                      styles.missionProgressBar,
                      {
                        width: `${Math.min(
                          100,
                          (activeMission.progress / activeMission.target) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.missionProgressText}>
                  {activeMission.progress}/{activeMission.target}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Compound Time Machine Fast Action Card */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => openModal('compound_calculator')}
            style={styles.compoundCard}
          >
            <View style={styles.compoundCardLeft}>
              <View style={styles.compoundBadge}>
                <Icon name="growth" size={14} color={THEME.colors.accentYellow} />
                <Text style={styles.compoundBadgeText}>8TH WONDER OF THE WORLD</Text>
              </View>
              <Text style={styles.compoundCardTitle}>Compound Time Machine</Text>
              <Text style={styles.compoundCardSubtitle}>
                Simulate your wealth growth over 5, 10, 20 & 30 years with SIP compounding math.
              </Text>
            </View>
            <View style={styles.compoundCardBtn}>
              <Text style={styles.compoundCardBtnText}>Simulate →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveTab('portfolio')}>
                <Text style={styles.seeAllText}>Full Ledger →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentTxList}>
              {transactions.slice(0, 3).map((tx, index) => (
                <View
                  key={tx.id}
                  style={[
                    styles.recentTxItem,
                    index < 2 && styles.recentTxItemBorder,
                  ]}
                >
                  <View style={styles.recentTxLeft}>
                    <View
                      style={[
                        styles.txTypeIcon,
                        {
                          backgroundColor: tx.type.includes('buy')
                            ? THEME.colors.obsidian
                            : THEME.colors.accentYellowSurface,
                        },
                      ]}
                    >
                      <Icon
                        name={tx.type.includes('buy') ? 'arrow-down-right' : 'arrow-up-right'}
                        size={14}
                        color={tx.type.includes('buy') ? THEME.colors.accentYellow : THEME.colors.obsidian}
                      />
                    </View>
                    <View style={styles.recentTxTextWrap}>
                      <Text style={styles.recentTxTitle} numberOfLines={2} ellipsizeMode="tail">
                        {tx.title}
                      </Text>
                      <Text style={styles.recentTxTime}>
                        {new Date(tx.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recentTxAmount}>
                    {formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    // Must clear the floating dock (66px tall plus its bottom offset), or the
    // last card sits permanently behind the tab bar and cannot be reached.
    paddingBottom: 120,
  },
  // Market Status - clean flat bar, no green pill
  marketStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: 4,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  marketStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  marketStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  marketTimingSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 18,
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  // Index cards — clean, no green pills
  indicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  indexCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  indexSymbol: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  indexPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  indexChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  indexChangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Watchlist — clean card, no green pill
  marketScroll: {
    gap: 12,
    paddingRight: 16,
  },
  marketCard: {
    width: 140,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  watchSymbol: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  watchName: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  watchPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  watchChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  watchChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Market movers — clean list
  moversList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    paddingHorizontal: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  moverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  moverItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorderSubtle,
  },
  moverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moverIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moverSymbol: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  moverName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  moverSector: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  moverRight: {
    alignItems: 'flex-end',
  },
  moverPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  moverChange: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Mission card — dark obsidian, yellow accents
  missionCard: {
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: 18,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  missionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  missionXP: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.accentYellow,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  missionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 17,
  },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionProgressBox: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  missionProgressBar: {
    height: '100%',
    backgroundColor: THEME.colors.accentYellow,
    borderRadius: 3,
  },
  missionProgressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  // Recent Tx — clean list with icon boxes
  recentTxList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    paddingHorizontal: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  recentTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  recentTxItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorderSubtle,
  },
  recentTxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentTxTextWrap: {
    flex: 1,
    paddingRight: 4,
  },
  txTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentTxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 16,
  },
  recentTxTime: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  recentTxAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'right',
    flexShrink: 0,
  },
  compoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...THEME.shadows.card,
  },
  compoundCardLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  compoundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    marginBottom: 2,
  },
  compoundBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.colors.accentYellow,
    letterSpacing: 0.5,
  },
  compoundCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textInverse,
  },
  compoundCardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  compoundCardBtn: {
    backgroundColor: THEME.colors.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
  },
  compoundCardBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
});
