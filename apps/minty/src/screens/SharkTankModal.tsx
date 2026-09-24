import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SharkTankStartup } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface SharkTankModalProps {
  visible: boolean;
  startup: SharkTankStartup | null;
  onClose: () => void;
}

const safeStartup = (s: SharkTankStartup | null | undefined): SharkTankStartup => ({
  id: s?.id ?? 'shark-default',
  name: s?.name ?? 'Student Venture Pitch',
  tagline: s?.tagline ?? 'Innovative youth-led venture',
  industry: s?.industry ?? 'Consumer Tech',
  founder: s?.founder ?? 'Student Founder',
  founderAge: s?.founderAge ?? 15,
  cohort: s?.cohort ?? 'Grade 9',
  isVerifiedPitch: s?.isVerifiedPitch ?? true,
  totalRaisedVirtual: s?.totalRaisedVirtual ?? 25000,
  investorCount: s?.investorCount ?? 5,
  problem: s?.problem ?? 'Everyday campus friction solved with technology.',
  solution: s?.solution ?? 'Scalable solution with strong gross margins.',
  askAmount: Math.max(1000, s?.askAmount ?? 20000),
  askEquityPercent: Math.max(1, s?.askEquityPercent ?? 10),
  valuation: s?.valuation ?? 200000,
  monthlyRevenue: s?.monthlyRevenue ?? 35000,
  growthRate: s?.growthRate ?? 25,
  pitchStory: s?.pitchStory ?? 'Started in our science laboratory and now operating across schools.',
  educationalTakeaway: s?.educationalTakeaway ?? 'Always evaluate product-market fit and unit margins.',
});

