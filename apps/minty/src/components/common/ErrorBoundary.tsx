import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

interface ErrorBoundaryProps {
  /** Shown in the fallback so a student knows which part failed. */
  section: string;
  children: ReactNode;
  /** Optional "Go Back" affordance — e.g. closing the modal the section lives in. */
  onGoBack?: () => void;
  /** Called after a retry resets the boundary, to refetch whatever failed. */
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  /** Bumped on retry to force a fresh subtree instead of re-rendering the broken one. */
  resetKey: number;
}

/**
 * Isolates a feature area so a render fault there cannot terminate the app.
 *
 * React Native's default behaviour for an uncaught render error in a release
 * build is to hand it to the native exception handler, which kills the process.
 * Wrapping each major area means the worst case becomes a recoverable panel.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaces in `adb logcat -s ReactNativeJS` without taking the app down.
    console.error(`[Minti] Section "${this.props.section}" failed to render`, error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState((prev) => ({ error: null, resetKey: prev.resetKey + 1 }));
    this.props.onRetry?.();
  };

  render() {
    const { error, resetKey } = this.state;
    const { section, children, onGoBack } = this.props;

    if (!error) {
      return <React.Fragment key={resetKey}>{children}</React.Fragment>;
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconBox}>
          <Icon name="alert" size={22} color={THEME.colors.coral} />
        </View>
        <Text style={styles.title}>Something went wrong in this section.</Text>
        <Text style={styles.subtitle}>
          {section} could not be displayed. Your portfolio and balance are safe.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={this.handleRetry}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Icon name="refresh" size={14} color={THEME.colors.textInverse} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>

          {onGoBack ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onGoBack}
              style={styles.backBtn}
              accessibilityRole="button"
            >
              <Icon name="chevron-left" size={14} color={THEME.colors.textSecondary} />
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
    gap: 10,
    backgroundColor: THEME.colors.background,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.coralSurface,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: THEME.radii.pill,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textInverse,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: THEME.radii.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.card,
  },
  backText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
});
