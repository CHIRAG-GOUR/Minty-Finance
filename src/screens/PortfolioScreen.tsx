import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { AssetAllocationChart } from '../components/charts/AssetAllocationChart';
import { CompoundGrowthChart } from '../components/charts/CompoundGrowthChart';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { calculateCompoundGrowth } from '../utils/financialMath';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';

type PortfolioSubTab = 'holdings' | 'orders' | 'compound';

export const PortfolioScreen: React.FC = () => {
  const {
    wallet,
    portfolioAnalytics,
    stockCatalog,
    transactions,
    openModal,
    recordCompoundSimulation,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<PortfolioSubTab>('holdings');

  // Compound Growth Visualizer State
  const [initialAmt, setInitialAmt] = useState<number>(25000);
  const [monthlySIP, setMonthlySIP] = useState<number>(5000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [years, setYears] = useState<number>(15);

  const compoundResult = calculateCompoundGrowth(initialAmt, monthlySIP, returnRate, years);

  const handleSimulate = async () => {
    await recordCompoundSimulation();
  };

  const isPos = portfolioAnalytics.totalUnrealizedPnL >= 0;
  const isDayPos = portfolioAnalytics.todayPnL >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Simulated Portfolio</Text>
          <Text style={styles.subtitle}>
            Live dynamic valuation · Virtual positions & transaction ledger
          </Text>
        </View>

        <View style={styles.livePill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.livePillText}>LIVE VALUE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Portfolio Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.cardHeaderLabel}>Total Portfolio Value (Live)</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(portfolioAnalytics.totalPortfolioValue)}
          </Text>

          {/* Today's & Total P&L Row */}
          <View style={styles.pnlRow}>
            <View
              style={[
                styles.pnlPill,
                {
                  backgroundColor: THEME.colors.backgroundSecondary,
                },
              ]}
            >
              <Icon
                name={isPos ? 'arrow-up-right' : 'arrow-down-right'}
                size={13}
                color={isPos ? '#16A34A' : THEME.colors.coral}
              />
              <Text
                style={[
                  styles.pnlText,
                  { color: isPos ? '#16A34A' : THEME.colors.coral },
                ]}
              >
                Total: {isPos ? '+' : ''}
                {formatCurrency(portfolioAnalytics.totalUnrealizedPnL)} (
                {formatPercentage(portfolioAnalytics.totalReturnPercent)})
              </Text>
            </View>

            <View
              style={[
                styles.pnlPill,
                {
                  backgroundColor: THEME.colors.backgroundSecondary,
                },
              ]}
            >
              <Icon
                name={isDayPos ? 'arrow-up-right' : 'arrow-down-right'}
                size={13}
                color={isDayPos ? '#16A34A' : THEME.colors.coral}
              />
              <Text
                style={[
                  styles.pnlText,
                  { color: isDayPos ? '#16A34A' : THEME.colors.coral },
                ]}
              >
                Day: {isDayPos ? '+' : ''}
                {formatCurrency(portfolioAnalytics.todayPnL)}
              </Text>
            </View>
          </View>

          {/* Capital Metrics Grid */}
          <View style={styles.capitalGrid}>
            <View style={styles.capitalItem}>
              <Text style={styles.capitalLabel}>Invested Capital</Text>
              <Text style={styles.capitalVal}>
                {formatCurrency(portfolioAnalytics.totalInvestedAmount)}
              </Text>
            </View>
            <View style={styles.capitalDivider} />
            <View style={styles.capitalItem}>
              <Text style={styles.capitalLabel}>Available Cash</Text>
              <Text style={styles.capitalVal}>
                {formatCurrency(portfolioAnalytics.availableCash)}
              </Text>
            </View>
            <View style={styles.capitalDivider} />
            <View style={styles.capitalItem}>
              <Text style={styles.capitalLabel}>Total Holdings</Text>
              <Text style={styles.capitalVal}>{portfolioAnalytics.holdingsCount} Assets</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Visual Asset Allocation Breakdown */}
          <Text style={styles.allocTitle}>Asset Allocation Breakdown</Text>
          <AssetAllocationChart
            stockValue={portfolioAnalytics.allocation.equitiesValue}
            fundValue={portfolioAnalytics.allocation.fundsValue}
            fdValue={portfolioAnalytics.allocation.fdValue}
            cashValue={portfolioAnalytics.allocation.cashValue}
          />
        </View>

        {/* Sub-Tab Navigation Bar */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSubTab('holdings')}
            style={[styles.subTabBtn, activeSubTab === 'holdings' && styles.subTabBtnActive]}
          >
            <Icon
              name="invest"
              size={14}
              color={activeSubTab === 'holdings' ? '#FFFFFF' : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'holdings' && styles.subTabTextActive,
              ]}
            >
              Holdings ({portfolioAnalytics.enrichedStocks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSubTab('orders')}
            style={[styles.subTabBtn, activeSubTab === 'orders' && styles.subTabBtnActive]}
          >
            <Icon
              name="shield"
              size={14}
              color={activeSubTab === 'orders' ? '#FFFFFF' : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'orders' && styles.subTabTextActive,
              ]}
            >
              Order Ledger ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSubTab('compound')}
            style={[styles.subTabBtn, activeSubTab === 'compound' && styles.subTabBtnActive]}
          >
            <Icon
              name="activity"
              size={14}
              color={activeSubTab === 'compound' ? '#FFFFFF' : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'compound' && styles.subTabTextActive,
              ]}
            >
              Growth Lab
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. HOLDINGS TAB */}
        {activeSubTab === 'holdings' && (
          <View style={styles.section}>
            {portfolioAnalytics.enrichedStocks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="invest" size={28} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTitle}>No active stock holdings</Text>
                <Text style={styles.emptySub}>
                  Explore listed Indian equities on the Markets tab to place virtual orders.
                </Text>
              </View>
            ) : (
              portfolioAnalytics.enrichedStocks.map((h) => {
                const stock = stockCatalog.find((s) => s.symbol === h.symbol);
                const isHoldingPos = h.unrealizedPnL >= 0;

                return (
                  <View key={h.symbol} style={styles.holdingCard}>
                    {/* Holding Header */}
                    <View style={styles.holdingHeader}>
                      <View>
                        <View style={styles.holdingSymbolRow}>
                          <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightBadgeText}>{h.weightPercent}% of portfolio</Text>
                          </View>
                        </View>
                        <Text style={styles.holdingName}>{h.name}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.holdingCurValue}>{formatCurrency(h.currentValue)}</Text>
                        <Text
                          style={[
                            styles.holdingPnL,
                            {
                              color: isHoldingPos
                                ? THEME.colors.primaryDark
                                : THEME.colors.coral,
                            },
                          ]}
                        >
                          {isHoldingPos ? '+' : ''}
                          {formatCurrency(h.unrealizedPnL)} ({formatPercentage(h.returnPercent)})
                        </Text>
                      </View>
                    </View>

                    {/* Holding Stats Bar */}
                    <View style={styles.holdingStatsRow}>
                      <View style={styles.holdingStatCol}>
                        <Text style={styles.holdingStatLabel}>Shares</Text>
                        <Text style={styles.holdingStatVal}>{h.shares} Qty</Text>
                      </View>
                      <View style={styles.holdingStatCol}>
                        <Text style={styles.holdingStatLabel}>Avg Price</Text>
                        <Text style={styles.holdingStatVal}>
                          {formatCurrency(h.averageBuyPrice, true)}
                        </Text>
                      </View>
                      <View style={styles.holdingStatCol}>
                        <Text style={styles.holdingStatLabel}>LTP (Live)</Text>
                        <Text style={styles.holdingStatVal}>
                          {formatCurrency(h.currentPrice, true)}
                        </Text>
                      </View>
                      <View style={styles.holdingStatCol}>
                        <Text style={styles.holdingStatLabel}>Invested</Text>
                        <Text style={styles.holdingStatVal}>
                          {formatCurrency(h.totalInvested)}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Trade Action Triggers */}
                    <View style={styles.holdingActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          stock && openModal('stock_trade', { stock, action: 'buy', holding: h })
                        }
                        style={[styles.holdingBtn, styles.holdingBuyBtn]}
                      >
                        <Text style={styles.holdingBuyBtnText}>Buy More</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          stock && openModal('stock_trade', { stock, action: 'sell', holding: h })
                        }
                        style={[styles.holdingBtn, styles.holdingSellBtn]}
                      >
                        <Text style={styles.holdingSellBtnText}>Sell Position</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* 2. ORDER HISTORY & AUDITABLE TRANSACTION LEDGER TAB */}
        {activeSubTab === 'orders' && (
          <View style={styles.section}>
            {transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="shield" size={28} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTitle}>Ledger is empty</Text>
                <Text style={styles.emptySub}>
                  All simulated orders and virtual statutory charges are recorded here for transparency.
                </Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txCardHeader}>
                    <View style={styles.txBadgeRow}>
                      <View
                        style={[
                          styles.txTypeTag,
                          {
                            backgroundColor: tx.type.includes('buy')
                              ? THEME.colors.primarySurface
                              : THEME.colors.coralSurface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.txTypeTagText,
                            {
                              color: tx.type.includes('buy')
                                ? THEME.colors.primaryDark
                                : THEME.colors.coral,
                            },
                          ]}
                        >
                          {tx.type.toUpperCase().replace('_', ' ')}
                        </Text>
                      </View>
                      <Text style={styles.txOrderId}>
                        Order #{tx.orderId || tx.id.slice(-8)}
                      </Text>
                    </View>

                    <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                  </View>

                  <Text style={styles.txTitle}>{tx.title}</Text>
                  {tx.details && <Text style={styles.txDetails}>{tx.details}</Text>}

                  <View style={styles.txFooter}>
                    <Text style={styles.txTimestamp}>
                      {new Date(tx.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <View style={styles.txStatusPill}>
                      <Text style={styles.txStatusText}>EXECUTED (SIMULATED)</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* 3. COMPOUND GROWTH SIMULATOR LAB TAB */}
        {activeSubTab === 'compound' && (
          <View style={styles.section}>
            <View style={styles.labCard}>
              <View style={styles.labHeader}>
                <View style={styles.labIconBox}>
                  <Icon name="activity" size={18} color={THEME.colors.obsidian} />
                </View>
                <View>
                  <Text style={styles.labTitle}>Long-Term Compound Engine</Text>
                  <Text style={styles.labSub}>
                    Visualize how time and compounding turn small habits into massive wealth
                  </Text>
                </View>
              </View>

              {/* Sliders & Inputs */}
              <View style={styles.calcInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.calcInputLabel}>Initial Investment</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={styles.calcTextInput}
                      keyboardType="numeric"
                      value={initialAmt.toString()}
                      onChangeText={(val) => setInitialAmt(Number(val) || 0)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.calcInputLabel}>Monthly Systematic SIP</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={styles.calcTextInput}
                      keyboardType="numeric"
                      value={monthlySIP.toString()}
                      onChangeText={(val) => setMonthlySIP(Number(val) || 0)}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.calcInputLabel}>Expected Return (%)</Text>
                    <TextInput
                      style={styles.calcTextInput}
                      keyboardType="numeric"
                      value={returnRate.toString()}
                      onChangeText={(val) => setReturnRate(Number(val) || 0)}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.calcInputLabel}>Time Horizon (Years)</Text>
                    <TextInput
                      style={styles.calcTextInput}
                      keyboardType="numeric"
                      value={years.toString()}
                      onChangeText={(val) => setYears(Number(val) || 0)}
                    />
                  </View>
                </View>
              </View>

              {/* Visual Curve */}
              <View style={styles.chartWrapper}>
                <CompoundGrowthChart data={compoundResult.yearlyBreakdown} height={160} />
              </View>

              {/* Results Summary Box */}
              <View style={styles.resultBox}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total Capital Deposited:</Text>
                  <Text style={styles.resultVal}>
                    {formatCurrency(compoundResult.totalInvested)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Compound Interest Wealth Created:</Text>
                  <Text style={[styles.resultVal, { color: THEME.colors.primaryDark }]}>
                    +{formatCurrency(compoundResult.totalInterest)}
                  </Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultRow}>
                  <Text style={styles.resultTotalLabel}>Projected Portfolio Value:</Text>
                  <Text style={styles.resultTotalVal}>
                    {formatCurrency(compoundResult.finalValue)}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title="Simulate & Claim +25 XP"
                  iconName="award"
                  onPress={handleSimulate}
                />
              </View>
            </View>
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
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accentYellow,
  },
  livePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.colors.accentYellow,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  portfolioCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    marginVertical: 8,
    ...THEME.shadows.card,
  },
  cardHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  totalValue: {
    ...THEME.typography.moneyDisplay,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  pnlRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  pnlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.xs,
    gap: 4,
  },
  pnlText: {
    fontSize: 11,
    fontWeight: '800',
  },
  capitalGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginTop: 6,
  },
  capitalItem: {
    flex: 1,
    gap: 2,
  },
  capitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  capitalVal: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  capitalDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 12,
  },
  allocTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 4,
    marginVertical: 10,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    gap: 4,
  },
  subTabBtnActive: {
    backgroundColor: THEME.colors.obsidian,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 6,
    gap: 10,
  },
  emptyCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  holdingCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 8,
    ...THEME.shadows.card,
  },
  holdingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  holdingSymbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  holdingSymbol: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  weightBadge: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  weightBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  holdingName: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  holdingCurValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  holdingPnL: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  holdingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 8,
  },
  holdingStatCol: {
    gap: 2,
  },
  holdingStatLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  holdingStatVal: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  holdingActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  holdingBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdingBuyBtn: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1,
  },
  holdingBuyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
  },
  holdingSellBtn: {
    backgroundColor: THEME.colors.coralSurface,
    borderColor: THEME.colors.coral,
    borderWidth: 1,
  },
  holdingSellBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.coral,
  },
  txCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 6,
    ...THEME.shadows.card,
  },
  txCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txTypeTagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  txOrderId: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  txDetails: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    lineHeight: 14,
  },
  txFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  txTimestamp: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  txStatusPill: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  txStatusText: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  labCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    ...THEME.shadows.card,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  labIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  labSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  calcInputs: {
    gap: 10,
    marginBottom: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calcInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 10,
  },
  inputPrefix: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginRight: 4,
  },
  calcTextInput: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  chartWrapper: {
    height: 160,
    marginVertical: 8,
  },
  resultBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 12,
    gap: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  resultVal: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 4,
  },
  resultTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  resultTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
});
