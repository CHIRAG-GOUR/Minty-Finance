import { getFirestore, doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { toNonEmptyString } from '../utils/safeNumber';

/**
 * The user profile at `users/{uid}`.
 *
 * This Firebase project is shared with other Skillizee apps, so the document is
 * split deliberately:
 *
 *   users/{uid}                -> identity shared by every app (phone, name,
 *                                 email, timestamps). One phone number is one
 *                                 person across the whole project.
 *   users/{uid}.apps.minty     -> everything that belongs to Minty alone.
 *
 * Nothing Minty-specific is written at the top level, so another app adding its
 * own progress fields can never collide with, or overwrite, Minty's.
 *
 * Firestore is the source of truth; a local mirror keyed by UID lets the app
 * open instantly and stay usable offline. Nothing here is keyed by phone number
 * or display name — changing either must never produce a different account.
 */

/** Namespace for this app's data inside the shared user document. */
export const APP_NAMESPACE = 'minty';

const LOCAL_PROFILE_PREFIX = '@minty_profile_';

function localKey(uid: string): string {
  return `${LOCAL_PROFILE_PREFIX}${uid}`;
}


/**
 * Firestore keeps unacknowledged writes queued indefinitely when the backend is
 * unreachable (offline, or the database never created), so `await setDoc(...)`
 * can hang forever rather than rejecting. Every server call here is therefore
 * time-boxed, and the local mirror is what the UI actually depends on.
 */
const SERVER_TIMEOUT_MS = 6000;

function withTimeout<T>(work: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), SERVER_TIMEOUT_MS)
    ),
  ]);
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

  // Minty's own fields live under apps.minty; fall back to the top level so
  // profiles written before the namespace existed still load.
  const apps = (data.apps ?? {}) as Record<string, unknown>;
  const mine = (apps[APP_NAMESPACE] ?? {}) as Record<string, unknown>;
  const pick = (key: string): unknown => (key in mine ? mine[key] : data[key]);

  return {
    uid,
    phoneNumber: toNonEmptyString(data.phoneNumber) ?? '',
    displayName,
    email: toNonEmptyString(data.email) ?? '',
    createdAt: toNonEmptyString(data.createdAt) ?? nowIso(),
    updatedAt: toNonEmptyString(data.updatedAt) ?? nowIso(),
    lastLoginAt: toNonEmptyString(data.lastLoginAt) ?? nowIso(),
    level: Number(pick('level')) || 1,
    levelTitle: toNonEmptyString(pick('levelTitle')) ?? 'Money Starter',
    currentXP: Number(pick('currentXP')) || 0,
    nextLevelXP: Number(pick('nextLevelXP')) || 500,
    streakDays: Number(pick('streakDays')) || 1,
    lastActiveDate: toNonEmptyString(pick('lastActiveDate')) ?? nowIso().split('T')[0],
  };
}


/** Splits a profile into the shared identity fields and Minty's own. */
function toDocument(profile: Partial<UserProfile>): Record<string, unknown> {
  const { level, levelTitle, currentXP, nextLevelXP, streakDays, lastActiveDate, ...identity } =
    profile;

  const mine: Record<string, unknown> = {};
  if (level !== undefined) mine.level = level;
  if (levelTitle !== undefined) mine.levelTitle = levelTitle;
  if (currentXP !== undefined) mine.currentXP = currentXP;
  if (nextLevelXP !== undefined) mine.nextLevelXP = nextLevelXP;
  if (streakDays !== undefined) mine.streakDays = streakDays;
  if (lastActiveDate !== undefined) mine.lastActiveDate = lastActiveDate;

  const out: Record<string, unknown> = { ...identity };
  if (Object.keys(mine).length > 0) out.apps = { [APP_NAMESPACE]: mine };
  return out;
}

export const UserProfileService = {
  /**
   * Reads the profile for a UID. Falls back to the local mirror when Firestore
   * is unreachable, so a returning user with no signal still gets their name.
   * Returns null when this UID has genuinely never completed the name step.
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snapshot = await withTimeout(
        getDoc(doc(getFirestore(), 'users', uid)),
        'profile read'
      );
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
    // The local mirror is the one write the caller waits on, so sign-up cannot
    // stall behind an unreachable Firestore.
    await this.cacheLocally(profile);
    // Fire-and-forget: the server copy catches up, and a failure here is not a
    // reason to keep the user staring at a spinner.
    withTimeout(
      setDoc(doc(getFirestore(), 'users', uid), toDocument(profile), { merge: true }),
      'profile create'
    ).catch((err) => {
      console.warn('[Minty] profile not yet synced to Firestore', err?.message ?? err);
    });
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

    withTimeout(
      setDoc(doc(getFirestore(), 'users', uid), toDocument(payload), { merge: true }),
      'profile update'
    ).catch(() => {
      // Local mirror already updated; reconciled by the next successful write.
    });
  },

  /** Stamps the login time. Best-effort: a failure must not block sign-in. */
  async touchLastLogin(uid: string): Promise<void> {
    try {
      await withTimeout(
        setDoc(
          doc(getFirestore(), 'users', uid),
          { lastLoginAt: nowIso(), updatedAt: nowIso() },
          { merge: true }
        ),
        'last-login stamp'
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
