import React, { useState, useMemo } from 'react';
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
import { SegmentedControl } from '../components/common/SegmentedControl';
import { FundCard } from '../components/cards/FundCard';
import { FDCard } from '../components/cards/FDCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatCurrency } from '../utils/formatters';
import { calculateFDMaturity } from '../utils/financialMath';
import { useApp } from '../context/AppContext';

type MFTab = 'mutual_funds' | 'fixed_deposits';
type FundCategoryFilter = 'all' | 'index' | 'equity' | 'flexi_cap' | 'small_cap' | 'hybrid';

export const MutualFundsScreen: React.FC = () => {
  const {
    wallet,
    fundCatalog,
    fundHoldings,
    fdHoldings,
    openModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<MFTab>('mutual_funds');
  const [fundSearch, setFundSearch] = useState('');
  const [selectedFundCategory, setSelectedFundCategory] = useState<FundCategoryFilter>('all');

  // FD Simulator state
  const [fdPrincipal, setFdPrincipal] = useState<number>(25000);
  const [fdMonths, setFdMonths] = useState<number>(12);
  const [fdRate, setFdRate] = useState<number>(7.2);
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');

  const fdCalc = calculateFDMaturity(fdPrincipal, fdRate, fdMonths);

  const mainTabs = [
    { id: 'mutual_funds' as MFTab, label: 'Mutual Funds', iconName: 'funds' },
    { id: 'fixed_deposits' as MFTab, label: 'Fixed Deposits (FD)', iconName: 'fd' },
  ];

  const categoryChips: { id: FundCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Funds' },
    { id: 'index', label: 'Index Funds' },
    { id: 'equity', label: 'Large Cap' },
    { id: 'flexi_cap', label: 'Flexi Cap' },
    { id: 'small_cap', label: 'Small Cap' },
    { id: 'hybrid', label: 'Hybrid' },
  ];

  const bankOptions = [
    { name: 'State Bank of India', rate: 6.8 },
    { name: 'HDFC Bank', rate: 7.2 },
    { name: 'ICICI Bank', rate: 7.1 },
    { name: 'Kotak Mahindra Bank', rate: 7.4 },
    { name: 'Axis Bank', rate: 7.1 },
  ];

  const filteredFunds = useMemo(() => {
    let list = [...fundCatalog];

    if (fundSearch.trim()) {
      const q = fundSearch.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.amc && f.amc.toLowerCase().includes(q))
      );
    }

    if (selectedFundCategory !== 'all') {
      switch (selectedFundCategory) {
        case 'index':
          list = list.filter((f) => f.category.toLowerCase().includes('index') || f.name.toLowerCase().includes('nifty') || f.name.toLowerCase().includes('sensex'));
          break;
        case 'equity':
          list = list.filter((f) => f.category.toLowerCase().includes('large') || f.category.toLowerCase().includes('equity') || f.category.toLowerCase().includes('bluechip'));
          break;
        case 'flexi_cap':
          list = list.filter((f) => f.category.toLowerCase().includes('flexi') || f.name.toLowerCase().includes('flexi'));
          break;
        case 'small_cap':
          list = list.filter((f) => f.category.toLowerCase().includes('small') || f.category.toLowerCase().includes('mid'));
          break;
        case 'hybrid':
          list = list.filter((f) => f.category.toLowerCase().includes('hybrid') || f.category.toLowerCase().includes('debt') || f.category.toLowerCase().includes('balanced'));
          break;
      }
    }

    return list;
  }, [fundCatalog, fundSearch, selectedFundCategory]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            Mutual Funds & FDs
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Curated AMC portfolios & guaranteed banking deposits
          </Text>
        </View>

        <View style={styles.cashBadge}>
          <Text style={styles.cashBadgeLabel}>Available Cash</Text>
          <Text style={styles.cashBadgeAmount} numberOfLines={1}>
            {formatCurrency(wallet.cashBalance)}
          </Text>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainer}>
        <SegmentedControl<MFTab>
          options={mainTabs}
          selectedId={activeTab}
          onSelect={setActiveTab}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MUTUAL FUNDS VIEW */}
        {activeTab === 'mutual_funds' && (
          <View style={styles.sectionContainer}>
            {/* Search Input */}
            <View style={styles.searchBarContainer}>
              <Icon name="search" size={16} color={THEME.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search mutual funds, AMCs (HDFC, SBI, Nippon)..."
                placeholderTextColor={THEME.colors.textMuted}
                value={fundSearch}
                onChangeText={setFundSearch}
                autoCapitalize="none"
              />
              {fundSearch.length > 0 && (
                <TouchableOpacity onPress={() => setFundSearch('')}>
                  <Icon name="x" size={16} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsScroll}
            >
              {categoryChips.map((chip) => {
                const isSelected = selectedFundCategory === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedFundCategory(chip.id)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.resultsInfoRow}>
              <Text style={styles.resultsCountText}>
                {filteredFunds.length} mutual funds available
              </Text>
              <View style={styles.amfiBadgeRow}>
                <Icon name="shield" size={12} color="#00D09C" />
                <Text style={styles.amfiBadgeText}>AMFI VERIFIED NAVs</Text>
              </View>
            </View>

            {/* Fund Cards List */}
            {filteredFunds.map((fund) => {
              const holding = fundHoldings.find((h) => h.id === fund.id);
              return (
                <FundCard
                  key={fund.id}
                  fund={fund}
                  heldUnits={holding?.units || 0}
                  onInvestPress={() => openModal('fund_invest', { fund, holding })}
                />
              );
            })}

            {filteredFunds.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="search" size={32} color={THEME.colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No funds matching "{fundSearch}"</Text>
                <Text style={styles.emptyStateSub}>
                  Try searching for Index Funds, Large Cap, Bluechip, or Flexi Cap funds.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* FIXED DEPOSITS VIEW */}
        {activeTab === 'fixed_deposits' && (
          <View style={styles.sectionContainer}>
            <View style={styles.tabIntro}>
              <Text style={styles.introHeading}>Guaranteed Fixed Deposits</Text>
              <Text style={styles.introText}>
                Lock away virtual cash in regulated banking Fixed Deposits. Zero market risk with guaranteed annual compounding.
              </Text>
            </View>

            {/* Interactive FD Simulator Tool Card */}
            <View style={styles.fdCalcCard}>
              <View style={styles.fdCalcHeader}>
                <View style={styles.fdIconBox}>
                  <Icon name="shield" size={18} color={THEME.colors.obsidian} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fdCalcTitle}>FD Maturity & Compound Calculator</Text>
                  <Text style={styles.fdCalcSub}>
                    Simulate guaranteed compounding across Indian banks
                  </Text>
                </View>
              </View>

              {/* Bank Selector */}
              <Text style={styles.inputLabel}>Select Bank & Annual Interest Rate</Text>
              <View style={styles.bankGrid}>
                {bankOptions.map((bank) => {
                  const isBankSelected = selectedBank === bank.name;
                  return (
                    <TouchableOpacity
                      key={bank.name}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedBank(bank.name);
                        setFdRate(bank.rate);
                      }}
                      style={[
                        styles.bankCard,
                        isBankSelected && styles.bankCardSelected,
                      ]}
                    >
                      <Text style={[styles.bankName, isBankSelected && styles.bankNameSelected]}>
                        {bank.name}
                      </Text>
                      <Text style={[styles.bankRate, isBankSelected && styles.bankRateSelected]}>
                        {bank.rate}% p.a.
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Principal Amount Buttons */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Deposit Amount (Virtual Cash)</Text>
              <View style={styles.chipRow}>
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setFdPrincipal(amt)}
                    style={[
                      styles.amtChip,
                      fdPrincipal === amt && styles.amtChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.amtChipText,
                        fdPrincipal === amt && styles.amtChipTextSelected,
                      ]}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration Buttons */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Tenure / Lock-in Duration</Text>
              <View style={styles.chipRow}>
                {[
                  { m: 6, label: '6 Months' },
                  { m: 12, label: '1 Year' },
                  { m: 36, label: '3 Years' },
                  { m: 60, label: '5 Years' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.m}
                    onPress={() => setFdMonths(item.m)}
                    style={[
                      styles.amtChip,
                      fdMonths === item.m && styles.amtChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.amtChipText,
                        fdMonths === item.m && styles.amtChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Maturity Calculation Results Box */}
              <View style={styles.maturityBox}>
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityLabel}>Principal Invested</Text>
                  <Text style={styles.maturityValue}>{formatCurrency(fdPrincipal)}</Text>
                </View>
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityLabel}>Guaranteed Interest Earned</Text>
                  <Text style={[styles.maturityValue, { color: THEME.colors.primaryDark }]}>
                    +{formatCurrency(fdCalc.earnedInterest)}
                  </Text>
                </View>
                <View style={styles.maturityDivider} />
                <View style={styles.maturityRow}>
                  <Text style={styles.maturityTotalLabel}>Estimated Maturity Amount</Text>
                  <Text style={styles.maturityTotalValue}>
                    {formatCurrency(fdCalc.maturityAmount)}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={`Lock ₹${fdPrincipal.toLocaleString('en-IN')} in ${selectedBank}`}
                  onPress={() =>
                    openModal('open_fd_confirm', {
                      principal: fdPrincipal,
                      durationMonths: fdMonths,
                      rate: fdRate,
                      maturityAmount: fdCalc.maturityAmount,
                      bankName: selectedBank,
                    })
                  }
                />
              </View>
            </View>

            {/* Active Fixed Deposits */}
            {fdHoldings.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <Text style={styles.activeFDHeading}>Active Fixed Deposits ({fdHoldings.length})</Text>
                {fdHoldings.map((fd) => (
                  <FDCard key={fd.id} fd={fd} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    gap: 12,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  cashBadge: {
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radii.pill,
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '45%',
  },
  cashBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  cashBadgeAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.accentYellow,
  },
  tabContainer: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  sectionContainer: {
    marginTop: 8,
  },
  tabIntro: {
    marginBottom: 12,
  },
  introHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  introText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 8,
    ...THEME.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
    padding: 0,
  },
  filterChipsScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  filterChip: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
  },
  filterChipSelected: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  resultsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  amfiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amfiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D09C',
    letterSpacing: 0.5,
  },
  fdCalcCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    ...THEME.shadows.sm,
  },
  fdCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  fdIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fdCalcTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  fdCalcSub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 10,
    borderRadius: THEME.radii.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorderSubtle,
  },
  bankCardSelected: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  bankName: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  bankNameSelected: {
    color: '#FFFFFF',
  },
  bankRate: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
    marginTop: 2,
  },
  bankRateSelected: {
    color: THEME.colors.accentYellow,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  amtChip: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingVertical: 7,
    borderRadius: THEME.radii.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderSubtle,
  },
  amtChipSelected: {
    backgroundColor: THEME.colors.accentYellow,
    borderColor: THEME.colors.accentYellow,
  },
  amtChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  amtChipTextSelected: {
    color: THEME.colors.obsidian,
  },
  maturityBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  maturityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maturityLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  maturityValue: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  maturityDivider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 4,
  },
  maturityTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  maturityTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  activeFDHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptyStateSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
