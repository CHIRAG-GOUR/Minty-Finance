import { getFirestore, doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { toNonEmptyString } from '../utils/safeNumber';

/**
 * The user profile at `users/{uid}`.
 *
 * Firestore is the source of truth; a local mirror keyed by UID lets the app
 * open instantly and stay usable offline. Nothing here is keyed by phone number
 * or display name — changing either must never produce a different account.
 */

const LOCAL_PROFILE_PREFIX = '@minty_profile_';

function localKey(uid: string): string {
  return `${LOCAL_PROFILE_PREFIX}${uid}`;
}

/** Fields the client is allowed to write. `uid` and `createdAt` are set once. */
export interface ProfileDraft {
  displayName: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Builds a fresh profile for a newly verified phone number. */
export function createDefaultProfile(
  uid: string,
  phoneNumber: string,
  displayName: string,
  email: string
): UserProfile {
  const timestamp = nowIso();
  return {
    uid,
    phoneNumber,
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: timestamp,
    level: 1,
    levelTitle: 'Money Starter',
    currentXP: 0,
    nextLevelXP: 500,
    streakDays: 1,
    lastActiveDate: timestamp.split('T')[0],
  };
}

/** Coerces a Firestore document into a profile, tolerating older shapes. */
function fromDocument(uid: string, data: Record<string, unknown> | undefined): UserProfile | null {
  if (!data) return null;
  const displayName = toNonEmptyString(data.displayName) ?? toNonEmptyString(data.name);
  if (!displayName) return null;

  return {
    uid,
    phoneNumber: toNonEmptyString(data.phoneNumber) ?? '',
    displayName,
    email: toNonEmptyString(data.email) ?? '',
    createdAt: toNonEmptyString(data.createdAt) ?? nowIso(),
    updatedAt: toNonEmptyString(data.updatedAt) ?? nowIso(),
    lastLoginAt: toNonEmptyString(data.lastLoginAt) ?? nowIso(),
    level: Number(data.level) || 1,
    levelTitle: toNonEmptyString(data.levelTitle) ?? 'Money Starter',
    currentXP: Number(data.currentXP) || 0,
    nextLevelXP: Number(data.nextLevelXP) || 500,
    streakDays: Number(data.streakDays) || 1,
    lastActiveDate: toNonEmptyString(data.lastActiveDate) ?? nowIso().split('T')[0],
  };
}

export const UserProfileService = {
  /**
   * Reads the profile for a UID. Falls back to the local mirror when Firestore
   * is unreachable, so a returning user with no signal still gets their name.
   * Returns null when this UID has genuinely never completed the name step.
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snapshot = await getDoc(doc(getFirestore(), 'users', uid));
      if (snapshot.exists()) {
        const profile = fromDocument(uid, snapshot.data() as Record<string, unknown>);
        if (profile) {
          await this.cacheLocally(profile);
          return profile;
        }
      }
      // The document genuinely does not exist: this is a new user.
      return null;
    } catch {
      return this.readLocal(uid);
    }
  },

  /** Creates the profile document for a first-time user. */
  async createProfile(
    uid: string,
    phoneNumber: string,
    displayName: string,
    email: string
  ): Promise<UserProfile> {
    const profile = createDefaultProfile(uid, phoneNumber, displayName, email);
    await this.cacheLocally(profile);
    try {
      await setDoc(doc(getFirestore(), 'users', uid), profile, { merge: true });
    } catch {
      // Kept locally; the next successful write reconciles it. The user is not
      // blocked from entering the app because the network is unavailable.
    }
    return profile;
  },

  /** Updates mutable profile fields. Never touches uid or createdAt. */
  async updateProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
    const { uid: _ignoredUid, createdAt: _ignoredCreatedAt, ...safePatch } = patch;
    const payload = { ...safePatch, updatedAt: nowIso() };

    const existing = await this.readLocal(uid);
    if (existing) {
      await this.cacheLocally({ ...existing, ...payload } as UserProfile);
    }

    try {
      await setDoc(doc(getFirestore(), 'users', uid), payload, { merge: true });
    } catch {
      // Local mirror already updated; retried on the next successful write.
    }
  },

  /** Stamps the login time. Best-effort: a failure must not block sign-in. */
  async touchLastLogin(uid: string): Promise<void> {
    try {
      await setDoc(
        doc(getFirestore(), 'users', uid),
        { lastLoginAt: nowIso(), updatedAt: nowIso() },
        { merge: true }
      );
    } catch {
      // Non-critical.
    }
  },

  async cacheLocally(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(localKey(profile.uid), JSON.stringify(profile));
    } catch {
      // A cache write failure is not worth surfacing.
    }
  },

  async readLocal(uid: string): Promise<UserProfile | null> {
    try {
      const raw = await AsyncStorage.getItem(localKey(uid));
      if (!raw) return null;
      return fromDocument(uid, JSON.parse(raw) as Record<string, unknown>);
    } catch {
      return null;
    }
  },
};
