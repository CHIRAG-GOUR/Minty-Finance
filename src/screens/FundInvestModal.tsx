import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { MutualFundItem, MutualFundHolding } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { GrowwInteractiveChart, GrowwTimeframe } from '../components/charts/GrowwInteractiveChart';

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
  const { wallet, investFund, showToast } = useApp();
  const [investMode, setInvestMode] = useState<'sip' | 'lumpsum'>('sip');
  const [selectedTf, setSelectedTf] = useState<GrowwTimeframe>('1Y');
  const [sipAmount, setSipAmount] = useState<number>(1000);
  const [sipYears, setSipYears] = useState<number>(3);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const bottomBarPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 12;

  // Hooks must run on every render, including while the sheet is hidden.
  // An early return above them changes the hook count between renders, which
  // React treats as fatal and which closed the app when a fund was opened.
  const fund = data && data.fund ? data.fund : null;
  const holding = data ? data.holding : undefined;

  // Modelled NAV curve for the illustration below. It is a projection from the
  // fund's published returns, not recorded NAV history, and is labelled as such.
  const chartData = useMemo(() => {
    if (!fund) return [];
    const baseNav = fund.nav;
    let points = 24;
    let annualRate = (fund.threeYearReturn || 16.5) / 100;

    if (selectedTf === '1M') {
      points = 20;
      annualRate = 0.02;
    } else if (selectedTf === '6M') {
      points = 26;
      annualRate = 0.08;
    } else if (selectedTf === '1Y') {
      points = 30;
      annualRate = (fund.oneYearReturn || 22.0) / 100;
    } else if (selectedTf === '3Y') {
      points = 36;
      annualRate = (fund.threeYearReturn || 16.5) / 100;
    } else if (selectedTf === '5Y' || selectedTf === 'ALL') {
      points = 48;
      annualRate = (fund.fiveYearReturn || 18.0) / 100;
    }

    const series: number[] = [];
    let startVal = baseNav / (1 + annualRate);
    const stepGrowth = Math.pow(1 + annualRate, 1 / points);

    for (let i = 0; i < points - 1; i++) {
      // Deterministic wobble, so reopening the fund redraws the same curve
      // rather than a different random one on every render.
      const noise = Math.sin(i * 1.7 + baseNav) * (baseNav * 0.008);
      startVal = startVal * stepGrowth + noise;
      series.push(Number(startVal.toFixed(2)));
    }
    series.push(baseNav);
    return series;
  }, [fund, selectedTf]);

  if (!visible || !fund) return null;

  // SIP Return Calculator Math
  const totalMonths = sipYears * 12;
  const totalInvested = sipAmount * totalMonths;
  const monthlyRate = (fund.threeYearReturn || 15.0) / 100 / 12;
  const projectedFutureVal = Math.round(
    sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  );
  const projectedGain = Math.max(0, projectedFutureVal - totalInvested);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${fund.name} on Minty Finance! NAV: ₹${fund.nav} (3Y Return: ${fund.threeYearReturn}%).`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleExecuteInvestment = async () => {
    if (sipAmount < fund.minInvestment) {
      showToast('Minimum Order Limit', `Minimum investment for this fund is ₹${fund.minInvestment}`, 'warning');
      return;
    }
    if (sipAmount > wallet.cashBalance) {
      showToast('Insufficient Cash', 'Your virtual cash balance is lower than this investment amount.', 'warning');
      return;
    }

    setIsSubmitting(true);
    await investFund(fund.id, sipAmount);
    setIsSubmitting(false);
    showToast(
      investMode === 'sip' ? 'Monthly SIP Activated' : 'Lump Sum Investment Completed',
      `Allocated ₹${sipAmount.toLocaleString('en-IN')} to ${fund.name}.`,
      'success'
    );
    onClose();
  };

  // Emblem background and initial
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

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title=""
      subtitle=""
      iconName="funds"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomBarPadding + 64 }]}
      >
        {/* Groww Top Navigation Bar */}
        <View style={styles.topHeaderBar}>
          <View style={styles.topHeaderLeft}>
            <View style={[styles.fundEmblem, { backgroundColor: emblem.bg }]}>
              <Text style={[styles.fundEmblemText, { color: emblem.color }]}>{emblem.text}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fundTitleText} numberOfLines={2}>
                {fund.name}
              </Text>
              <View style={styles.categoryBadgeRow}>
                <Text style={styles.badgeText}>Equity</Text>
                <Text style={styles.badgeDot}>•</Text>
                <Text style={styles.badgeText}>Large Cap</Text>
                <Text style={styles.badgeDot}>•</Text>
                <Text style={[styles.badgeText, { color: fund.risk === 'High' ? '#DC2626' : '#059669' }]}>
                  {fund.risk} Risk
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topHeaderRight}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsBookmarked(!isBookmarked)}
              style={styles.iconBtn}
            >
              <Icon
                name={isBookmarked ? 'bookmark' : 'bookmark'}
                size={18}
                color={isBookmarked ? '#00D09C' : '#64748B'}
              />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.iconBtn}>
              <Icon name="share" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Groww Interactive Chart Card */}
        <View style={styles.chartWrapperCard}>
          <GrowwInteractiveChart
            data={chartData}
            currentPrice={fund.nav}
            timeframe={selectedTf}
            onTimeframeChange={(tf) => setSelectedTf(tf)}
            isMutualFund={true}
            height={220}
          />
        </View>

        {/* Groww 3-Column Info Cards (Exact matching Screenshot 3) */}
        <View style={styles.threeColumnCard}>
          <View style={styles.columnItem}>
            <Text style={styles.colVal}>₹{fund.nav.toFixed(2)}</Text>
            <Text style={styles.colSub}>NAV · Live Feed</Text>
          </View>
          <View style={styles.colDivider} />
          <View style={styles.columnItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.colVal}>4.5</Text>
              <Text style={styles.starText}>★</Text>
            </View>
            <Text style={styles.colSub}>Crisil Rating</Text>
          </View>
          <View style={styles.colDivider} />
          <View style={styles.columnItem}>
            <Text style={styles.colVal}>₹{fund.aumCr ? `${fund.aumCr.toLocaleString('en-IN')} Cr` : '₹18,450 Cr'}</Text>
            <Text style={styles.colSub}>Fund Size (AUM)</Text>
          </View>
        </View>

        {/* Holding status if already invested */}
        {holding && holding.units > 0 && (
          <View style={styles.holdingBanner}>
            <View style={styles.holdingLeft}>
              <Icon name="invest" size={18} color="#00D09C" />
              <View>
                <Text style={styles.holdingTitle}>Your Current Investment</Text>
                <Text style={styles.holdingUnits}>{holding.units.toFixed(3)} units accumulated</Text>
              </View>
            </View>
            <Text style={styles.holdingVal}>
              {formatCurrency(holding.currentValue || holding.units * fund.nav)}
            </Text>
          </View>
        )}

        {/* Groww SIP / Lumpsum Return Calculator Widget */}
        <View style={styles.calcCard}>
          <View style={styles.calcHeader}>
            <Text style={styles.calcTitle}>Groww SIP Return Calculator</Text>
            <View style={styles.sipTogglePills}>
              <TouchableOpacity
                onPress={() => setInvestMode('sip')}
                style={[styles.modePill, investMode === 'sip' && styles.modePillActive]}
              >
                <Text style={[styles.modePillText, investMode === 'sip' && styles.modePillTextActive]}>
                  Monthly SIP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInvestMode('lumpsum')}
                style={[styles.modePill, investMode === 'lumpsum' && styles.modePillActive]}
              >
                <Text style={[styles.modePillText, investMode === 'lumpsum' && styles.modePillTextActive]}>
                  One-time
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Amount Pills */}
          <View style={styles.amountPillsRow}>
            {[500, 1000, 2500, 5000, 10000].map((amt) => {
              const isSelected = sipAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setSipAmount(amt)}
                  style={[styles.amtPill, isSelected && styles.amtPillActive]}
                >
                  <Text style={[styles.amtPillText, isSelected && styles.amtPillTextActive]}>
                    ₹{amt.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Horizon Selection (1Y, 3Y, 5Y) */}
          <View style={styles.horizonRow}>
            <Text style={styles.horizonLabel}>Time Horizon:</Text>
            <View style={styles.horizonPills}>
              {[1, 3, 5].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setSipYears(yr)}
                  style={[styles.yrPill, sipYears === yr && styles.yrPillActive]}
                >
                  <Text style={[styles.yrPillText, sipYears === yr && styles.yrPillTextActive]}>
                    {yr} Year{yr > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calculated Projections Comparison */}
          <View style={styles.calcResultBox}>
            <View style={styles.calcStatCol}>
              <Text style={styles.calcStatLabel}>Total Virtual Invested</Text>
              <Text style={styles.calcStatVal}>{formatCurrency(totalInvested)}</Text>
            </View>
            <View style={styles.calcStatColRight}>
              <Text style={styles.calcStatLabel}>Projected Value ({fund.threeYearReturn}% p.a.)</Text>
              <Text style={[styles.calcStatVal, { color: '#00D09C' }]}>
                {formatCurrency(projectedFutureVal)}
              </Text>
            </View>
          </View>

          {/* Visual Split Bar */}
          <View style={styles.splitBar}>
            <View
              style={[
                styles.splitInvested,
                { flex: totalInvested / projectedFutureVal },
              ]}
            />
            <View
              style={[
                styles.splitGains,
                { flex: projectedGain / projectedFutureVal },
              ]}
            />
          </View>
          <View style={styles.splitLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.legendText}>Investment</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00D09C' }]} />
              <Text style={styles.legendText}>Est. Gains (+{formatCurrency(projectedGain)})</Text>
            </View>
          </View>
        </View>

        {/* Top Holdings Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Top Portfolio Holdings</Text>
          <Text style={styles.sectionHeaderSub}>
            Where your capital is invested to earn returns
          </Text>

          <View style={styles.holdingsList}>
            {(fund.holdingsTop || ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS']).map(
              (holdingSymbol, idx) => {
                const weights = [9.4, 8.2, 7.5, 6.8, 5.9];
                const weight = weights[idx] || 4.5;
                return (
                  <View key={holdingSymbol} style={styles.holdingItemRow}>
                    <View style={styles.holdingSymbolCol}>
                      <View style={styles.holdingDot} />
                      <Text style={styles.holdingSymbolText}>{holdingSymbol}</Text>
                    </View>
                    <View style={styles.holdingWeightBarContainer}>
                      <View style={[styles.holdingWeightBar, { width: `${weight * 8}%` }]} />
                    </View>
                    <Text style={styles.holdingWeightText}>{weight}%</Text>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* Groww Fund Scheme Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Fund Scheme Information</Text>

          <View style={styles.schemeGrid}>
            <View style={styles.schemeItem}>
              <Text style={styles.schemeLabel}>Expense Ratio</Text>
              <Text style={styles.schemeVal}>{fund.expenseRatio || 0.18}%</Text>
            </View>
            <View style={styles.schemeItem}>
              <Text style={styles.schemeLabel}>Exit Load</Text>
              <Text style={styles.schemeVal}>Nil</Text>
            </View>
            <View style={styles.schemeItem}>
              <Text style={styles.schemeLabel}>Min. Investment</Text>
              <Text style={styles.schemeVal}>₹{fund.minInvestment || 500}</Text>
            </View>
            <View style={styles.schemeItem}>
              <Text style={styles.schemeLabel}>Benchmark</Text>
              <Text style={styles.schemeVal}>{fund.benchmark || 'NIFTY 50 TRI'}</Text>
            </View>
          </View>
        </View>

        {/* Available Virtual Balance */}
        <View style={styles.balanceReminder}>
          <Icon name="wallet" size={14} color="#64748B" />
          <Text style={styles.balanceReminderText}>
            Available Virtual Practice Cash: {formatCurrency(wallet.cashBalance)}
          </Text>
        </View>
      </ScrollView>

      {/* Groww Sticky Action Footer Bar (Exact match to Screenshots) */}
      <View style={[styles.bottomStickyBar, { paddingBottom: bottomBarPadding }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setInvestMode('lumpsum');
            handleExecuteInvestment();
          }}
          style={styles.oneTimeBtn}
        >
          <Text style={styles.oneTimeBtnText}>ONE-TIME</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setInvestMode('sip');
            handleExecuteInvestment();
          }}
          style={styles.startSipBtn}
        >
          <Text style={styles.startSipBtnText}>START SIP (₹{sipAmount.toLocaleString('en-IN')})</Text>
        </TouchableOpacity>
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fundEmblem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundEmblemText: {
    fontSize: 16,
    fontWeight: '900',
  },
  fundTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  badgeDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  threeColumnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  columnItem: {
    flex: 1,
    alignItems: 'center',
  },
  colVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '900',
  },
  colSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  colDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  holdingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  holdingUnits: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  holdingVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#00D09C',
  },
  calcCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sipTogglePills: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 2,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  modePillTextActive: {
    color: '#00D09C',
    fontWeight: '800',
  },
  amountPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  amtPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
  },
  amtPillActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
  },
  amtPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  amtPillTextActive: {
    color: '#00D09C',
    fontWeight: '900',
  },
  horizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  horizonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  horizonPills: {
    flexDirection: 'row',
    gap: 6,
  },
  yrPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  yrPillActive: {
    backgroundColor: '#0B132B',
  },
  yrPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  yrPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calcResultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  calcStatCol: {
    flex: 1,
  },
  calcStatColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  calcStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  calcStatVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  splitBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  splitInvested: {
    backgroundColor: '#94A3B8',
  },
  splitGains: {
    backgroundColor: '#00D09C',
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 12,
  },
  holdingsList: {
    gap: 10,
  },
  holdingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holdingSymbolCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  holdingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D09C',
  },
  holdingSymbolText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  holdingWeightBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  holdingWeightBar: {
    height: '100%',
    backgroundColor: '#00D09C',
    borderRadius: 3,
  },
  holdingWeightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 40,
    textAlign: 'right',
  },
  schemeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  schemeItem: {
    width: '46%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  schemeLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  schemeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  balanceReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  balanceReminderText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  oneTimeBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTimeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  startSipBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#00D09C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D09C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startSipBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
