import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const NeoHeader: React.FC = () => {
  const { userProfile, openModal } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isSuperAdmin = userProfile.role === 'super_admin';

  const handleRolePress = () => {
    if (!isSuperAdmin) return;
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    openModal('role_selector');
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          bg: '#FEE2E2',
          border: '#F87171',
          color: '#DC2626',
          label: 'SUPER ADMIN',
          dot: '#EF4444',
        };
      case 'teacher':
        return {
          bg: '#EDE9FE',
          border: '#A78BFA',
          color: '#7C3AED',
          label: 'MENTOR',
          dot: '#8B5CF6',
        };
      case 'student':
      default:
        return {
          bg: THEME.colors.backgroundSecondary,
          border: THEME.colors.cardBorder,
          color: THEME.colors.textSecondary,
          label: 'STUDENT',
          dot: THEME.colors.obsidian,
        };
    }
  };

  const badge = getRoleBadgeStyle(userProfile.role);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Left: User Profile & Role Info */}
        <View style={styles.leftProfile}>
          <Text style={styles.userName} numberOfLines={1}>
            {userProfile.name}
          </Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              activeOpacity={isSuperAdmin ? 0.8 : 1}
              onPress={handleRolePress}
              disabled={!isSuperAdmin}
              style={[
                styles.rolePill,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
              <Text style={[styles.roleLabel, { color: badge.color }]}>{badge.label}</Text>
              {isSuperAdmin && <Icon name="chevron-right" size={10} color={badge.color} />}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Right: Persona Switch Button — ONLY VISIBLE TO SUPER ADMINS */}
        {isSuperAdmin && (
          <View style={styles.rightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRolePress}
              style={styles.switchAccountBtn}
            >
              <Icon name="user" size={15} color={THEME.colors.obsidian} />
              <Text style={styles.switchAccountText}>Switch</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  leftProfile: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radii.pill,
    gap: 5,
    ...THEME.shadows.subtle,
  },
  switchAccountText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.obsidian,
  },
});
