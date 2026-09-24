/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// React Native Firebase ships TypeScript sources in node_modules that Jest will
// not parse, and there is no native layer under test anyway. The suites that
// exercise auth mock AuthService/UserProfileService directly.
jest.mock('@react-native-firebase/app', () => ({
  getApp: () => ({ options: { projectId: 'test-project', appId: '1:test:android:test' } }),
}));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
  onAuthStateChanged: jest.fn(() => () => {}),
  signInWithPhoneNumber: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));
