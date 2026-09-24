import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

const MAX_NAME_LENGTH = 40;
const MAX_EMAIL_LENGTH = 80;

/** Deliberately permissive: Firebase never emails this, it is contact detail. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface NameEntryScreenProps {
  onSubmit: (displayName: string, email: string) => Promise<void>;
  submitError: string | null;
  isSubmitting: boolean;
}

/**
 * The only profile question asked at sign-up. Deliberately does not collect a
 * role, class, school or permission level — Minty has one account type.
 */
export const NameEntryScreen: React.FC<NameEntryScreenProps> = ({
  onSubmit,
  submitError,
  isSubmitting,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmed = name.trim();
  const trimmedEmail = email.trim();
  const emailValid = EMAIL_PATTERN.test(trimmedEmail);
  const canContinue = trimmed.length >= 2 && emailValid && !isSubmitting;

  const handleContinue = useCallback(async () => {
    if (isSubmitting) return;
    if (trimmed.length < 2) {
      setLocalError('Please enter at least 2 characters.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    setLocalError(null);
    await onSubmit(trimmed, trimmedEmail);
  }, [isSubmitting, trimmed, trimmedEmail, onSubmit]);

  const error = localError ?? submitError;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconBadge}>
          <Icon name="user" size={26} color={THEME.colors.obsidian} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>
            We'll greet you by name. You'll always sign in with your phone number and an
            OTP — no password needed.
          </Text>

          <Text style={styles.fieldLabel}>Your name</Text>

          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={name}
            onChangeText={(text) => {
              setLocalError(null);
              setName(text.slice(0, MAX_NAME_LENGTH));
            }}
            placeholder="Your name"
            placeholderTextColor={THEME.colors.textMuted}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            editable={!isSubmitting}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            accessibilityLabel="Your display name"
          />

          <Text style={styles.fieldLabel}>Email address</Text>
          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={email}
            onChangeText={(text) => {
              setLocalError(null);
              setEmail(text.slice(0, MAX_EMAIL_LENGTH).replace(/\s/g, ''));
            }}
            placeholder="you@gmail.com"
            placeholderTextColor={THEME.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            editable={!isSubmitting}
            maxLength={MAX_EMAIL_LENGTH}
            accessibilityLabel="Your email address"
          />

          {error ? (
            <View style={styles.errorRow}>
              <Icon name="alert" size={13} color={THEME.colors.coral} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
            style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            {isSubmitting ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color={THEME.colors.obsidian} />
                <Text style={styles.primaryButtonText}>Setting up...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xxl,
    gap: 18,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: THEME.spacing.lg,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: -6,
  },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  inputError: { borderColor: THEME.colors.coral },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    marginBottom: -6,
  },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: THEME.colors.coral,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonDisabled: { backgroundColor: THEME.colors.cardBorder },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { fontSize: 15, fontWeight: '900', color: THEME.colors.obsidian },
});
