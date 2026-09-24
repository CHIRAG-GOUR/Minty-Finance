import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AuthError, VerificationHandle } from '../../services/authService';
import { PhoneEntryScreen } from './PhoneEntryScreen';
import { OtpVerifyScreen } from './OtpVerifyScreen';
import { NameEntryScreen } from './NameEntryScreen';

type Step = 'phone' | 'otp';

function messageFor(err: unknown): string {
  if (err instanceof AuthError) return err.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Drives phone -> OTP -> name.
 *
 * The step is local UI state; whether the user is actually authenticated is
 * decided solely by AuthContext (i.e. by Firebase). This component can never
 * let someone into the app on its own.
 */
export const AuthGate: React.FC = () => {
  const { status, phoneNumber, isConfigured, sendCode, confirmCode, completeProfile } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [handle, setHandle] = useState<VerificationHandle | null>(null);
  const [resendNonce, setResendNonce] = useState(0);

  const [sendError, setSendError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Guards against a second send while one is already in flight.
  const sendInFlight = useRef(false);

  const goBackToPhone = useCallback(() => {
    setStep('phone');
    setHandle(null);
    setVerifyError(null);
    setSendError(null);
  }, []);

  // Back from the OTP step returns to phone entry rather than exiting the app.
  React.useEffect(() => {
    if (step !== 'otp') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackToPhone();
      return true;
    });
    return () => sub.remove();
  }, [step, goBackToPhone]);

  const handleSend = useCallback(
    async (e164: string) => {
      if (sendInFlight.current) return;
      sendInFlight.current = true;
      setIsSending(true);
      setSendError(null);
      try {
        const next = await sendCode(e164);
        setHandle(next);
        setPendingPhone(e164);
        setResendNonce((n) => n + 1);
        setStep('otp');
      } catch (err) {
        setSendError(messageFor(err));
      } finally {
        sendInFlight.current = false;
        setIsSending(false);
      }
    },
    [sendCode]
  );

  const handleResend = useCallback(async () => {
    if (sendInFlight.current || !pendingPhone) return;
    sendInFlight.current = true;
    setIsResending(true);
    setVerifyError(null);
    try {
      const next = await sendCode(pendingPhone);
      setHandle(next);
      setResendNonce((n) => n + 1);
    } catch (err) {
      setVerifyError(messageFor(err));
    } finally {
      sendInFlight.current = false;
      setIsResending(false);
    }
  }, [pendingPhone, sendCode]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!handle || isVerifying) return;
      setIsVerifying(true);
      setVerifyError(null);
      try {
        await confirmCode(handle, code);
        // On success the auth listener moves `status` on; nothing to do here.
      } catch (err) {
        setVerifyError(messageFor(err));
      } finally {
        setIsVerifying(false);
      }
    },
    [handle, isVerifying, confirmCode]
  );

  const handleName = useCallback(
    async (displayName: string, email: string) => {
      if (isSavingProfile) return;
      setIsSavingProfile(true);
      setProfileError(null);
      try {
        await completeProfile(displayName, email);
      } catch (err) {
        setProfileError(messageFor(err));
      } finally {
        setIsSavingProfile(false);
      }
    },
    [isSavingProfile, completeProfile]
  );

  const body = () => {
    if (status === 'needs-profile') {
      return (
        <NameEntryScreen
          onSubmit={handleName}
          submitError={profileError}
          isSubmitting={isSavingProfile}
        />
      );
    }
    if (step === 'otp') {
      return (
        <OtpVerifyScreen
          phoneNumber={pendingPhone || phoneNumber || ''}
          onVerify={handleVerify}
          onResend={handleResend}
          onBack={goBackToPhone}
          verifyError={verifyError}
          isVerifying={isVerifying}
          isResending={isResending}
          resendNonce={resendNonce}
        />
      );
    }
    return (
      <PhoneEntryScreen
        onSubmit={handleSend}
        submitError={sendError}
        isSubmitting={isSending}
        isConfigured={isConfigured}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      <View style={styles.body}>{body()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  body: { flex: 1 },
});
