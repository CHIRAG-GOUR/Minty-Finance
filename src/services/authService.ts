import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithPhoneNumber,
  signInWithCredential,
  signOut as fbSignOut,
} from '@react-native-firebase/auth';
import type { User, AuthCredential, ConfirmationResult } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

/**
 * Firebase Phone Authentication.
 *
 * Firebase is the sole authority on whether a code is correct: this module
 * never compares codes locally and never reports success without a Firebase
 * credential. `verificationId` and tokens stay inside this module — callers get
 * an opaque handle and typed errors.
 */

/**
 * Opaque handle to an in-progress verification. Callers must not read into it —
 * it carries the Firebase confirmation object and the verification id, neither
 * of which belongs in the UI.
 */
export interface VerificationHandle {
  readonly confirmation: ConfirmationResult;
}

export type AuthErrorCode =
  | 'invalid-phone-number'
  | 'invalid-code'
  | 'code-expired'
  | 'too-many-requests'
  | 'network-failed'
  | 'quota-exceeded'
  | 'operation-not-allowed'
  | 'session-expired'
  | 'not-configured'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Maps Firebase's error codes onto messages a student can act on. */
function toAuthError(err: unknown): AuthError {
  const raw = (err as { code?: string })?.code ?? '';
  const nativeMessage = (err as { message?: string })?.message ?? '';

  switch (raw) {
    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return new AuthError('invalid-phone-number', 'Please enter a valid phone number.');
    case 'auth/invalid-verification-code':
      return new AuthError('invalid-code', 'Incorrect verification code.');
    case 'auth/code-expired':
    case 'auth/expired-action-code':
      return new AuthError('code-expired', 'This verification code has expired.');
    case 'auth/too-many-requests':
      return new AuthError(
        'too-many-requests',
        'Too many verification attempts. Please try again later.'
      );
    case 'auth/quota-exceeded':
      return new AuthError(
        'quota-exceeded',
        'Verification is temporarily unavailable. Please try again later.'
      );
    case 'auth/network-request-failed':
      return new AuthError(
        'network-failed',
        'No internet connection. Check your network and try again.'
      );
    case 'auth/operation-not-allowed':
      return new AuthError(
        'operation-not-allowed',
        'Phone sign-in is not enabled for this app. Please contact support.'
      );
    case 'auth/session-expired':
      return new AuthError('session-expired', 'This verification session expired. Please start again.');
    case 'auth/missing-client-identifier':
    case 'auth/app-not-authorized':
      return new AuthError(
        'not-configured',
        'This app is not authorised for phone sign-in yet. Please contact support.'
      );
    default:
      if (/network/i.test(nativeMessage)) {
        return new AuthError('network-failed', 'No internet connection. Check your network and try again.');
      }
      return new AuthError('unknown', 'Unable to send verification code. Please try again.');
  }
}

/**
 * True when a real Firebase project is wired up.
 *
 * The Gradle google-services plugin needs a google-services.json to build at
 * all, so a placeholder file may be present to keep the project compiling.
 * Detecting that here lets the UI say so honestly instead of failing with an
 * opaque Firebase error at the moment the user taps Continue.
 */
export function isFirebaseConfigured(): boolean {
  try {
    const options = getApp().options;
    const projectId = (options?.projectId ?? '').toString();
    const appId = (options?.appId ?? '').toString();
    if (!projectId || !appId) return false;
    // The placeholder shipped with the repo uses this sentinel project id.
    if (projectId.startsWith('REPLACE_ME') || projectId === 'minty-placeholder') return false;
    return true;
  } catch {
    return false;
  }
}

export const AuthService = {
  isConfigured: isFirebaseConfigured,

  /** The currently signed-in Firebase user, or null. */
  getCurrentUser(): User | null {
    try {
      return getAuth().currentUser;
    } catch {
      return null;
    }
  },

  /**
   * Subscribes to Firebase's own session state. This is what makes the session
   * survive an app restart: Firebase restores the persisted user and replays it
   * here, so nothing about "am I logged in" is stored by the app itself.
   */
  onAuthStateChanged(listener: (user: User | null) => void): () => void {
    try {
      return fbOnAuthStateChanged(getAuth(), listener);
    } catch {
      // Without a configured project there is no session to observe.
      listener(null);
      return () => {};
    }
  },

  /**
   * Sends the SMS code. `e164` must already be validated.
   *
   * On Android, Google Play services may verify the device silently or
   * auto-retrieve the SMS; when that happens Firebase hands back a credential
   * and the user never has to type anything.
   */
  async sendVerificationCode(e164: string): Promise<VerificationHandle> {
    if (!isFirebaseConfigured()) {
      throw new AuthError(
        'not-configured',
        'Phone sign-in is not configured for this build yet.'
      );
    }
    try {
      // Firebase sends the SMS and, on Android, may verify the device silently
      // through Play Integrity before any code is typed.
      const confirmation = await signInWithPhoneNumber(getAuth(), e164);
      return { confirmation };
    } catch (err) {
      throw toAuthError(err);
    }
  },

  /**
   * Verifies the typed code with Firebase and signs the user in.
   * Throws for an incorrect or expired code — there is no local shortcut.
   */
  async confirmCode(handle: VerificationHandle, code: string): Promise<User> {
    const trimmed = (code ?? '').replace(/\D+/g, '');
    if (trimmed.length !== 6) {
      throw new AuthError('invalid-code', 'Enter the 6-digit code.');
    }
    if (!handle?.confirmation) {
      throw new AuthError('session-expired', 'This verification session expired. Please start again.');
    }

    try {
      // Firebase checks the code server-side. An incorrect code rejects here;
      // there is no local comparison anywhere in this file.
      const result = await handle.confirmation.confirm(trimmed);
      const user = result?.user ?? getAuth().currentUser;
      if (!user) {
        throw new AuthError('invalid-code', 'Incorrect verification code.');
      }
      return user;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw toAuthError(err);
    }
  },

  /** Signs in with a credential Firebase produced itself (auto-retrieval). */
  async signInWithAutoCredential(credential: AuthCredential): Promise<User> {
    try {
      const result = await signInWithCredential(getAuth(), credential);
      return result.user;
    } catch (err) {
      throw toAuthError(err);
    }
  },

  /** Signs out of Firebase. Local portfolio data is deliberately left intact. */
  async signOut(): Promise<void> {
    try {
      await fbSignOut(getAuth());
    } catch (err) {
      throw toAuthError(err);
    }
  },
};

export type { User as FirebaseUser, AuthCredential };
