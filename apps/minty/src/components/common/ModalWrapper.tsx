import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  iconName?: string;
  children: ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  iconName,
  children,
}) => {
  // Hook first: returning before it would change this component's hook count
  // between renders, which is fatal on Android ("Rendered more hooks than
  // during the previous render") and is what closed the app on a stock tap.
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  // A sheet that ends flush with the screen puts its own footer inside the
  // Android gesture-navigation strip, where the system eats the touches: the
  // Buy/Sell bar rendered but could not be pressed. Reserve the real inset.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  // Sheets that build their own rich header pass an empty title; drawing the
  // bar anyway wasted ~100px of vertical space above the fold.
  const hasHeaderText = title.trim() !== '' || (subtitle ?? '').trim() !== '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropLayer} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheetContainer, { paddingBottom: bottomInset }]}>
            <View style={[styles.header, !hasHeaderText && styles.headerBare]}>
              <View style={styles.headerLeft}>
                {iconName && hasHeaderText ? (
                  <View style={styles.iconBox}>
                    <Icon name={iconName} size={18} color={THEME.colors.obsidian} />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  {title.trim() !== '' ? (
                    <Text style={styles.title} numberOfLines={2}>
                      {title}
                    </Text>
                  ) : null}
                  {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={16} color={THEME.colors.obsidian} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>{children}</View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropLayer: {
    ...StyleSheet.absoluteFill,
  },
  sheetWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: THEME.radii.xl,
    borderTopRightRadius: THEME.radii.xl,
    maxHeight: '88%',
    ...THEME.shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  /** Title-less sheets keep only a compact close affordance. */
  headerBare: {
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
});
