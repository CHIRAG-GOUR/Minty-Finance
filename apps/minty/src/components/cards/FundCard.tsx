import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { MutualFundItem } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { StockLineChart } from '../charts/StockLineChart';

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
  const getFundEmblem = (name: string) => {
    if (name.includes('Nippon')) return { bg: '#DC2626', text: 'N', color: '#FFFFFF' };
    if (name.includes('SBI')) return { bg: '#0284C7', text: 'SBI', color: '#FFFFFF' };
    if (name.includes('HDFC')) return { bg: '#1E3A8A', text: 'HDFC', color: '#FFFFFF' };
    if (name.includes('Parag')) return { bg: '#D97706', text: 'PP', color: '#FFFFFF' };
    if (name.includes('Mirae')) return { bg: '#0D9488', text: 'MA', color: '#FFFFFF' };
    if (name.includes('UTI')) return { bg: '#7C3AED', text: 'UTI', color: '#FFFFFF' };
    return { bg: '#00D09C', text: 'MF', color: '#FFFFFF' };
  };

  const emblem = getFundEmblem(fund.name);

  // Synthetic sparkline for fund card
  const sparkline = [
    fund.nav * 0.85,
    fund.nav * 0.88,
    fund.nav * 0.92,
    fund.nav * 0.91,
    fund.nav * 0.96,
    fund.nav * 0.98,
    fund.nav,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onInvestPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.fundHeaderLeft}>
          <View style={[styles.emblemBox, { backgroundColor: emblem.bg }]}>
            <Text style={[styles.emblemText, { color: emblem.color }]}>{emblem.text}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fundName} numberOfLines={1}>
              {fund.name}
            </Text>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryText}>{fund.category.split('/')[0].trim()}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={[styles.riskText, { color: fund.risk === 'High' ? '#DC2626' : '#059669' }]}>
                {fund.risk} Risk
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.returnBadgeCol}>
          <Text style={styles.returnVal}>+{fund.threeYearReturn}%</Text>
          <Text style={styles.returnLabel}>3Y Return (p.a.)</Text>
        </View>
      </View>

      {/* Mini Groww Line Chart */}
      <View style={styles.chartWrapper}>
        <StockLineChart
          data={sparkline}
          color="#00D09C"
          height={60}
          showLabels={false}
        />
      </View>

      {/* 3-Col Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>NAV</Text>
          <Text style={styles.statVal}>₹{fund.nav.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Min. SIP</Text>
          <Text style={styles.statVal}>₹{fund.minInvestment}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Crisil Rating</Text>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>4.5 ★</Text>
        </View>
      </View>

      {/* Footer / Position */}
      <View style={styles.footerRow}>
        <View style={styles.positionCol}>
          {heldUnits > 0 ? (
            <Text style={styles.holdingText}>
              Invested: <Text style={styles.holdingBold}>{heldUnits.toFixed(2)} units</Text> ({formatCurrency(heldUnits * fund.nav)})
            </Text>
          ) : (
            <Text style={styles.noHoldingText}>Zero commission direct plan</Text>
          )}
        </View>

        <View style={styles.investBtn}>
          <Text style={styles.investBtnText}>Invest / SIP →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    padding: 14,
    marginVertical: 5,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  emblemBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemText: {
    fontSize: 12,
    fontWeight: '900',
  },
  fundName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  dot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  returnBadgeCol: {
    alignItems: 'flex-end',
  },
  returnVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00D09C',
  },
  returnLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  chartWrapper: {
    marginVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  positionCol: {
    flex: 1,
  },
  holdingText: {
    fontSize: 11,
    color: '#475569',
  },
  holdingBold: {
    fontWeight: '800',
    color: '#00D09C',
  },
  noHoldingText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  investBtn: {
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  investBtnText: {
    color: '#00D09C',
    fontSize: 11,
    fontWeight: '800',
  },
});