export const SharkTankModal: React.FC<SharkTankModalProps> = ({
  visible,
  startup,
  onClose,
}) => {
  const { wallet, investInSharkTank, sharkTankStartups, showToast } = useApp();

  const resolvedStartup = useMemo(() => {
    return safeStartup(startup || (sharkTankStartups && sharkTankStartups.length > 0 ? sharkTankStartups[0] : null));
  }, [startup, sharkTankStartups]);

  const [offerAmount, setOfferAmount] = useState<number>(resolvedStartup.askAmount);
  const [offerEquity, setOfferEquity] = useState<number>(resolvedStartup.askEquityPercent);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dealResult, setDealResult] = useState<{
    status: 'accepted' | 'counter' | 'rejected';
    message: string;
    impliedValuation: number;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setOfferAmount(resolvedStartup.askAmount);
      setOfferEquity(resolvedStartup.askEquityPercent);
      setDealResult(null);
      setIsSubmitting(false);
    }
  }, [resolvedStartup.id, visible]);

  const safeEquity = offerEquity > 0 ? offerEquity : 1;
  const impliedValuation = Math.round((offerAmount / safeEquity) * 100);

  const amountOptions = useMemo(() => {
    const base = resolvedStartup.askAmount;
    return [
      Math.max(5000, Math.round(base * 0.5)),
      base,
      Math.round(base * 1.5),
      Math.round(base * 2),
    ];
  }, [resolvedStartup.askAmount]);

  const equityOptions = useMemo(() => {
    const base = resolvedStartup.askEquityPercent;
    return [
      Math.max(3, base - 5),
      base,
      base + 5,
      base + 10,
    ];
  }, [resolvedStartup.askEquityPercent]);

  const handleMakeOffer = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const askAmount = resolvedStartup.askAmount;
      const askEquity = resolvedStartup.askEquityPercent;

      let status: 'accepted' | 'counter' | 'rejected' = 'accepted';
      let message = '';

      if (offerEquity >= askEquity && offerAmount >= askAmount) {
        status = 'accepted';
        message = `Deal accepted! ${resolvedStartup.founder} agreed to ${offerEquity}% equity for ${formatCurrency(
          offerAmount
        )}. You now own a simulated stake in ${resolvedStartup.name}.`;
        try {
          await investInSharkTank(resolvedStartup.id, offerAmount, offerEquity);
        } catch (investErr) {
          console.warn('investInSharkTank error:', investErr);
        }
      } else if (offerEquity < askEquity - 4) {
        status = 'rejected';
        message = `${resolvedStartup.founder} felt the equity offered (${offerEquity}%) was too low for the capital ask, declining the deal.`;
      } else {
        const counterEq = Math.min(30, offerEquity + 3);
        status = 'counter';
        message = `${resolvedStartup.founder} countered: "We can do ${counterEq}% equity for ${formatCurrency(
          offerAmount
        )}". Compromise deal closed!`;
        try {
          await investInSharkTank(resolvedStartup.id, offerAmount, counterEq);
        } catch (investErr) {
          console.warn('investInSharkTank error:', investErr);
        }
      }

      setDealResult({ status, message, impliedValuation });
    } catch (err) {
      console.warn('handleMakeOffer error:', err);
      try {
        showToast('Deal Alert', 'Could not process deal. Please try again.', 'warning');
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  }, [resolvedStartup, offerAmount, offerEquity, impliedValuation, investInSharkTank, showToast]);

  const handleResetDeal = useCallback(() => {
    setDealResult(null);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title={resolvedStartup.name}
      subtitle={resolvedStartup.industry}
      iconName="rocket"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {!dealResult ? (
          <>
            {/* Pitch Story */}
            <View style={styles.pitchCard}>
              <Text style={styles.pitchHeading}>Founder Pitch</Text>
              <Text style={styles.pitchText}>{resolvedStartup.pitchStory}</Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Monthly Sales</Text>
                  <Text style={styles.metricVal}>
                    {formatCurrency(resolvedStartup.monthlyRevenue)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Growth</Text>
                  <Text style={styles.metricVal}>
                    +{resolvedStartup.growthRate}%/mo
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Ask Amount</Text>
                  <Text style={styles.metricVal}>
                    {formatCurrency(resolvedStartup.askAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Investor Offer Controls */}
            <View style={styles.offerCard}>
              <Text style={styles.offerTitle}>Your Angel Offer</Text>
              <Text style={styles.offerSub}>
                Available: {formatCurrency(wallet.cashBalance)}
              </Text>

              {/* Amount selector */}
              <Text style={styles.controlLabel}>Investment Capital</Text>
              <View style={styles.btnRow}>
                {amountOptions.map((amt, idx) => (
                  <TouchableOpacity
                    key={`amt-${amt}-${idx}`}
                    onPress={() => setOfferAmount(amt)}
                    activeOpacity={0.8}
                    style={[
                      styles.choiceBtn,
                      offerAmount === amt && styles.choiceBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceBtnText,
                        offerAmount === amt && styles.choiceBtnTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {formatCompactCurrency(amt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Equity selector */}
              <Text style={styles.controlLabel}>Equity Stake (%)</Text>
              <View style={styles.btnRow}>
                {equityOptions.map((eq, idx) => (
                  <TouchableOpacity
                    key={`eq-${eq}-${idx}`}
                    onPress={() => setOfferEquity(eq)}
                    activeOpacity={0.8}
                    style={[
                      styles.choiceBtn,
                      offerEquity === eq && styles.choiceBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceBtnText,
                        offerEquity === eq && styles.choiceBtnTextActive,
                      ]}
                    >
                      {eq}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Implied Valuation */}
              <View style={styles.valuationRow}>
                <Text style={styles.valLabel}>Implied Valuation</Text>
                <Text style={styles.valAmount}>{formatCurrency(impliedValuation)}</Text>
              </View>

              <PrimaryButton
                title={`Invest ${formatCurrency(offerAmount)} for ${offerEquity}%`}
                iconName="rocket"
                onPress={handleMakeOffer}
                disabled={wallet.cashBalance < offerAmount || isSubmitting}
                loading={isSubmitting}
                size="lg"
              />
            </View>
          </>
        ) : (
          /* Deal Result */
          <View style={styles.resultCard}>
            <View
              style={[
                styles.resultEmblem,
                {
                  backgroundColor:
                    dealResult.status === 'rejected'
                      ? THEME.colors.coralSurface
                      : THEME.colors.accentYellowSurface,
                },
              ]}
            >
              <Icon
                name={
                  dealResult.status === 'rejected' ? 'close' : 'check'
                }
                size={28}
                color={
                  dealResult.status === 'rejected'
                    ? THEME.colors.coral
                    : THEME.colors.obsidian
                }
              />
            </View>

            <Text style={styles.resultTitle}>
              {dealResult.status === 'accepted'
                ? 'Deal Closed!'
                : dealResult.status === 'counter'
                ? 'Compromise Reached!'
                : 'Deal Declined'}
            </Text>
            <Text style={styles.resultMessage}>{dealResult.message}</Text>

            {/* Educational takeaway */}
            <View style={styles.takeawayBox}>
              <Text style={styles.takeawayTitle}>Valuation Insight</Text>
              <Text style={styles.takeawayText}>{resolvedStartup.educationalTakeaway}</Text>
            </View>

            <PrimaryButton
              title="Return to Arena"
              iconName="check"
              onPress={handleResetDeal}
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
    gap: 14,
  },
  pitchCard: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 16,
  },
  pitchHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  pitchText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  offerCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  offerSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 14,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  choiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  choiceBtnTextActive: {
    color: THEME.colors.accentYellow,
    fontWeight: '900',
  },
  valuationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentYellowSurface,
    padding: 12,
    borderRadius: THEME.radii.md,
    marginBottom: 16,
  },
  valLabel: {
    fontSize: 12,
    color: THEME.colors.obsidian,
    fontWeight: '700',
  },
  valAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultEmblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  resultMessage: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  takeawayBox: {
    width: '100%',
    backgroundColor: THEME.colors.accentYellowSurface,
    borderRadius: THEME.radii.lg,
    padding: 14,
    marginBottom: 18,
  },
  takeawayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.obsidian,
    marginBottom: 4,
  },
  takeawayText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
});
