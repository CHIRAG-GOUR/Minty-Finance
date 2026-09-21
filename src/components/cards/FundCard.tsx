import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { MutualFundItem } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface FundCardProps {
  fund: MutualFundItem;
  heldUnits?: number;
  onInvestPress: () => void;
}

export const FundCard: React.FC<FundCardProps> = ({
  fund,
  heldUnits = 0,
  onInvestPress,
}) => {
  const getRiskColor = () => {
    switch (fund.risk) {
      case 'Low':
        return '#16A34A';
      case 'High':
        return THEME.colors.coral;
      case 'Moderate':
      default:
        return THEME.colors.amber;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{fund.category}</Text>
        </View>

        <View style={[styles.riskBadge, { borderColor: getRiskColor() }]}>
          <Text style={[styles.riskText, { color: getRiskColor() }]}>{fund.risk} Risk</Text>
        </View>
      </View>

      <Text style={styles.fundName}>{fund.name}</Text>
      <Text style={styles.description}>{fund.description}</Text>

      {/* NAV and Returns grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Virtual NAV</Text>
          <Text style={styles.metricValue}>{formatCurrency(fund.nav, true)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>1Y Return</Text>
          <Text style={[styles.metricValue, { color: '#16A34A' }]}>
            {formatPercentage(fund.oneYearReturn)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>3Y Return</Text>
          <Text style={[styles.metricValue, { color: '#16A34A' }]}>
            {formatPercentage(fund.threeYearReturn)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Min Investment</Text>
          <Text style={styles.metricValue}>{formatCurrency(fund.minInvestment)}</Text>
        </View>
      </View>

      {/* Top Holdings preview */}
      <View style={styles.holdingsSection}>
        <Text style={styles.holdingsLabel}>Top Diversified Holdings:</Text>
        <Text style={styles.holdingsList}>{fund.holdingsTop.join(' · ')}</Text>
      </View>

      {/* Footer & Action */}
      <View style={styles.footerRow}>
        <View style={styles.ownershipBox}>
          {heldUnits > 0 ? (
            <Text style={styles.ownedText}>
              Invested: <Text style={styles.ownedHighlight}>{heldUnits.toFixed(2)} units</Text> (
              {formatCurrency(heldUnits * fund.nav)})
            </Text>
          ) : (
            <Text style={styles.noOwnedText}>Start with as little as {formatCurrency(fund.minInvestment)}</Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onInvestPress}
          style={styles.investBtn}
        >
          <Icon name="invest" size={14} color={THEME.colors.accentYellow} />
          <Text style={styles.investBtnText}>Virtual SIP</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: THEME.colors.secondarySurface,
    borderColor: THEME.colors.secondaryMuted,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
  riskBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radii.pill,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fundName: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  description: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  holdingsSection: {
    marginBottom: 12,
  },
  holdingsLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  holdingsList: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
  },
  ownershipBox: {
    flex: 1,
  },
  ownedText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  ownedHighlight: {
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  noOwnedText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  investBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    gap: 6,
  },
  investBtnText: {
    color: THEME.colors.accentYellow,
    fontSize: 12,
    fontWeight: '700',
  },
});
