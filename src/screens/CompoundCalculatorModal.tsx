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
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { calculateCompoundGrowth } from '../utils/financialMath';
import { formatCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface CompoundCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CompoundCalculatorModal: React.FC<CompoundCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const { wallet, showToast, recordCompoundSimulation, setActiveTab } = useApp();

  // Hooks first: an early return above them changes the hook count between the
  // hidden and visible renders, which React treats as fatal.
  const [initialInvestment, setInitialInvestment] = useState(25000);
  const [monthlySIP, setMonthlySIP] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(13.5);
  const [timeHorizonYears, setTimeHorizonYears] = useState(15);

  if (!visible) return null;

  const result = calculateCompoundGrowth(
    initialInvestment,
    monthlySIP,
    expectedReturn,
    timeHorizonYears
  );

  const wealthMultiplier =
    result.totalInvested > 0
      ? (result.finalValue / result.totalInvested).toFixed(1)
      : '1.0';

  const handleApplyToPortfolio = async () => {
    await recordCompoundSimulation();
    showToast(
      'Compound Projection Saved',
      `Projected ₹${result.finalValue.toLocaleString('en-IN')} across ${timeHorizonYears} years!`,
      'success'
    );
    onClose();
    setActiveTab('portfolio');
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Compound Time Machine"
      subtitle="The 8th Wonder of the World — Long-Term Wealth Multiplier"
      iconName="growth"
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Big Result Card */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Projected Future Wealth</Text>
          <Text style={styles.resultValue}>{formatCurrency(result.finalValue)}</Text>
          <View style={styles.multiplierBadge}>
            <Icon name="arrow-up-right" size={14} color={THEME.colors.obsidian} />
            <Text style={styles.multiplierText}>{wealthMultiplier}x Wealth Multiplier</Text>
          </View>

          <View style={styles.resultGrid}>
            <View style={styles.resultCol}>
              <Text style={styles.gridLabel}>Total Principal</Text>
              <Text style={styles.gridVal}>{formatCurrency(result.totalInvested)}</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.resultCol}>
              <Text style={styles.gridLabel}>Compound Gains (₹)</Text>
              <Text style={[styles.gridVal, { color: '#16A34A' }]}>
                +{formatCurrency(result.totalInterest)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sliders & Inputs */}
        <View style={styles.inputSection}>
          {/* Initial Lumpsum */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputTitle}>Initial Starting Investment</Text>
              <Text style={styles.inputValueHighlight}>
                ₹{initialInvestment.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.pillRow}>
              {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setInitialInvestment(amt)}
                  style={[
                    styles.presetPill,
                    initialInvestment === amt && styles.presetPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      initialInvestment === amt && styles.presetTextActive,
                    ]}
                  >
                    ₹{amt >= 100000 ? '1 Lakh' : `${amt / 1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Monthly SIP */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputTitle}>Monthly Systematic Investment (SIP)</Text>
              <Text style={styles.inputValueHighlight}>
                ₹{monthlySIP.toLocaleString('en-IN')} / mo
              </Text>
            </View>
            <View style={styles.pillRow}>
              {[1000, 2500, 5000, 10000, 20000].map((sip) => (
                <TouchableOpacity
                  key={sip}
                  onPress={() => setMonthlySIP(sip)}
                  style={[
                    styles.presetPill,
                    monthlySIP === sip && styles.presetPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      monthlySIP === sip && styles.presetTextActive,
                    ]}
                  >
                    ₹{sip >= 1000 ? `${sip / 1000}k` : sip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Expected CAGR */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputTitle}>Expected Annual Return (CAGR %)</Text>
              <Text style={styles.inputValueHighlight}>{expectedReturn}% p.a.</Text>
            </View>
            <View style={styles.pillRow}>
              {[8, 12, 14, 16, 18].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  onPress={() => setExpectedReturn(rate)}
                  style={[
                    styles.presetPill,
                    expectedReturn === rate && styles.presetPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      expectedReturn === rate && styles.presetTextActive,
                    ]}
                  >
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Horizon */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputTitle}>Time Horizon (Years)</Text>
              <Text style={styles.inputValueHighlight}>{timeHorizonYears} Years</Text>
            </View>
            <View style={styles.pillRow}>
              {[5, 10, 15, 20, 25, 30].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setTimeHorizonYears(yr)}
                  style={[
                    styles.presetPill,
                    timeHorizonYears === yr && styles.presetPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      timeHorizonYears === yr && styles.presetTextActive,
                    ]}
                  >
                    {yr} Yrs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Educational Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Icon name="book-open" size={14} color={THEME.colors.accentYellowDark} />
            <Text style={styles.insightTitle}>The Power of Compounding Rule</Text>
          </View>
          <Text style={styles.insightText}>
            Notice how during the first 5 years, most of your wealth comes from your own pocket
            (Principal). But after 15+ years, exponential compound interest overtakes principal by
            huge margins!
          </Text>
        </View>

        {/* Action Button */}
        <PrimaryButton
          title="Save Projection & View in Portfolio"
          iconName="pie-chart"
          onPress={handleApplyToPortfolio}
          variant="primary"
          size="lg"
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    ...THEME.shadows.card,
  },
  resultLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {
    ...THEME.typography.moneyDisplay,
    fontSize: 28,
    color: THEME.colors.accentYellow,
  },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
    marginVertical: 4,
  },
  multiplierText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  resultGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: THEME.radii.md,
    padding: 10,
    marginTop: 8,
  },
  resultCol: {
    flex: 1,
    alignItems: 'center',
  },
  gridDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  gridLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textInverse,
    marginTop: 2,
  },
  inputSection: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 14,
    ...THEME.shadows.card,
  },
  inputGroup: {
    gap: 6,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  inputValueHighlight: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  presetPillActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  presetTextActive: {
    color: THEME.colors.accentYellow,
    fontWeight: '900',
  },
  insightCard: {
    backgroundColor: THEME.colors.accentYellowSurface,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.accentYellow,
    borderWidth: 1,
    gap: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  insightText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
});
