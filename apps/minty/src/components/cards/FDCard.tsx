import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { FixedDepositHolding } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface FDCardProps {
  fd: FixedDepositHolding;
}

export const FDCard: React.FC<FDCardProps> = ({ fd }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftTitle}>
          <View style={styles.iconBox}>
            <Icon name="fd" size={18} color={THEME.colors.amber} />
          </View>
          <View>
            <Text style={styles.title}>{fd.durationMonths} Month Fixed Deposit</Text>
            <Text style={styles.rateBadge}>Guaranteed {fd.interestRate}% p.a. Compounded</Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <Icon name="lock" size={12} color={THEME.colors.primary} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.label}>Principal Deposited</Text>
          <Text style={styles.value}>{formatCurrency(fd.principal)}</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.label}>Interest Earned</Text>
          <Text style={[styles.value, { color: THEME.colors.primary }]}>
            +{formatCurrency(fd.earnedInterest)}
          </Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.label}>Maturity Value</Text>
          <Text style={[styles.value, { color: THEME.colors.textPrimary, fontWeight: '800' }]}>
            {formatCurrency(fd.maturityAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.dateText}>
          Matures on: {formatDate(fd.maturityDate)}
        </Text>
        <View style={styles.safeTag}>
          <Icon name="shield" size={12} color={THEME.colors.primary} />
          <Text style={styles.safeTagText}>Zero Market Volatility</Text>
        </View>
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
    marginBottom: 12,
  },
  leftTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.amberSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    ...THEME.typography.h4,
    color: THEME.colors.textPrimary,
  },
  rateBadge: {
    fontSize: 11,
    color: THEME.colors.amber,
    fontWeight: '700',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safeTagText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
});
