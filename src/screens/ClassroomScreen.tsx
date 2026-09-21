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
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatCurrency, formatXP } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { ClassroomCohort } from '../types';

export const ClassroomScreen: React.FC = () => {
  const { cohorts, openModal, showToast } = useApp();
  const [selectedCohortId, setSelectedCohortId] = useState<string>(cohorts[0]?.id || 'cohort_grade9_alpha');

  const activeCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  const handleGrantBonus = (studentName: string) => {
    showToast('Bonus Capital Issued', `Granted ₹1,000 simulated study incentive to ${studentName}!`, 'success');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Teacher Classroom Hub</Text>
          <Text style={styles.subtitle}>
            Monitor Grade 9 cohorts, assign challenges & review financial literacy
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openModal('create_challenge')}
          style={styles.assignChallengeBtn}
        >
          <Icon name="challenge" size={14} color={THEME.colors.obsidian} />
          <Text style={styles.assignBtnText}>+ Assign Challenge</Text>
        </TouchableOpacity>
      </View>

      {/* Cohort Selector Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cohortTabs}
      >
        {cohorts.map((cohort) => {
          const isSelected = cohort.id === selectedCohortId;
          return (
            <TouchableOpacity
              key={cohort.id}
              activeOpacity={0.8}
              onPress={() => setSelectedCohortId(cohort.id)}
              style={[styles.cohortPill, isSelected && styles.cohortPillActive]}
            >
              <Icon
                name="learn"
                size={14}
                color={isSelected ? THEME.colors.textInverse : THEME.colors.textSecondary}
              />
              <Text
                style={[
                  styles.cohortPillText,
                  isSelected && styles.cohortPillTextActive,
                ]}
              >
                {cohort.name} ({cohort.totalStudents})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Class Master Analytics Card */}
        {activeCohort && (
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View>
                <Text style={styles.analyticsCohortName}>{activeCohort.name}</Text>
                <Text style={styles.teacherName}>Mentor: {activeCohort.teacherName}</Text>
              </View>
              <View style={styles.cohortRankPill}>
                <Icon name="trophy" size={12} color={THEME.colors.accentYellow} />
                <Text style={styles.cohortRankText}>Top School Cohort</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Net Worth</Text>
                <Text style={styles.statVal}>{formatCurrency(activeCohort.avgNetWorth)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Savings Rate</Text>
                <Text style={[styles.statVal, { color: THEME.colors.primary }]}>
                  {activeCohort.avgSavingsRate}%
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Missions</Text>
                <Text style={styles.statVal}>{activeCohort.activeChallengeCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Student Roster & Portfolios */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Student Roster & Risk Profiles</Text>
            <Text style={styles.studentCount}>
              {activeCohort?.students.length || 0} Students Active
            </Text>
          </View>

          <View style={styles.rosterList}>
            {activeCohort?.students.map((st, idx) => (
              <View key={st.id} style={styles.studentCard}>
                <View style={styles.studentLeft}>
                  <View style={styles.rankNumBox}>
                    <Text style={styles.rankNum}>#{idx + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{st.name}</Text>
                    <Text style={styles.studentMeta}>
                      Level {st.level} · {formatXP(st.totalXP)}
                    </Text>
                  </View>
                </View>

                <View style={styles.studentRight}>
                  <Text style={styles.studentNetWorth}>{formatCurrency(st.netWorth)}</Text>
                  <View style={styles.riskRow}>
                    <View
                      style={[
                        styles.riskBadge,
                        st.riskScore === 'Conservative'
                          ? styles.riskConservative
                          : st.riskScore === 'Balanced'
                          ? styles.riskBalanced
                          : styles.riskAggressive,
                      ]}
                    >
                      <Text style={styles.riskBadgeText}>{st.riskScore}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleGrantBonus(st.name)}
                      style={styles.grantBtn}
                    >
                      <Text style={styles.grantBtnText}>+₹1k</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Shark Tank Startup Approvals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cohort Startup Proposals</Text>
          <View style={styles.proposalCard}>
            <View style={styles.proposalTop}>
              <View>
                <Text style={styles.proposalName}>EcoStraws Innovations</Text>
                <Text style={styles.proposalAuthor}>Submitted by: Student Green Group (Grade 9A)</Text>
              </View>
              <View style={styles.approvedPill}>
                <Icon name="check" size={12} color={THEME.colors.primary} />
                <Text style={styles.approvedText}>Approved for Tank</Text>
              </View>
            </View>
            <Text style={styles.proposalDesc}>
              Edible biodegradable straws from rice husk waste. Seeking ₹2,000 for 10% equity from classmates.
            </Text>
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
  assignChallengeBtn: {
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
  assignBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.obsidian,
  },
  cohortTabs: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    gap: 8,
  },
  cohortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radii.pill,
    gap: 6,
  },
  cohortPillActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  cohortPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  cohortPillTextActive: {
    color: THEME.colors.accentYellow,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  analyticsCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: 6,
    ...THEME.shadows.card,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  analyticsCohortName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  teacherName: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  cohortRankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  cohortRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  section: {
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  studentCount: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  rosterList: {
    gap: 6,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.subtle,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankNumBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  studentRight: {
    alignItems: 'flex-end',
  },
  studentNetWorth: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.pill,
  },
  riskConservative: {
    backgroundColor: THEME.colors.backgroundSecondary,
  },
  riskBalanced: {
    backgroundColor: THEME.colors.secondarySurface,
  },
  riskAggressive: {
    backgroundColor: THEME.colors.coralSurface,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  grantBtn: {
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  grantBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
  },
  proposalCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 6,
    ...THEME.shadows.subtle,
  },
  proposalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  proposalAuthor: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  approvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  approvedText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
  },
  proposalDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
});
