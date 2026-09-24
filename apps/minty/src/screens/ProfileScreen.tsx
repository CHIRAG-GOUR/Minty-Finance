import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { formatXP, formatPercentage, formatCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    badges,
    lessons,
    leaderboard,
    settings,
    toggleSetting,
    openModal,
  } = useApp();
  const { profile, phoneNumber, signOut } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'leaderboard' | 'credits'>('profile');

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const completedLessons = lessons.filter((l) => l.isCompleted).length;

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'You can sign back in with the same phone number. Your portfolio and progress stay on your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            // Firebase clears the session; nothing belonging to this UID is deleted.
            signOut().catch(() => {});
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Profile & Hub</Text>
        <Text style={styles.subtitle}>
          Track record, leaderboard and account
        </Text>
      </View>

      {/* Profile Navigation Tabs */}
      <View style={styles.tabNavRow}>
        {[
          { id: 'profile', label: 'My Stats', icon: 'user' },
          { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
          { id: 'credits', label: 'Team Credits', icon: 'award' },
        ].map((t) => {
          const isSelected = activeSubTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveSubTab(t.id as any)}
              style={[styles.subTabBtn, isSelected && styles.subTabBtnActive]}
            >
              <Icon
                name={t.icon}
                size={14}
                color={isSelected ? THEME.colors.accentYellow : THEME.colors.textMuted}
              />
              <Text style={[styles.subTabText, isSelected && styles.subTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MY STATS TAB */}
        {activeSubTab === 'profile' && (
          <>
            {/* Student ID Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                <View style={styles.avatarCircle}>
                  <Icon name="user" size={32} color={THEME.colors.accentYellow} />
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.profileName}>{userProfile.displayName}</Text>
                  <Text style={styles.gradeText} numberOfLines={1}>{profile?.email || phoneNumber || 'Investor'}</Text>
                  <View style={styles.levelTag}>
                    <Icon name="award" size={12} color={THEME.colors.obsidian} />
                    <Text style={styles.levelTagText}>
                      Level {userProfile.level} · {userProfile.levelTitle}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxVal}>{formatXP(userProfile.currentXP)}</Text>
                  <Text style={styles.statBoxLabel}>Total XP</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statBoxVal}>{unlockedCount}/{badges.length}</Text>
                  <Text style={styles.statBoxLabel}>Badges</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statBoxVal}>{completedLessons}/{lessons.length}</Text>
                  <Text style={styles.statBoxLabel}>Lessons</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statBoxVal}>{userProfile.streakDays}d</Text>
                  <Text style={styles.statBoxLabel}>Streak</Text>
                </View>
              </View>
            </View>

            {/* App Settings Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Preferences & Feedback</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>Haptic Feedback</Text>
                  <Text style={styles.settingSub}>Vibrate on trade orders & quiz answers</Text>
                </View>
                <Switch
                  value={settings.hapticsEnabled}
                  onValueChange={() => toggleSetting('hapticsEnabled')}
                  trackColor={{ false: THEME.colors.cardBorder, true: THEME.colors.primary }}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>Learning Audio Alerts</Text>
                  <Text style={styles.settingSub}>Play chime on XP level-ups & rewards</Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={() => toggleSetting('soundEnabled')}
                  trackColor={{ false: THEME.colors.cardBorder, true: THEME.colors.primary }}
                />
              </View>
            </View>


            {/* Account */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Account</Text>
              <Text style={styles.resetDesc}>
                Signed in as {profile?.displayName ?? 'Investor'}
                {phoneNumber ? ` · ${phoneNumber}` : ''}
              </Text>
              <PrimaryButton
                title="Log out"
                iconName="user"
                variant="secondary"
                onPress={handleLogout}
                size="md"
              />
            </View>
          </>
        )}

        {/* LEADERBOARD TAB */}
        {activeSubTab === 'leaderboard' && (
          <View style={styles.leaderboardContainer}>
            <View style={styles.leaderboardBanner}>
              <Icon name="leaderboard" size={24} color={THEME.colors.amber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Monthly Teen Leaderboard</Text>
                <Text style={styles.bannerSub}>
                  Rankings are based on XP, completed challenges and portfolio diversification.
                </Text>
              </View>
            </View>

            <View style={styles.rankingsList}>
              {leaderboard.map((user) => {
                const isTop3 = user.rank <= 3;
                return (
                  <View
                    key={user.id}
                    style={[
                      styles.rankItem,
                      user.isCurrentUser && styles.rankItemCurrentUser,
                    ]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        user.rank === 1
                          ? styles.rank1
                          : user.rank === 2
                          ? styles.rank2
                          : user.rank === 3
                          ? styles.rank3
                          : styles.rankOther,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          isTop3 && styles.rankTextTop3,
                        ]}
                      >
                        #{user.rank}
                      </Text>
                    </View>

                    <View style={styles.userCol}>
                      <Text style={[styles.userName, user.isCurrentUser && styles.userNameCurrent]}>
                        {user.name}
                      </Text>
                      <Text style={styles.userGrade}>
                        {user.schoolGrade} · Level {user.level}
                      </Text>
                    </View>

                    <View style={styles.userXPCol}>
                      <Text style={styles.userXPVal}>{formatXP(user.totalXP)}</Text>
                      <Text style={styles.userROI}>+{formatPercentage(user.roiPercent, false)} ROI</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* PARENT TRUST & SAFETY TAB */}

        {/* TEAM CREDITS TAB */}
        {activeSubTab === 'credits' && (
          <View style={styles.creditsContainer}>
            <View style={styles.creditsHeader}>
              <Text style={styles.creditsTitle}>Minty Finance Core Team</Text>
              <Text style={styles.creditsSub}>
                Built by the Skillizee team
              </Text>
            </View>

            {[
              { name: 'Platform Engineering Lab', role: 'System Architecture, Offline Sync & State Management', icon: 'zap' },
              { name: 'Gamification & Design Systems', role: 'Interactive Visuals, XP Progression & Badges Engine', icon: 'award' },
              { name: 'Financial Mathematics Core', role: 'NSE/BSE Equities, Mutual Funds, SIP & Compound Math', icon: 'invest' },
              { name: 'Financial Literacy & Curriculum', role: 'Curated Lessons, Interactive Quizzes & Budget Rule Modules', icon: 'growth' },
              { name: 'Classroom Venture Studio', role: 'Shark Tank Deals & Valuation Mechanics', icon: 'rocket' },
            ].map((member, idx) => (
              <View key={idx} style={styles.memberCard}>
                <View style={styles.memberIcon}>
                  <Icon name={member.icon} size={20} color={THEME.colors.accentYellow} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  tabNavRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    gap: 6,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 4,
  },
  subTabBtnActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  subTabTextActive: {
    color: THEME.colors.accentYellow,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  gradeText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  levelTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.obsidian,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  statBoxLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  sectionCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginTop: 12,
    ...THEME.shadows.subtle,
  },
  cardTitle: {
    ...THEME.typography.h4,
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  settingSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 8,
  },
  resetDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  leaderboardContainer: {
    marginTop: THEME.spacing.sm,
  },
  leaderboardBanner: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.amberSurface,
    borderColor: THEME.colors.amberMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.amber,
  },
  bannerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  rankingsList: {
    gap: 6,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.subtle,
  },
  rankItemCurrentUser: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rank1: {
    backgroundColor: '#FEF3C7',
  },
  rank2: {
    backgroundColor: '#E2E8F0',
  },
  rank3: {
    backgroundColor: '#FFEDD5',
  },
  rankOther: {
    backgroundColor: THEME.colors.backgroundSecondary,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  rankTextTop3: {
    color: THEME.colors.textPrimary,
  },
  userCol: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  userNameCurrent: {
    color: THEME.colors.primaryDark,
  },
  userGrade: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  userXPCol: {
    alignItems: 'flex-end',
  },
  userXPVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  userROI: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  trustContainer: {
    marginTop: THEME.spacing.sm,
    gap: 10,
  },
  trustBanner: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    alignItems: 'center',
  },
  trustHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    marginTop: 6,
    marginBottom: 4,
  },
  trustSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  trustPointCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
    ...THEME.shadows.subtle,
  },
  trustIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustPointText: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  pointBody: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  creditsContainer: {
    marginTop: THEME.spacing.sm,
    gap: 8,
  },
  creditsHeader: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginBottom: 4,
  },
  creditsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  creditsSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
    ...THEME.shadows.subtle,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  memberRole: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
