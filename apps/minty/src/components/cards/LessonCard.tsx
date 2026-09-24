import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { LessonModule } from '../../types';
import { formatXP } from '../../utils/formatters';

interface LessonCardProps {
  lesson: LessonModule;
  onPress: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, lesson.isCompleted && styles.cardCompleted]}
    >
      <View style={styles.topRow}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{lesson.category}</Text>
        </View>

        <View style={styles.rightBadges}>
          <View style={styles.timePill}>
            <Icon name="time" size={11} color={THEME.colors.textMuted} />
            <Text style={styles.timeText}>{lesson.readTime}</Text>
          </View>

          <View
            style={[
              styles.xpPill,
              lesson.isCompleted ? styles.xpPillCompleted : styles.xpPillActive,
            ]}
          >
            <Icon
              name={lesson.isCompleted ? 'check' : 'award'}
              size={12}
              color={lesson.isCompleted ? THEME.colors.primary : THEME.colors.primaryDark}
            />
            <Text
              style={[
                styles.xpText,
                {
                  color: lesson.isCompleted
                    ? THEME.colors.primary
                    : THEME.colors.primaryDark,
                },
              ]}
            >
              {lesson.isCompleted ? 'Completed' : `+${formatXP(lesson.xpReward)}`}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {lesson.subtitle}
      </Text>

      {/* Bullet preview */}
      <View style={styles.bullets}>
        {lesson.summaryPoints.slice(0, 2).map((point, index) => (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText} numberOfLines={1}>
              {point}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.actionText}>
          {lesson.isCompleted ? 'Review & Retake Quiz' : 'Start Interactive Lesson'}
        </Text>
        <Icon
          name="chevron-right"
          size={16}
          color={lesson.isCompleted ? THEME.colors.textSecondary : THEME.colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.xs,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    ...THEME.shadows.card,
  },
  cardCompleted: {
    borderColor: THEME.colors.primaryMuted,
    backgroundColor: '#FAFDFB',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: THEME.colors.secondarySurface,
    borderColor: THEME.colors.secondaryMuted,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.secondary,
    letterSpacing: 0.2,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  xpPillActive: {
    backgroundColor: THEME.colors.primarySurface,
  },
  xpPillCompleted: {
    backgroundColor: THEME.colors.primarySurface,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  bullets: {
    marginVertical: 10,
    gap: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME.colors.primary,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
    marginTop: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
