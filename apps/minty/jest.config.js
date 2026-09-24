module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // lucide ships an ESM-only .mjs bundle that Jest will not parse; icons are decorative here.
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules[/\\\\](?!(?:(?:jest-)?react-native|@react-native(?:-community)?|expo(?:nent)?|@expo(?:nent)?|react-native-svg|react-native-safe-area-context|@testing-library)[/\\\\]?)',
  ],
  testMatch: ['<rootDir>/__tests__/**/*.test.@(ts|tsx|js)'],
};
