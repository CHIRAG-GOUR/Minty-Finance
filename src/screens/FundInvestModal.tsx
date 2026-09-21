import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { MutualFundItem, MutualFundHolding } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface FundInvestModalProps {
  visible: boolean;
  data: {
    fund: MutualFundItem;
    holding?: MutualFundHolding;
  } | null;
  onClose: () => void;
}

export const FundInvestModal: React.FC<FundInvestModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const { wallet, investFund } = useApp();
  const [amount, setAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !data || !data.fund) return null;
  const { fund } = data;

  const estimatedUnits = amount > 0 ? parseFloat((amount / fund.nav).toFixed(3)) : 0;

  const handleInvest = async () => {
    if (amount < fund.minInvestment) return;
    setIsSubmitting(true);
    await investFund(fund.id, amount);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title={`Invest in ${fund.name}`}
      subtitle={`${fund.category} · NAV ${formatCurrency(fund.nav, true)}`}
      iconName="funds"
    >
      <View style={styles.container}>
        <View style={styles.navRow}>
          <View>
            <Text style={styles.navLabel}>Simulated NAV</Text>
            <Text style={styles.navVal}>{formatCurrency(fund.nav, true)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.navLabel}>3Y Return</Text>
            <Text style={[styles.navVal, { color: THEME.colors.primary }]}>
              {formatPercentage(fund.threeYearReturn)}
            </Text>
          </View>
        </View>

        {/* Investment Amount Selector */}
        <View style={styles.amtCard}>
          <Text style={styles.amtTitle}>Select Virtual Investment Amount</Text>
          <View style={styles.pillsRow}>
            {[500, 1000, 2000, 5000].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setAmount(val)}
                style={[
                  styles.pill,
                  amount === val && styles.pillActive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    amount === val && styles.pillTextActive,
                  ]}
                >
                  {formatCurrency(val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Units Calculation & Diversification Breakdown */}
        <View style={styles.summaryCard}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Allocated Capital:</Text>
            <Text style={styles.sumVal}>{formatCurrency(amount)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Estimated Fund Units:</Text>
            <Text style={[styles.sumVal, { color: THEME.colors.primary }]}>
              {estimatedUnits} units
            </Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Remaining Virtual Cash:</Text>
            <Text style={styles.sumVal}>
              {formatCurrency(wallet.cashBalance - amount)}
            </Text>
          </View>
        </View>

        <PrimaryButton
          title={`Confirm Virtual SIP of ${formatCurrency(amount)}`}
          iconName="invest"
          onPress={handleInvest}
          loading={isSubmitting}
          disabled={amount > wallet.cashBalance || amount < fund.minInvestment}
          size="lg"
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 12,
    borderRadius: THEME.radii.lg,
  },
  navLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  navVal: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  amtCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  amtTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  pillTextActive: {
    color: THEME.colors.primary,
  },
  summaryCard: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 12,
    gap: 6,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
});
