import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { LEVEL_THRESHOLDS, calculateLevelInfo } from '../utils/financialMath';
import { formatXP } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface LevelInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LevelInfoModal: React.FC<LevelInfoModalProps> = ({ visible, onClose }) => {
  const { userProfile } = useApp();
  if (!visible) return null;
  const currentInfo = calculateLevelInfo(userProfile.currentXP);

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Investor Level System"
      subtitle="Climb tiers by learning, saving and simulating"
      iconName="award"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.currentCard}>
          <View style={styles.currentTop}>
            <View style={styles.currentEmblem}>
              <Icon name="award" size={24} color={THEME.colors.primary} />
            </View>
            <View>
              <Text style={styles.currentLabel}>Your Current Rank</Text>
              <Text style={styles.currentTitle}>
                Level {currentInfo.level} · {currentInfo.title}
              </Text>
            </View>
          </View>
          <Text style={styles.currentXPText}>
            {formatXP(userProfile.currentXP)} accumulated ({currentInfo.progressPercent}% to Level {currentInfo.level + 1})
          </Text>
        </View>

        <Text style={styles.listHeading}>All Level Tiers & Perks</Text>

        <View style={styles.tierList}>
          {LEVEL_THRESHOLDS.map((lvl) => {
            const isUnlocked = userProfile.currentXP >= lvl.minXP;
            const isCurrent = lvl.level === currentInfo.level;

            return (
              <View
                key={lvl.level}
                style={[
                  styles.tierCard,
                  isCurrent && styles.tierCardCurrent,
                  !isUnlocked && styles.tierCardLocked,
                ]}
              >
                <View
                  style={[
                    styles.tierIcon,
                    isUnlocked ? styles.tierIconUnlocked : styles.tierIconLocked,
                  ]}
                >
                  <Icon
                    name={isUnlocked ? 'award' : 'lock'}
                    size={16}
                    color={isUnlocked ? THEME.colors.primary : THEME.colors.textMuted}
                  />
                </View>

                <View style={styles.tierInfo}>
                  <View style={styles.tierNameRow}>
                    <Text style={styles.tierName}>
                      Level {lvl.level} — {lvl.title}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tierXPReq}>
                    {lvl.minXP === 0 ? 'Starter' : `${lvl.minXP.toLocaleString()} XP required`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 20,
    gap: 12,
  },
  currentCard: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 14,
  },
  currentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  currentEmblem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    textTransform: 'uppercase',
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  currentXPText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  listHeading: {
    ...THEME.typography.h4,
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  tierList: {
    gap: 8,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
  },
  tierCardCurrent: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  tierCardLocked: {
    backgroundColor: THEME.colors.backgroundSecondary,
    opacity: 0.8,
  },
  tierIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIconUnlocked: {
    backgroundColor: THEME.colors.primarySurface,
  },
  tierIconLocked: {
    backgroundColor: THEME.colors.cardBorder,
  },
  tierInfo: {
    flex: 1,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  currentBadge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.pill,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textInverse,
  },
  tierXPReq: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
});
