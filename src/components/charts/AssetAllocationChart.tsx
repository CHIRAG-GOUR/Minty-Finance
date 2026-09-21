import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface AssetAllocationChartProps {
  stockValue: number;
  fundValue: number;
  fdValue: number;
  cashValue: number;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  stockValue,
  fundValue,
  fdValue,
  cashValue,
}) => {
  const total = stockValue + fundValue + fdValue + cashValue;

  const stockPct = total > 0 ? (stockValue / total) * 100 : 0;
  const fundPct = total > 0 ? (fundValue / total) * 100 : 0;
  const fdPct = total > 0 ? (fdValue / total) * 100 : 0;
  const cashPct = total > 0 ? (cashValue / total) * 100 : 100;

  const categories = [
    { label: 'Stocks', value: stockValue, percent: stockPct, color: THEME.colors.primary },
    { label: 'Mutual Funds', value: fundValue, percent: fundPct, color: THEME.colors.secondary },
    { label: 'Fixed Deposits', value: fdValue, percent: fdPct, color: THEME.colors.amber },
    { label: 'Cash Balance', value: cashValue, percent: cashPct, color: THEME.colors.purple },
  ];

  return (
    <View style={styles.container}>
      {/* Visual Stacked Bar */}
      <View style={styles.barTrack}>
        {stockPct > 0 ? (
          <View style={[styles.barSegment, { flex: stockPct, backgroundColor: THEME.colors.primary }]} />
        ) : null}
        {fundPct > 0 ? (
          <View style={[styles.barSegment, { flex: fundPct, backgroundColor: THEME.colors.secondary }]} />
        ) : null}
        {fdPct > 0 ? (
          <View style={[styles.barSegment, { flex: fdPct, backgroundColor: THEME.colors.amber }]} />
        ) : null}
        {cashPct > 0 ? (
          <View style={[styles.barSegment, { flex: cashPct, backgroundColor: THEME.colors.purple }]} />
        ) : null}
      </View>

      {/* Grid of Asset Items */}
      <View style={styles.grid}>
        {categories.map((item, index) => (
          <View key={index} style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.assetLabel}>{item.label}</Text>
            </View>
            <Text style={styles.assetValue}>{formatCurrency(item.value)}</Text>
            <Text style={[styles.assetPercent, { color: item.color }]}>
              {formatPercentage(item.percent, false)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barTrack: {
    height: 12,
    flexDirection: 'row',
    borderRadius: THEME.radii.pill,
    overflow: 'hidden',
    backgroundColor: THEME.colors.cardBorder,
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 10,
    borderRadius: THEME.radii.md,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  assetLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  assetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  assetPercent: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
