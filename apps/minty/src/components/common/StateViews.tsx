import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

interface StateViewProps {
  title: string;
  message?: string;
  /** Kept compact so these can sit inside a card without pushing layout around. */
  compact?: boolean;
}

interface ActionableStateViewProps extends StateViewProps {
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const LoadingState: React.FC<StateViewProps> = ({ title, message, compact }) => (
  <View style={[styles.box, compact && styles.boxCompact]} accessibilityRole="progressbar">
    <ActivityIndicator size="small" color={THEME.colors.primary} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

export const EmptyState: React.FC<ActionableStateViewProps & { iconName?: string }> = ({
  title,
  message,
  compact,
  iconName = 'info',
  actionLabel,
  onAction,
}) => (
  <View style={[styles.box, compact && styles.boxCompact]}>
    <Icon name={iconName} size={compact ? 20 : 26} color={THEME.colors.textMuted} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onAction}
        style={styles.primaryAction}
        accessibilityRole="button"
      >
        <Text style={styles.primaryActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const ErrorState: React.FC<ActionableStateViewProps> = ({
  title,
  message,
  compact,
  actionLabel = 'Retry',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => (
  <View style={[styles.box, compact && styles.boxCompact]} accessibilityRole="alert">
    <Icon name="alert" size={compact ? 20 : 26} color={THEME.colors.coral} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <View style={styles.actionRow}>
      {onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAction}
          style={styles.primaryAction}
          accessibilityRole="button"
        >
          <Icon name="refresh" size={13} color={THEME.colors.textInverse} />
          <Text style={styles.primaryActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSecondaryAction}
          style={styles.secondaryAction}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  box: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
    gap: 8,
  },
  boxCompact: {
    paddingVertical: 16,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: THEME.radii.pill,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textInverse,
  },
  secondaryAction: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: THEME.radii.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.card,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
});
