import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { StockItem } from '../../types';
import { StockLineChart } from '../charts/StockLineChart';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface StockCardProps {
  stock: StockItem;
  heldShares?: number;
  onTradePress: (action: 'buy' | 'sell') => void;
  onCardPress?: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  heldShares = 0,
  onTradePress,
  onCardPress,
}) => {
  const isPositive = stock.changePercent >= 0;
  const trendColor = isPositive ? '#16A34A' : THEME.colors.coral;

  const getRiskColor = () => {
    switch (stock.risk) {
      case 'Low':
        return THEME.colors.primary;
      case 'High':
        return THEME.colors.coral;
      case 'Moderate':
      default:
        return THEME.colors.amber;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onCardPress || (() => onTradePress('buy'))}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.companyInfo}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>{stock.symbol}</Text>
            <View style={[styles.riskBadge, { borderColor: getRiskColor() }]}>
              <Text style={[styles.riskText, { color: getRiskColor() }]}>{stock.risk} Risk</Text>
            </View>
          </View>
          <Text style={styles.companyName} numberOfLines={1}>
            {stock.name}
          </Text>
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.price}>{formatCurrency(stock.currentPrice, true)}</Text>
          <View style={styles.changeRow}>
            <Icon
              name={isPositive ? 'arrow-up-right' : 'arrow-down-right'}
              size={12}
              color={trendColor}
            />
            <Text style={[styles.changeText, { color: trendColor }]}>
              {isPositive ? '+' : ''}{formatPercentage(stock.changePercent)}
            </Text>
          </View>
        </View>
      </View>

      {/* Mini Sparkline Chart */}
      <View style={styles.chartWrapper}>
        <StockLineChart
          data={stock.sparkline}
          color={trendColor}
          height={80}
          showLabels={false}
        />
      </View>

      {/* Key Stats Pill Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sector</Text>
          <Text style={styles.statValue} numberOfLines={1}>{stock.sector}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mkt Cap</Text>
          <Text style={styles.statValue}>{stock.marketCap}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>P/E Ratio</Text>
          <Text style={styles.statValue}>{stock.peRatio}</Text>
        </View>
      </View>

      {/* Holding & Trade Actions */}
      <View style={styles.footerRow}>
        <View style={styles.holdingStatus}>
          {heldShares > 0 ? (
            <Text style={styles.holdingText}>
              Owned: <Text style={styles.holdingHighlight}>{heldShares} shares</Text> (
              {formatCurrency(heldShares * stock.currentPrice)})
            </Text>
          ) : (
            <Text style={styles.noHoldingText}>No active shares</Text>
          )}
        </View>

        <View style={styles.tradeButtons}>
          {heldShares > 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onTradePress('sell')}
              style={[styles.tradeBtn, styles.sellBtn]}
            >
              <Text style={styles.sellBtnText}>Sell</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onTradePress('buy')}
            style={[styles.tradeBtn, styles.buyBtn]}
          >
            <Text style={styles.buyBtnText}>Buy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.xs,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  riskBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.pill,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartWrapper: {
    marginVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 8,
    borderRadius: THEME.radii.md,
    marginVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
  },
  holdingStatus: {
    flex: 1,
  },
  holdingText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  holdingHighlight: {
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  noHoldingText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  tradeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tradeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    backgroundColor: THEME.colors.obsidian,
  },
  buyBtnText: {
    color: THEME.colors.accentYellow,
    fontSize: 12,
    fontWeight: '700',
  },
  sellBtn: {
    backgroundColor: THEME.colors.coralSurface,
    borderColor: THEME.colors.coralLight,
    borderWidth: 1,
  },
  sellBtnText: {
    color: THEME.colors.coral,
    fontSize: 12,
    fontWeight: '700',
  },
});
