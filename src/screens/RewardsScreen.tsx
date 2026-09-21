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
import { BadgeCard } from '../components/cards/BadgeCard';
import { ChallengeCard } from '../components/cards/ChallengeCard';
import { ProgressBar } from '../components/common/ProgressBar';
import { LEVEL_THRESHOLDS, calculateLevelInfo } from '../utils/financialMath';
import { formatXP } from '../utils/formatters';
import { useApp } from '../context/AppContext';

export const RewardsScreen: React.FC = () => {
  const { userProfile, badges, challenges, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'unlocked' | 'locked'>('all');

  const levelInfo = calculateLevelInfo(userProfile.currentXP);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);

  const displayedBadges =
    selectedCategory === 'all'
      ? badges
      : selectedCategory === 'unlocked'
      ? unlockedBadges
      : lockedBadges;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rewards & Gamification</Text>
          <Text style={styles.subtitle}>
            XP, Level milestones & achievement badges
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('profile')}
          style={styles.leaderboardBtn}
        >
          <Icon name="leaderboard" size={16} color={THEME.colors.obsidian} />
          <Text style={styles.leaderboardBtnText}>Ranks</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* XP & Level Progression Card */}
        <View style={styles.levelRoadmapCard}>
          <View style={styles.levelRoadmapTop}>
            <View style={styles.levelEmblem}>
              <Icon name="award" size={26} color={THEME.colors.accentYellow} />
            </View>
            <View style={styles.levelTextCol}>
              <Text style={styles.levelTitleText}>Level {levelInfo.level} — {levelInfo.title}</Text>
              <Text style={styles.xpText}>{formatXP(userProfile.currentXP)} Total Accumulated</Text>
            </View>
          </View>

          <View style={styles.progressBarWrapper}>
            <ProgressBar
              progressPercent={levelInfo.progressPercent}
              height={8}
              color={THEME.colors.accentYellow}
            />
            <Text style={styles.progressSubtext}>
              {levelInfo.xpNeededForNextLevel > 0
                ? `${levelInfo.xpNeededForNextLevel} XP needed to reach Level ${levelInfo.level + 1}`
                : 'Maximum Level Reached!'}
            </Text>
          </View>

          {/* Level Progression Hierarchy Steps */}
          <View style={styles.stepsRow}>
            {LEVEL_THRESHOLDS.map((lvl) => {
              const isCurrent = lvl.level === levelInfo.level;
              const isPassed = lvl.level < levelInfo.level;
              return (
                <View key={lvl.level} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCurrent && styles.stepCircleCurrent,
                      isPassed && styles.stepCirclePassed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNum,
                        (isCurrent || isPassed) && styles.stepNumActive,
                      ]}
                    >
                      L{lvl.level}
                    </Text>
                  </View>
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {lvl.title.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Streak & Milestone Tracker */}
        <View style={styles.streakBanner}>
          <View style={styles.streakIconBox}>
            <Icon name="streak" size={24} color={THEME.colors.coral} />
          </View>
          <View style={styles.streakTextBox}>
            <Text style={styles.streakHeading}>{userProfile.streakDays}-Day Learning Streak!</Text>
            <Text style={styles.streakDesc}>
              Log in daily to earn streak multipliers and unlock exclusive badges.
            </Text>
          </View>
        </View>

        {/* Challenge Hub */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <View style={styles.challengesList}>
            {challenges.map((ch) => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
          </View>
        </View>

        {/* Badges Gallery */}
        <View style={styles.section}>
          <View style={styles.badgesHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Achievement Badges</Text>
              <Text style={styles.badgesCountText}>
                {unlockedBadges.length} of {badges.length} Unlocked
              </Text>
            </View>

            {/* Filter Toggle */}
            <View style={styles.filterRow}>
              {(['all', 'unlocked', 'locked'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedCategory(filter)}
                  style={[
                    styles.filterPill,
                    selectedCategory === filter && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedCategory === filter && styles.filterTextActive,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.badgesGrid}>
            {displayedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
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
  leaderboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentYellow,
    borderColor: THEME.colors.obsidian,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  leaderboardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  levelRoadmapCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: THEME.spacing.md,
    ...THEME.shadows.card,
  },
  levelRoadmapTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelEmblem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTextCol: {
    flex: 1,
  },
  levelTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  xpText: {
    fontSize: 12,
    color: THEME.colors.obsidian,
    fontWeight: '800',
    marginTop: 2,
  },
  progressBarWrapper: {
    marginVertical: 12,
  },
  progressSubtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleCurrent: {
    backgroundColor: THEME.colors.obsidian,
    ...THEME.shadows.card,
  },
  stepCirclePassed: {
    backgroundColor: THEME.colors.accentYellow,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  stepNumActive: {
    color: THEME.colors.textInverse,
  },
  stepTitle: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.coralSurface,
    borderColor: THEME.colors.coralMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 12,
    marginTop: 10,
    gap: 12,
  },
  streakIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.subtle,
  },
  streakTextBox: {
    flex: 1,
  },
  streakHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.coral,
  },
  streakDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  challengesList: {
    marginTop: 6,
    gap: 6,
  },
  badgesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesCountText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 2,
    borderRadius: THEME.radii.pill,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.pill,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.card,
    ...THEME.shadows.subtle,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  filterTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
});
