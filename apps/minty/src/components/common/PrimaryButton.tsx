import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  iconName?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'amber';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  iconName,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  size = 'md',
}) => {
  const getBackgroundColor = () => {
    if (disabled) return THEME.colors.cardBorder;
    switch (variant) {
      case 'secondary':
        return THEME.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'danger':
        return THEME.colors.danger;
      case 'amber':
        return THEME.colors.amber;
      case 'primary':
      default:
        return THEME.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return THEME.colors.textMuted;
    if (variant === 'outline') return THEME.colors.primary;
    return THEME.colors.textInverse;
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 15;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? THEME.colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        variant === 'primary' && !disabled && styles.glow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {iconName ? (
            <View style={styles.iconContainer}>
              <Icon name={iconName} size={size === 'sm' ? 16 : 18} color={getTextColor()} />
            </View>
          ) : null}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getFontSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    ...THEME.shadows.primaryGlow,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
