import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatCurrency } from '../utils/formatters';
import { calculateFDMaturity } from '../utils/financialMath';
import { useApp } from '../context/AppContext';

interface FDCreateModalProps {
  visible: boolean;
  data: {
    principal: number;
    months: number;
    rate: number;
  } | null;
  onClose: () => void;
}

export const FDCreateModal: React.FC<FDCreateModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const { wallet, openFixedDeposit } = useApp();
  const [loading, setLoading] = useState(false);

  if (!visible || !data) return null;
  const { principal, months, rate } = data;
  const { maturityAmount, earnedInterest } = calculateFDMaturity(principal, rate, months);

  const handleConfirm = async () => {
    setLoading(true);
    await openFixedDeposit(principal, months, rate);
    setLoading(false);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Open Fixed Deposit"
      subtitle={`${months} Months · ${rate}% p.a.`}
      iconName="fd"
    >
      <View style={styles.container}>
        <View style={styles.banner}>
          <Icon name="shield" size={24} color={THEME.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Guaranteed Capital Safety</Text>
            <Text style={styles.bannerText}>
              Your virtual deposit is locked for {months} months with quarterly compounded guaranteed returns.
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Deposit Principal:</Text>
            <Text style={styles.val}>{formatCurrency(principal)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tenure Duration:</Text>
            <Text style={styles.val}>{months} Months</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={[styles.val, { color: THEME.colors.amber }]}>{rate}% p.a.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>Guaranteed Interest:</Text>
            <Text style={[styles.val, { color: THEME.colors.primary }]}>
              +{formatCurrency(earnedInterest)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Maturity Payout:</Text>
            <Text style={[styles.val, { fontWeight: '800', color: THEME.colors.textPrimary, fontSize: 16 }]}>
              {formatCurrency(maturityAmount)}
            </Text>
          </View>
        </View>

        <PrimaryButton
          title={`Lock ${formatCurrency(principal)} in FD`}
          iconName="lock"
          onPress={handleConfirm}
          loading={loading}
          disabled={wallet.cashBalance < principal}
          size="lg"
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 10,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  bannerText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  detailsCard: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 4,
  },
});
