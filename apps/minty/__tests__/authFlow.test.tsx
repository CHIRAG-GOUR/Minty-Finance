import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AuthService } from '../src/services/authService';
import { UserProfileService } from '../src/services/userProfileService';
import { UserProfile } from '../src/types';

/**
 * Proves the returning-user rule: a phone number that already has a profile
 * goes straight into the app, and only a brand-new UID is asked for a name and
 * email. Sign-in is OTP-only either way — there is no password path to test.
 */

const existingProfile: UserProfile = {
  uid: 'uid-existing',
  phoneNumber: '+917877679101',
  displayName: 'Returning User',
  email: 'returning@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  level: 3,
  levelTitle: 'Budget Builder',
  currentXP: 1400,
  nextLevelXP: 2200,
  streakDays: 5,
  lastActiveDate: '2026-01-01',
};

const Probe: React.FC = () => {
  const { status, profile } = useAuth();
  return <Text testID="state">{`${status}|${profile?.displayName ?? '-'}`}</Text>;
};

/** Drives the Firebase auth-state listener by hand. */
function mockSignedInUser(uid: string, phoneNumber: string) {
  jest.spyOn(AuthService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(AuthService, 'onAuthStateChanged').mockImplementation((listener) => {
    listener({ uid, phoneNumber } as never);
    return () => {};
  });
}

afterEach(() => jest.restoreAllMocks());

describe('sign-in vs sign-up routing', () => {
  it('sends a returning user straight into the app, never re-asking for a name', async () => {
    mockSignedInUser('uid-existing', '+917877679101');
    jest.spyOn(UserProfileService, 'getProfile').mockResolvedValue(existingProfile);
    jest.spyOn(UserProfileService, 'touchLastLogin').mockResolvedValue();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('authenticated|Returning User')
    );
  });

  it('asks a brand-new UID for a name and email', async () => {
    mockSignedInUser('uid-new', '+919999999999');
    jest.spyOn(UserProfileService, 'getProfile').mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('state').props.children).toBe('needs-profile|-'));
  });

  it('shows the sign-in screen when Firebase reports no session', async () => {
    jest.spyOn(AuthService, 'isConfigured').mockReturnValue(true);
    jest.spyOn(AuthService, 'onAuthStateChanged').mockImplementation((listener) => {
      listener(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('state').props.children).toBe('signed-out|-'));
  });

  it('keeps the session when Firestore is unreachable but a local mirror exists', async () => {
    mockSignedInUser('uid-existing', '+917877679101');
    // getProfile already falls back to the local mirror internally; this asserts
    // the context trusts that result rather than forcing the name step again.
    jest.spyOn(UserProfileService, 'getProfile').mockResolvedValue(existingProfile);
    jest.spyOn(UserProfileService, 'touchLastLogin').mockRejectedValue(new Error('offline'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('state').props.children).toBe('authenticated|Returning User')
    );
  });
});
