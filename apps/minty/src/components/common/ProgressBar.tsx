import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../../constants/theme';

interface ProgressBarProps {
  progressPercent: number; // 0 to 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercent,
  height = 8,
  color = THEME.colors.primary,
  backgroundColor = THEME.colors.cardBorder,
  style,
}) => {
  const clamped = Math.min(100, Math.max(0, isNaN(progressPercent) ? 0 : progressPercent));

  return (
    <View style={[styles.track, { height, backgroundColor }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: THEME.radii.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: THEME.radii.pill,
  },
});
