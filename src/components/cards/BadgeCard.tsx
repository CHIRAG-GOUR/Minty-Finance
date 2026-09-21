import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { Badge } from '../../types';
import { ProgressBar } from '../common/ProgressBar';

interface BadgeCardProps {
  badge: Badge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const isUnlocked = badge.isUnlocked;

  const getBadgeColor = () => {
    switch (badge.category) {
      case 'learning':
        return THEME.colors.primary;
      case 'saving':
        return THEME.colors.secondary;
      case 'investing':
        return THEME.colors.amber;
      case 'streak':
        return THEME.colors.coral;
      case 'shark_tank':
        return THEME.colors.purple;
      default:
        return THEME.colors.primary;
    }
  };

  const badgeColor = getBadgeColor();

  return (
    <View
      style={[
        styles.card,
        isUnlocked ? styles.cardUnlocked : styles.cardLocked,
      ]}
    >
      {/* Icon Emblem Circle */}
      <View
        style={[
          styles.emblem,
          {
            backgroundColor: isUnlocked ? `${badgeColor}15` : THEME.colors.backgroundSecondary,
            borderColor: isUnlocked ? badgeColor : THEME.colors.cardBorder,
          },
        ]}
      >
        <Icon
          name={isUnlocked ? badge.iconName : 'lock'}
          size={24}
          color={isUnlocked ? badgeColor : THEME.colors.textMuted}
        />
      </View>

      <Text style={[styles.title, !isUnlocked && styles.textLocked]} numberOfLines={1}>
        {badge.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {badge.description}
      </Text>

      {/* Progress or Unlock Status */}
      <View style={styles.footer}>
        {isUnlocked ? (
          <View style={styles.unlockedPill}>
            <Icon name="check" size={12} color={THEME.colors.primary} />
            <Text style={styles.unlockedText}>Unlocked · +{badge.xpValue} XP</Text>
          </View>
        ) : (
          <View style={styles.progressBox}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressCount}>
                {badge.progress}/{badge.maxProgress}
              </Text>
            </View>
            <ProgressBar
              progressPercent={(badge.progress / badge.maxProgress) * 100}
              height={4}
              color={badgeColor}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    margin: 4,
    borderWidth: 1,
    alignItems: 'center',
    ...THEME.shadows.subtle,
  },
  cardUnlocked: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
  },
  cardLocked: {
    backgroundColor: '#FAFAFA',
    borderColor: THEME.colors.cardBorderSubtle,
    opacity: 0.85,
  },
  emblem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  textLocked: {
    color: THEME.colors.textSecondary,
  },
  description: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
    minHeight: 28,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  unlockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  progressBox: {
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  progressCount: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
});
