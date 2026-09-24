import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { useApp } from '../../context/AppContext';

/** Greets whoever is signed in. There is one account type, so no role badge. */
export const NeoHeader: React.FC = () => {
  const { userProfile, setActiveTab } = useApp();

  const firstName = (userProfile.displayName || 'Investor').trim().split(/\s+/)[0];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftProfile}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hi, {firstName}
          </Text>
          <Text style={styles.subGreeting} numberOfLines={1}>
            Practising with virtual money
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('profile')}
          style={styles.profileBtn}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
        >
          <Icon name="user" size={16} color={THEME.colors.obsidian} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorderSubtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftProfile: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentYellow,
  },
});
