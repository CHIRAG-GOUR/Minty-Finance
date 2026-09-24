import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export const BalanceCard: React.FC = () => {
  const { wallet, portfolioAnalytics, setActiveTab, openModal } = useApp();

  const btnScale1 = useRef(new Animated.Value(1)).current;
  const btnScale2 = useRef(new Animated.Value(1)).current;

  const animatePress = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const isTotalPos = portfolioAnalytics.totalUnrealizedPnL >= 0;
  const isDayPos = portfolioAnalytics.todayPnL >= 0;

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandTitle}>Minty Finance</Text>
      </View>

      {/* Portfolio Value */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Portfolio Value</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(portfolioAnalytics.totalPortfolioValue)}
        </Text>
      </View>

      {/* P&L Row */}
      <View style={styles.pnlGrid}>
        <View style={styles.pnlBox}>
          <Text style={styles.pnlBoxLabel}>Today</Text>
          <View style={styles.pnlValueRow}>
            <Icon
              name={isDayPos ? 'arrow-up-right' : 'arrow-down-right'}
              size={12}
              color={isDayPos ? '#16A34A' : THEME.colors.coral}
            />
            <Text
              style={[
                styles.pnlBoxValue,
                { color: isDayPos ? '#16A34A' : THEME.colors.coral },
              ]}
            >
              {isDayPos ? '+' : ''}
              {formatCurrency(portfolioAnalytics.todayPnL)} ({formatPercentage(portfolioAnalytics.todayPnLPercent)})
            </Text>
          </View>
        </View>

        <View style={styles.pnlDivider} />

        <View style={styles.pnlBox}>
          <Text style={styles.pnlBoxLabel}>Total P&L</Text>
          <View style={styles.pnlValueRow}>
            <Icon
              name={isTotalPos ? 'arrow-up-right' : 'arrow-down-right'}
              size={12}
              color={isTotalPos ? '#16A34A' : THEME.colors.coral}
            />
            <Text
              style={[
                styles.pnlBoxValue,
                { color: isTotalPos ? '#16A34A' : THEME.colors.coral },
              ]}
            >
              {isTotalPos ? '+' : ''}
              {formatCurrency(portfolioAnalytics.totalUnrealizedPnL)} ({formatPercentage(portfolioAnalytics.totalReturnPercent)})
            </Text>
          </View>
        </View>
      </View>

      {/* Allocation progress bar */}
      <View style={styles.breakdownBar}>
        <View
          style={[
            styles.barSegment,
            {
              flex: Math.max(1, portfolioAnalytics.allocation.cashValue),
              backgroundColor: THEME.colors.obsidian,
            },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            {
              flex: Math.max(0.01, portfolioAnalytics.allocation.equitiesValue),
              backgroundColor: THEME.colors.accentYellow,
            },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            {
              flex: Math.max(0.01, portfolioAnalytics.allocation.fundsValue),
              backgroundColor: THEME.colors.secondary,
            },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            {
              flex: Math.max(0.01, portfolioAnalytics.allocation.fdValue),
              backgroundColor: '#9333EA',
            },
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Cash</Text>
          <Text style={styles.statValue}>{formatCurrency(wallet.cashBalance)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Stocks</Text>
          <Text style={styles.statValue}>
            {formatCurrency(portfolioAnalytics.allocation.equitiesValue)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Funds & FDs</Text>
          <Text style={styles.statValue}>
            {formatCurrency(
              portfolioAnalytics.allocation.fundsValue + portfolioAnalytics.allocation.fdValue
            )}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Animated.View style={{ flex: 1, transform: [{ scale: btnScale1 }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => animatePress(btnScale1)}
            onPress={() => setActiveTab('invest')}
            style={styles.actionBtnDark}
          >
            <Icon name="stocks" size={15} color={THEME.colors.accentYellow} />
            <Text style={styles.actionBtnDarkText}>Explore Stocks</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ flex: 1, transform: [{ scale: btnScale2 }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => animatePress(btnScale2)}
            onPress={() => setActiveTab('portfolio')}
            style={styles.actionBtnYellow}
          >
            <Icon name="pie-chart" size={15} color={THEME.colors.obsidian} />
            <Text style={styles.actionBtnYellowText}>Portfolio</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.obsidian,
    letterSpacing: -0.3,
  },
  simBadge: {
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.xs,
  },
  simBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
    letterSpacing: 0.8,
  },
  balanceSection: {
    marginVertical: 2,
  },
  balanceLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  balanceAmount: {
    ...THEME.typography.moneyDisplay,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  pnlGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  pnlBox: {
    flex: 1,
    gap: 2,
  },
  pnlBoxLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  pnlValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pnlBoxValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  pnlDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginHorizontal: 8,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: THEME.colors.backgroundSecondary,
    marginTop: 14,
    marginBottom: 10,
  },
  barSegment: {
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    gap: 6,
    backgroundColor: THEME.colors.obsidian,
  },
  actionBtnDarkText: {
    color: THEME.colors.accentYellow,
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    gap: 6,
    backgroundColor: THEME.colors.accentYellow,
  },
  actionBtnYellowText: {
    color: THEME.colors.obsidian,
    fontSize: 12,
    fontWeight: '800',
  },
});
