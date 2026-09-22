import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  showGreeting?: boolean;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showGreeting = true,
  title,
  subtitle,
}) => {
  const { userProfile, openModal } = useApp();

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {showGreeting ? (
          <>
            <Text style={styles.greeting}>
              {getGreeting()},{' '}
              <Text style={styles.nameHighlight}>{userProfile.name}</Text>
            </Text>
            <Text style={styles.subtext}>
              Minty is ready for your next financial challenge.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtext}>{subtitle}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.actionsRow}>
        {/* Streak Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openModal('streak_info')}
          style={styles.streakPill}
        >
          <Icon name="streak" size={14} color={THEME.colors.amber} />
          <Text style={styles.streakText}>{userProfile.streakDays}d</Text>
        </TouchableOpacity>

        {/* Level Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openModal('level_info')}
          style={styles.levelPill}
        >
          <Icon name="award" size={14} color={THEME.colors.primary} />
          <Text style={styles.levelText}>L{userProfile.level}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
  },
  textContainer: {
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  greeting: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  nameHighlight: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
  },
  subtext: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.amberSurface,
    borderColor: THEME.colors.amberMuted,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  streakText: {
    ...THEME.typography.caption,
    color: THEME.colors.amber,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  levelText: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
  },
});
