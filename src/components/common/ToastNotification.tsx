import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { ToastData } from '../../context/AppContext';

interface ToastProps {
  toast: ToastData | null;
  onDismiss?: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const getThemeProps = () => {
    switch (toast.type) {
      case 'warning':
        return {
          bg: THEME.colors.amberSurface,
          border: THEME.colors.amberLight,
          icon: 'warning',
          iconColor: THEME.colors.amber,
          titleColor: THEME.colors.amber,
        };
      case 'info':
        return {
          bg: THEME.colors.secondarySurface,
          border: THEME.colors.secondaryLight,
          icon: 'info',
          iconColor: THEME.colors.secondary,
          titleColor: THEME.colors.secondary,
        };
      case 'success':
      default:
        return {
          bg: THEME.colors.primarySurface,
          border: THEME.colors.primaryLight,
          icon: 'success',
          iconColor: THEME.colors.primary,
          titleColor: THEME.colors.primary,
        };
    }
  };

  const { bg, border, icon, iconColor, titleColor } = getThemeProps();

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDismiss}
        style={[styles.container, { backgroundColor: bg, borderColor: border }]}
      >
        <View style={styles.iconBox}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.textBox}>
          <Text style={[styles.title, { color: titleColor }]}>{toast.title}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: THEME.radii.lg,
    borderWidth: 1.5,
    ...THEME.shadows.elevated,
  },
  iconBox: {
    marginRight: 12,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
