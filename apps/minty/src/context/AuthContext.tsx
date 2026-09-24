import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { UserProfile } from '../types';
import { AuthService, AuthError, VerificationHandle, FirebaseUser } from '../services/authService';
import { UserProfileService } from '../services/userProfileService';

/**
 * The single authoritative authentication state.
 *
 * Firebase owns the session; this context mirrors it and pairs it with the
 * Firestore profile. There is no second "logged in" flag anywhere in the app.
 */

export type AuthStatus =
  /** Waiting for Firebase to restore any persisted session. */
  | 'initializing'
  /** No Firebase user — show the phone entry flow. */
  | 'signed-out'
  /** Phone verified, but this UID has no profile yet — ask for a name. */
  | 'needs-profile'
  /** Fully authenticated with a profile. */
  | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  /** Null until the phone number is verified. */
  uid: string | null;
  phoneNumber: string | null;
  profile: UserProfile | null;
  /** False when the build has no real Firebase project wired up. */
  isConfigured: boolean;

  sendCode: (e164: string) => Promise<VerificationHandle>;
  confirmCode: (handle: VerificationHandle, code: string) => Promise<void>;
  completeProfile: (displayName: string, email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  /** Applies simulation progress (XP, streak) to the stored profile. */
  patchProfile: (patch: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const mountedRef = useRef(true);
  const isConfigured = useMemo(() => AuthService.isConfigured(), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Firebase replays the persisted user here on every cold start, which is what
   * keeps the user signed in across restarts without the app storing a token.
   */
  useEffect(() => {
    if (!isConfigured) {
      setStatus('signed-out');
      return;
    }

    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      if (!mountedRef.current) return;
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setStatus('signed-out');
        return;
      }

      const existing = await UserProfileService.getProfile(user.uid);
      if (!mountedRef.current) return;

      if (existing) {
        setProfile(existing);
        setStatus('authenticated');
        // Best-effort; never gates entry into the app. The catch matters: an
        // unawaited rejection here (offline, rules denial) would surface as an
        // unhandled promise rejection rather than being ignored as intended.
        UserProfileService.touchLastLogin(user.uid).catch(() => {});
      } else {
        setProfile(null);
        setStatus('needs-profile');
      }
    });

    return unsubscribe;
  }, [isConfigured]);

  const sendCode = useCallback(async (e164: string) => {
    return AuthService.sendVerificationCode(e164);
  }, []);

  const confirmCode = useCallback(
    async (handle: VerificationHandle, code: string) => {
      // Firebase verifies the code. The auth-state listener above then decides
      // whether this UID goes to the name step or straight into the app.
      await AuthService.confirmCode(handle, code);
    },
    []
  );

  const completeProfile = useCallback(
    async (displayName: string, email: string) => {
      const user = firebaseUser ?? AuthService.getCurrentUser();
      if (!user) {
        throw new AuthError('session-expired', 'Your session expired. Please sign in again.');
      }
      const name = displayName.trim();
      if (name.length === 0) {
        throw new AuthError('unknown', 'Please enter a name.');
      }

      const created = await UserProfileService.createProfile(
        user.uid,
        user.phoneNumber ?? '',
        name,
        email
      );
      if (!mountedRef.current) return;
      setProfile(created);
      setStatus('authenticated');
    },
    [firebaseUser]
  );

  const patchProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const uid = profile?.uid ?? firebaseUser?.uid;
      if (!uid) return;
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
      await UserProfileService.updateProfile(uid, patch);
    },
    [profile?.uid, firebaseUser?.uid]
  );

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const name = displayName.trim();
      if (name.length === 0) {
        throw new AuthError('unknown', 'Please enter a name.');
      }
      // Renaming updates one field; the UID and therefore the portfolio are
      // untouched.
      await patchProfile({ displayName: name });
    },
    [patchProfile]
  );

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    if (!mountedRef.current) return;
    setProfile(null);
    setFirebaseUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      uid: firebaseUser?.uid ?? profile?.uid ?? null,
      phoneNumber: firebaseUser?.phoneNumber ?? profile?.phoneNumber ?? null,
      profile,
      isConfigured,
      sendCode,
      confirmCode,
      completeProfile,
      updateDisplayName,
      patchProfile,
      signOut,
    }),
    [
      status,
      firebaseUser,
      profile,
      isConfigured,
      sendCode,
      confirmCode,
      completeProfile,
      updateDisplayName,
      patchProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
