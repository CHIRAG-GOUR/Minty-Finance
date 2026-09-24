import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { THEME } from '../../constants/theme';
import { ProgressBar } from '../common/ProgressBar';
import { calculateLevelInfo } from '../../utils/financialMath';
import { formatXP } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export const XPProgressCard: React.FC = () => {
  const { userProfile, openModal } = useApp();
  const levelInfo = calculateLevelInfo(userProfile.currentXP);
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(cardScale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(cardScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => openModal('level_info')}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.leftInfo}>
            <View>
              <Text style={styles.levelLabel}>
                Level {levelInfo.level} · {levelInfo.title}
              </Text>
              <Text style={styles.xpFraction}>
                {formatXP(userProfile.currentXP)}
                {levelInfo.xpNeededForNextLevel > 0 ? (
                  <Text style={styles.nextTarget}> · {levelInfo.xpNeededForNextLevel} XP to next</Text>
                ) : (
                  <Text style={styles.nextTarget}> · Max Rank</Text>
                )}
              </Text>
            </View>
          </View>

          <Text style={styles.percentText}>{levelInfo.progressPercent}%</Text>
        </View>

        <View style={styles.barWrapper}>
          <ProgressBar
            progressPercent={levelInfo.progressPercent}
            height={6}
            color={THEME.colors.accentYellow}
            backgroundColor={THEME.colors.backgroundSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: 4,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  xpFraction: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  nextTarget: {
    color: THEME.colors.textMuted,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.obsidian,
  },
  barWrapper: {
    marginTop: 2,
  },
});
