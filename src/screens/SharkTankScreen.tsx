import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { SharkTankStartup } from '../types';

export const SharkTankScreen: React.FC = () => {
  const { sharkTankStartups, openModal, wallet, userProfile } = useApp();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const industries = [
    'all',
    'CleanTech',
    'EdTech',
    'FinTech',
    'HealthTech',
    'AgriTech',
    'SaaS',
    'AI & Robotics',
    'D2C',
    'EV & Mobility',
  ];

  const filteredStartups = sharkTankStartups.filter((s) => {
    if (selectedIndustry === 'all') return true;
    const sel = selectedIndustry.toLowerCase();
    const ind = (s.industry || '').toLowerCase();
    return ind.includes(sel) || sel.includes(ind);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shark Tank Arena</Text>
          <Text style={styles.subtitle}>
            Invest simulated angel capital in student ventures
          </Text>
        </View>

        <View style={styles.cashBadge}>
          <Text style={styles.cashBadgeLabel}>Angel Cash</Text>
          <Text style={styles.cashBadgeAmount}>{formatCurrency(wallet.cashBalance)}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScroll}
      >
        {industries.map((ind) => {
          const isSelected = selectedIndustry === ind;
          return (
            <TouchableOpacity
              key={ind}
              activeOpacity={0.8}
              onPress={() => setSelectedIndustry(ind)}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {ind.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shark Tank Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerLeft}>
            <View style={styles.badgeRow}>
              <Icon name="rocket" size={16} color={THEME.colors.accentYellow} />
              <Text style={styles.bannerTag}>Skillizee Ideathon 2026</Text>
            </View>
            <Text style={styles.bannerTitle}>Classroom Venture Deals</Text>
            <Text style={styles.bannerDesc}>
              Learn valuation math (Ask Amount ÷ Equity % = Implied Valuation) by negotiating deals with peer founders.
            </Text>
          </View>
        </View>

        {/* Startups List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Active Pitches ({filteredStartups.length})</Text>

          {filteredStartups.map((startup) => {
            const impliedVal = Math.round((startup.askAmount / startup.askEquityPercent) * 100);

            return (
              <View key={startup.id} style={styles.startupCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryRow}>
                      <View style={styles.industryTag}>
                        <Text style={styles.industryTagText}>{startup.industry}</Text>
                      </View>
                      {startup.isApprovedByTeacher && (
                        <View style={styles.verifiedTag}>
                          <Icon name="check" size={10} color={THEME.colors.obsidian} />
                          <Text style={styles.verifiedTagText}>Teacher Approved</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.startupName}>{startup.name}</Text>
                    <Text style={styles.tagline}>{startup.tagline}</Text>
                  </View>
                </View>

                {/* Founder Info */}
                <View style={styles.founderRow}>
                  <Icon name="user" size={12} color={THEME.colors.textMuted} />
                  <Text style={styles.founderText}>
                    Founder: {startup.founder} (Age {startup.founderAge} · {startup.cohort || 'Grade 9'})
                  </Text>
                </View>

                {/* Problem & Solution Summary */}
                <View style={styles.storyBox}>
                  <Text style={styles.storyLabel}>The Pitch:</Text>
                  <Text style={styles.storyText} numberOfLines={2}>
                    {startup.problem} {startup.solution}
                  </Text>
                </View>

                {/* Deal Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.mLabel}>Ask Capital</Text>
                    <Text style={styles.mVal}>{formatCurrency(startup.askAmount)}</Text>
                  </View>
                  <View style={styles.mDivider} />
                  <View style={styles.metricCol}>
                    <Text style={styles.mLabel}>Equity Offer</Text>
                    <Text style={[styles.mVal, { color: THEME.colors.obsidian }]}>
                      {startup.askEquityPercent}%
                    </Text>
                  </View>
                  <View style={styles.mDivider} />
                  <View style={styles.metricCol}>
                    <Text style={styles.mLabel}>Valuation</Text>
                    <Text style={styles.mVal}>{formatCompactCurrency(impliedVal)}</Text>
                  </View>
                </View>

                {/* Action CTA */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => openModal('shark_tank', startup)}
                  style={styles.negotiateBtn}
                >
                  <Icon name="rocket" size={16} color={THEME.colors.obsidian} />
                  <Text style={styles.negotiateBtnText}>Enter Tank & Make Offer</Text>
                </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxWidth: 200,
  },
  cashBadge: {
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.pill,
    alignItems: 'flex-end',
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
  filterScrollView: {
    maxHeight: 52,
    flexGrow: 0,
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: THEME.colors.accentYellow,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  bannerCard: {
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginTop: 4,
    marginBottom: 14,
    ...THEME.shadows.card,
  },
  bannerLeft: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.textInverse,
  },
  bannerDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  listSection: {
    gap: 12,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  startupCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 16,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 10,
    ...THEME.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  industryTag: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  industryTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
    gap: 3,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.obsidian,
  },
  startupName: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  tagline: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  founderText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  storyBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 10,
    borderRadius: THEME.radii.md,
  },
  storyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  storyText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorderSubtle,
    borderWidth: 1,
    borderRadius: THEME.radii.md,
    padding: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  mLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  mVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  mDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  negotiateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentYellow,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    gap: 6,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1.5,
    ...THEME.shadows.yellowGlow,
  },
  negotiateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.obsidian,
  },
});
