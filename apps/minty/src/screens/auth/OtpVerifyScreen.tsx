import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { maskPhoneNumber } from '../../utils/phone';

const OTP_LENGTH = 6;
/** Firebase throttles repeat sends; this keeps the user from hitting that wall. */
const RESEND_COOLDOWN_SECONDS = 30;

interface OtpVerifyScreenProps {
  phoneNumber: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  verifyError: string | null;
  isVerifying: boolean;
  isResending: boolean;
  /** Bumped by the parent after a successful resend, to restart the countdown. */
  resendNonce: number;
}

export const OtpVerifyScreen: React.FC<OtpVerifyScreenProps> = ({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  verifyError,
  isVerifying,
  isResending,
  resendNonce,
}) => {
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const submittedForRef = useRef<string | null>(null);

  // Autofocus so the keyboard is up and SMS autofill can land immediately.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  // Countdown restarts whenever a new code is actually sent.
  useEffect(() => {
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  }, [resendNonce]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Clear the field after a rejected code so the user can simply retype.
  useEffect(() => {
    if (verifyError) {
      setCode('');
      submittedForRef.current = null;
      inputRef.current?.focus();
    }
  }, [verifyError]);

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D+/g, '').slice(0, OTP_LENGTH);
      setCode(digits);

      // Submit as soon as the code is complete, but only once per value, so a
      // re-render cannot fire a second verification for the same digits.
      if (digits.length === OTP_LENGTH && submittedForRef.current !== digits && !isVerifying) {
        submittedForRef.current = digits;
        onVerify(digits);
      }
    },
    [isVerifying, onVerify]
  );

  const handleManualVerify = useCallback(() => {
    if (code.length !== OTP_LENGTH || isVerifying) return;
    submittedForRef.current = code;
    onVerify(code);
  }, [code, isVerifying, onVerify]);

  const canResend = secondsLeft <= 0 && !isResending && !isVerifying;

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
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back to phone number entry"
        >
          <Icon name="chevron-left" size={18} color={THEME.colors.textPrimary} />
          <Text style={styles.backText}>Change number</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH}-digit code sent to{' '}
            <Text style={styles.phoneHighlight}>{maskPhoneNumber(phoneNumber)}</Text>
          </Text>

          {/*
            One hidden field backs the six boxes. A single input keeps SMS
            autofill and paste working, which per-digit inputs break.
          */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.otpRow}
            accessibilityRole="button"
            accessibilityLabel="Verification code entry"
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const char = code[i] ?? '';
              const isCursor = i === code.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    char !== '' && styles.otpBoxFilled,
                    isCursor && styles.otpBoxActive,
                    !!verifyError && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{char}</Text>
                </View>
              );
            })}
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            importantForAutofill="yes"
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            editable={!isVerifying}
            caretHidden
          />

          {verifyError ? (
            <View style={styles.errorRow}>
              <Icon name="alert" size={13} color={THEME.colors.coral} />
              <Text style={styles.errorText}>{verifyError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleManualVerify}
            disabled={code.length !== OTP_LENGTH || isVerifying}
            activeOpacity={0.85}
            style={[
              styles.primaryButton,
              (code.length !== OTP_LENGTH || isVerifying) && styles.primaryButtonDisabled,
            ]}
            accessibilityRole="button"
          >
            {isVerifying ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color={THEME.colors.obsidian} />
                <Text style={styles.primaryButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={onResend} accessibilityRole="button">
                <Text style={styles.resendActive}>Resend code</Text>
              </TouchableOpacity>
            ) : isResending ? (
              <Text style={styles.resendMuted}>Sending a new code...</Text>
            ) : (
              <Text style={styles.resendMuted}>Resend in {secondsLeft}s</Text>
            )}
          </View>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 12,
  },
  backText: { fontSize: 13, fontWeight: '700', color: THEME.colors.textPrimary },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: THEME.spacing.lg,
    gap: 14,
  },
  title: { fontSize: 19, fontWeight: '900', color: THEME.colors.textPrimary },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginTop: -8,
  },
  phoneHighlight: { fontWeight: '800', color: THEME.colors.textPrimary },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  otpBox: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.82,
    maxHeight: 62,
    borderRadius: THEME.radii.sm,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  otpBoxActive: { borderColor: THEME.colors.obsidian },
  otpBoxError: { borderColor: THEME.colors.coral },
  otpDigit: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    includeFontPadding: false,
  },
  // Kept in the layout (not display:none) so autofill still targets it.
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
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
  resendRow: { alignItems: 'center', paddingTop: 2 },
  resendActive: { fontSize: 13, fontWeight: '800', color: THEME.colors.primaryDark },
  resendMuted: { fontSize: 13, fontWeight: '600', color: THEME.colors.textMuted },
});
