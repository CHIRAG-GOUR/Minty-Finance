import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { Challenge } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { formatXP } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

interface ChallengeCardProps {
  challenge: Challenge;
  onActionPress?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onActionPress,
}) => {
  const { claimChallengeReward, setActiveTab } = useApp();

  const progressPercent = Math.min(
    100,
    Math.round((challenge.progress / (challenge.target || 1)) * 100)
  );

  const handleAction = () => {
    if (challenge.isCompleted && !challenge.isClaimed) {
      claimChallengeReward(challenge.id);
    } else if (onActionPress) {
      onActionPress();
    } else {
      if (challenge.id.includes('daily-1')) {
        setActiveTab('home');
      } else if (challenge.id.includes('daily-2')) {
        setActiveTab('portfolio');
      } else if (challenge.id.includes('weekly-1')) {
        setActiveTab('invest');
      } else if (challenge.id.includes('weekly-2')) {
        setActiveTab('portfolio');
      } else {
        setActiveTab('invest');
      }
    }
  };

  const getCategoryColor = () => {
    switch (challenge.category) {
      case 'daily':
        return THEME.colors.amber;
      case 'weekly':
        return THEME.colors.secondary;
      case 'monthly':
        return THEME.colors.purple;
      default:
        return THEME.colors.primary;
    }
  };

  const getCategoryBg = () => {
    switch (challenge.category) {
      case 'daily':
        return THEME.colors.amberSurface;
      case 'weekly':
        return THEME.colors.secondarySurface;
      case 'monthly':
        return THEME.colors.purpleSurface;
      default:
        return THEME.colors.primarySurface;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryBg() }]}>
          <Icon name="challenge" size={12} color={getCategoryColor()} />
          <Text style={[styles.categoryText, { color: getCategoryColor() }]}>
            {challenge.category.toUpperCase()} CHALLENGE
          </Text>
        </View>

        <View style={styles.xpRewardPill}>
          <Icon name="award" size={13} color={THEME.colors.primary} />
          <Text style={styles.xpRewardText}>+{formatXP(challenge.xpReward)}</Text>
        </View>
      </View>

      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description}>{challenge.description}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressNumbers}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>
            {challenge.progress} / {challenge.target} {challenge.unit} ({progressPercent}%)
          </Text>
        </View>
        <ProgressBar
          progressPercent={progressPercent}
          height={6}
          color={getCategoryColor()}
          backgroundColor={THEME.colors.cardBorder}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAction}
        disabled={challenge.isClaimed}
        style={[
          styles.actionButton,
          challenge.isClaimed
            ? styles.claimedBtn
            : challenge.isCompleted
            ? styles.claimBtn
            : styles.startBtn,
        ]}
      >
        <Icon
          name={
            challenge.isClaimed
              ? 'check'
              : challenge.isCompleted
              ? 'award'
              : 'arrow-up-right'
          }
          size={16}
          color={
            challenge.isClaimed
              ? THEME.colors.textMuted
              : challenge.isCompleted
              ? THEME.colors.textInverse
              : THEME.colors.textPrimary
          }
        />
        <Text
          style={[
            styles.actionBtnText,
            challenge.isClaimed
              ? styles.claimedText
              : challenge.isCompleted
              ? styles.claimText
              : styles.startText,
          ]}
        >
          {challenge.isClaimed
            ? 'Reward Claimed'
            : challenge.isCompleted
            ? 'Claim +XP Reward'
            : 'Start Challenge'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpRewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  xpRewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  title: {
    ...THEME.typography.h4,
    color: THEME.colors.textPrimary,
  },
  description: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    gap: 6,
  },
  startBtn: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  claimBtn: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.primaryGlow,
  },
  claimedBtn: {
    backgroundColor: THEME.colors.cardBorderSubtle,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  startText: {
    color: THEME.colors.textPrimary,
  },
  claimText: {
    color: THEME.colors.textInverse,
  },
  claimedText: {
    color: THEME.colors.textMuted,
  },
});
