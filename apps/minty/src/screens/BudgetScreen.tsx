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
import { ProgressBar } from '../components/common/ProgressBar';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { calculateSavingsRate } from '../utils/financialMath';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';

export const BudgetScreen: React.FC = () => {
  const { budget, updateBudgetIncome, updateBudgetItem, openModal } = useApp();

  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState(budget.monthlyIncome.toString());

  const totalSpent = budget.items.reduce((acc, item) => acc + item.spentAmount, 0);
  const totalAllocated = budget.items.reduce((acc, item) => acc + item.allocatedAmount, 0);
  const { savingsAmount, savingsRatePercent, status } = calculateSavingsRate(
    budget.monthlyIncome,
    totalSpent
  );

  const handleSaveIncome = async () => {
    const parsed = parseInt(tempIncome, 10);
    if (!isNaN(parsed) && parsed > 0) {
      await updateBudgetIncome(parsed);
    }
    setEditingIncome(false);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return THEME.colors.primary;
      case 'good':
        return THEME.colors.secondary;
      case 'moderate':
        return THEME.colors.amber;
      case 'low':
      default:
        return THEME.colors.coral;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Smart Budgeting</Text>
          <Text style={styles.subtitle}>
            Plan monthly cashflows & master the 50/30/20 rule
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Income Card */}
        <View style={styles.incomeCard}>
          <View style={styles.incomeHeader}>
            <View style={styles.incomeLeft}>
              <View style={styles.walletIconBox}>
                <Icon name="wallet" size={20} color={THEME.colors.accentYellow} />
              </View>
              <View>
                <Text style={styles.incomeLabel}>Monthly Income</Text>
                {editingIncome ? (
                  <View style={styles.incomeEditRow}>
                    <TextInput
                      style={styles.incomeInput}
                      keyboardType="numeric"
                      value={tempIncome}
                      onChangeText={setTempIncome}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={handleSaveIncome}
                      style={styles.saveIncomeBtn}
                    >
                      <Icon name="check" size={14} color={THEME.colors.obsidian} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.incomeAmount}>
                    {formatCurrency(budget.monthlyIncome)}
                  </Text>
                )}
              </View>
            </View>

            {!editingIncome && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setTempIncome(budget.monthlyIncome.toString());
                  setEditingIncome(true);
                }}
                style={styles.editBtn}
              >
                <Icon name="settings" size={14} color={THEME.colors.textSecondary} />
                <Text style={styles.editText}>Adjust</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Savings Gauge Master Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.savingsLabel}>Savings Rate</Text>
              <Text style={[styles.savingsRate, { color: getStatusColor() }]}>
                {formatPercentage(savingsRatePercent, false)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
              <Icon name="shield" size={12} color={getStatusColor()} />
              <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                {status.toUpperCase()} HEALTH
              </Text>
            </View>
          </View>

          <View style={styles.gaugeTrack}>
            <ProgressBar
              progressPercent={savingsRatePercent}
              height={10}
              color={getStatusColor()}
              backgroundColor={THEME.colors.cardBorder}
            />
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.sumCol}>
              <Text style={styles.sumLabel}>Total Inflow</Text>
              <Text style={styles.sumVal}>{formatCurrency(budget.monthlyIncome)}</Text>
            </View>
            <View style={styles.sumDivider} />
            <View style={styles.sumCol}>
              <Text style={styles.sumLabel}>Total Expenses</Text>
              <Text style={[styles.sumVal, { color: THEME.colors.coral }]}>
                {formatCurrency(totalSpent)}
              </Text>
            </View>
            <View style={styles.sumDivider} />
            <View style={styles.sumCol}>
              <Text style={styles.sumLabel}>Net Surplus</Text>
              <Text style={[styles.sumVal, { color: THEME.colors.primary }]}>
                {formatCurrency(savingsAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Minty Contextual Tips */}
        <View style={styles.mintiTipsCard}>
          <View style={styles.mintiTipHeader}>
            <Icon name="tip" size={18} color={THEME.colors.amber} />
            <Text style={styles.mintiTipTitle}>Minty Budgeting Tips</Text>
          </View>
          {savingsRatePercent < 20 ? (
            <Text style={styles.mintiTipBody}>
              You are currently saving {savingsRatePercent}%, which is below the 20% golden rule. Consider shifting ₹500 from entertainment to an index fund to accelerate your compound growth.
            </Text>
          ) : (
            <Text style={styles.mintiTipBody}>
              Excellent work maintaining a {savingsRatePercent}% savings rate! Your positive cashflow gives you room to build a diversified portfolio in the Invest module.
            </Text>
          )}
        </View>

        {/* Expense Categories Breakdown */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Spending Categories</Text>
          {budget.items.map((item) => {
            const spentPercent =
              item.allocatedAmount > 0
                ? Math.min(100, Math.round((item.spentAmount / item.allocatedAmount) * 100))
                : 0;
            const isOver = item.spentAmount > item.allocatedAmount;

            return (
              <View key={item.id} style={styles.categoryCard}>
                <View style={styles.catHeader}>
                  <View style={styles.catTitleRow}>
                    <View style={[styles.catDot, { backgroundColor: item.color }]} />
                    <Text style={styles.catName}>{item.categoryName}</Text>
                  </View>
                  <Text style={styles.catSpent}>
                    {formatCurrency(item.spentAmount)} / {formatCurrency(item.allocatedAmount)}
                  </Text>
                </View>

                <View style={styles.catProgressWrapper}>
                  <ProgressBar
                    progressPercent={spentPercent}
                    height={6}
                    color={isOver ? THEME.colors.coral : item.color}
                    backgroundColor={THEME.colors.cardBorder}
                  />
                </View>

                <View style={styles.catFooter}>
                  <Text
                    style={[
                      styles.catStatusText,
                      { color: isOver ? THEME.colors.coral : THEME.colors.textMuted },
                    ]}
                  >
                    {isOver
                      ? `Exceeded budget by ${formatCurrency(item.spentAmount - item.allocatedAmount)}`
                      : `${formatCurrency(item.allocatedAmount - item.spentAmount)} remaining`}
                  </Text>
                  <View style={styles.catActionBtns}>
                    <TouchableOpacity
                      onPress={() => updateBudgetItem(item.id, item.allocatedAmount, Math.max(0, item.spentAmount - 100))}
                      style={styles.microBtn}
                    >
                      <Icon name="minus" size={12} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateBudgetItem(item.id, item.allocatedAmount, item.spentAmount + 100)}
                      style={styles.microBtn}
                    >
                      <Icon name="plus" size={12} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
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
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  incomeCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: THEME.spacing.md,
    ...THEME.shadows.subtle,
  },
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  walletIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  incomeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  incomeInput: {
    height: 34,
    borderWidth: 1.5,
    borderColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    minWidth: 90,
  },
  saveIncomeBtn: {
    backgroundColor: THEME.colors.accentYellow,
    padding: 8,
    borderRadius: THEME.radii.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.backgroundSecondary,
    gap: 4,
  },
  editText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: 10,
    ...THEME.shadows.card,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  savingsRate: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  gaugeTrack: {
    marginVertical: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginTop: 6,
  },
  sumCol: {
    flex: 1,
    alignItems: 'center',
  },
  sumDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  sumLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  mintiTipsCard: {
    backgroundColor: THEME.colors.amberSurface,
    borderColor: THEME.colors.amberMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 12,
    marginTop: 10,
  },
  mintiTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mintiTipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.amber,
  },
  mintiTipBody: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  categoriesSection: {
    marginTop: 14,
    gap: 8,
  },
  sectionHeading: {
    ...THEME.typography.h4,
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.subtle,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  catSpent: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  catProgressWrapper: {
    marginVertical: 4,
  },
  catFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  catStatusText: {
    fontSize: 11,
  },
  catActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  microBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
