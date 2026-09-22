import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { SystemMarketConfig } from '../types';

export const AdminControlScreen: React.FC = () => {
  const { marketConfig, updateMarketConfig, openModal, showToast } = useApp();

  const [interestRate, setInterestRate] = useState<number>(marketConfig.benchmarkInterestRate);
  const [inflationRate, setInflationRate] = useState<number>(marketConfig.simulatedInflationRate);
  const [isOpen, setIsOpen] = useState<boolean>(marketConfig.marketStatus === 'open');

  const handleApplyConfig = async () => {
    const updated: SystemMarketConfig = {
      ...marketConfig,
      benchmarkInterestRate: interestRate,
      simulatedInflationRate: inflationRate,
      marketStatus: isOpen ? 'open' : 'closed',
    };
    await updateMarketConfig(updated);
    showToast('Market Policy Updated', 'Global monetary parameters synced to all student sandboxes!', 'success');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Super Admin Desk</Text>
          <Text style={styles.subtitle}>
            Monetary policy, market creator & platform analytics
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openModal('add_stock_modal')}
          style={styles.addAssetBtn}
        >
          <Icon name="plus" size={14} color={THEME.colors.obsidian} />
          <Text style={styles.addAssetBtnText}>+ New Stock</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Platform Core Metrics */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Icon name="pulse" size={20} color={THEME.colors.primary} />
            <Text style={styles.kpiTitle}>Minty Global Financial Health</Text>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Total Liquidity</Text>
              <Text style={styles.kpiVal}>{formatCompactCurrency(marketConfig.totalMarketLiquidity)}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>24h Volume</Text>
              <Text style={styles.kpiVal}>{formatCompactCurrency(marketConfig.totalVolumeTraded24h)}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Active Students</Text>
              <Text style={[styles.kpiVal, { color: THEME.colors.accentYellow }]}>
                {marketConfig.activeUsersCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Global Monetary Policy Controls */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Central Monetary Simulator</Text>
          <Text style={styles.policySub}>
            Adjust simulated macroeconomic indicators to teach students how interest rates and inflation drive asset valuations.
          </Text>

          {/* Market Status Toggle */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>Trading Floor Status</Text>
              <Text style={styles.controlDesc}>
                {isOpen ? 'Open for student trading' : 'Markets paused for maintenance'}
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: THEME.colors.cardBorder, true: THEME.colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          {/* Benchmark Interest Rate */}
          <View style={styles.sliderControl}>
            <View style={styles.sliderHeader}>
              <Text style={styles.controlLabel}>Benchmark FD Interest Rate</Text>
              <Text style={styles.sliderVal}>{interestRate.toFixed(1)}% p.a.</Text>
            </View>
            <View style={styles.stepperRow}>
              {[6.5, 7.0, 7.5, 8.0, 8.5].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setInterestRate(val)}
                  style={[
                    styles.stepBtn,
                    interestRate === val && styles.stepBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBtnText,
                      interestRate === val && styles.stepBtnTextActive,
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Inflation Rate */}
          <View style={styles.sliderControl}>
            <View style={styles.sliderHeader}>
              <Text style={styles.controlLabel}>Simulated Annual Inflation Rate</Text>
              <Text style={[styles.sliderVal, { color: THEME.colors.coral }]}>
                {inflationRate.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.stepperRow}>
              {[4.5, 5.0, 5.8, 6.5, 7.2].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setInflationRate(val)}
                  style={[
                    styles.stepBtn,
                    inflationRate === val && styles.stepBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBtnText,
                      inflationRate === val && styles.stepBtnTextActive,
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryButton
            title="Apply Monetary Policy"
            iconName="check"
            onPress={handleApplyConfig}
            style={{ marginTop: 14 }}
            size="md"
          />
        </View>

        {/* RBAC Role Directory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RBAC Role Access Directory</Text>
          <View style={styles.roleMatrixCard}>
            <View style={styles.roleMatrixItem}>
              <View style={[styles.roleBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.roleBadgeText, { color: '#DC2626' }]}>SUPER ADMIN</Text>
              </View>
              <Text style={styles.roleMatrixDesc}>
                Full platform control, asset creation, monetary policy & system audits.
              </Text>
            </View>
            <View style={styles.roleMatrixItem}>
              <View style={[styles.roleBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.roleBadgeText, { color: '#7C3AED' }]}>TEACHER</Text>
              </View>
              <Text style={styles.roleMatrixDesc}>
                Cohort oversight, student portfolio auditing, challenge creator & startup approvals.
              </Text>
            </View>
            <View style={styles.roleMatrixItem}>
              <View style={[styles.roleBadge, { backgroundColor: THEME.colors.backgroundSecondary }]}>
                <Text style={[styles.roleBadgeText, { color: THEME.colors.obsidian }]}>STUDENT</Text>
              </View>
              <Text style={styles.roleMatrixDesc}>
                Virtual market trading, budget cashflow engine, compound time machine, Shark Tank investor.
              </Text>
            </View>
          </View>
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
    paddingTop: THEME.spacing.sm,
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
    maxWidth: 220,
  },
  addAssetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.pill,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1.5,
    gap: 4,
    ...THEME.shadows.yellowGlow,
  },
  addAssetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  kpiCard: {
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginTop: 10,
    ...THEME.shadows.floatingBar,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: THEME.radii.md,
    padding: 12,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.textInverse,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  policyCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: 12,
    ...THEME.shadows.card,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  policySub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  controlDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 12,
  },
  sliderControl: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderVal: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepBtnActive: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primary,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  stepBtnTextActive: {
    color: THEME.colors.primary,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  roleMatrixCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
    ...THEME.shadows.subtle,
  },
  roleMatrixItem: {
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleMatrixDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
});
