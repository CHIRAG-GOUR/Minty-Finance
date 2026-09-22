import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { FirebaseService } from '../services/firebaseService';

interface RoleSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { userProfile, switchUserRole, showToast } = useApp();

  // Hooks first: an early return above them changes the hook count between the
  // hidden and visible renders, which React treats as fatal.
  const [activeMode, setActiveMode] = useState<'quick_switch' | 'login'>('quick_switch');
  const [emailInput, setEmailInput] = useState('pa1@skillizee.io');
  const [passInput, setPassInput] = useState('787700');

  if (!visible) return null;

  const handleSelectRole = async (role: UserRole) => {
    await switchUserRole(role);
    onClose();
  };

  const handleLoginSubmit = async () => {
    const res = await FirebaseService.signInWithEmailPassword(emailInput, passInput);
    if (res.success && res.user) {
      await switchUserRole(res.user.role);
      showToast('Firebase Auth Verified', `Welcome back ${res.user.name}! Role: ${res.user.role.toUpperCase()}`, 'success');
      onClose();
    } else {
      showToast('Authentication Failed', res.error || 'Invalid credentials', 'warning');
    }
  };

  const personas = [
    {
      id: 'super_admin' as UserRole,
      title: 'Chirag (Super Admin)',
      email: 'pa1@skillizee.io',
      pass: '787700',
      tag: 'SUPER ADMIN',
      desc: 'Central monetary policy, system inflation rates & asset listing desk.',
      color: '#DC2626',
      bg: '#FEE2E2',
    },
    {
      id: 'teacher' as UserRole,
      title: 'Faculty Mentor',
      email: 'teacher@skillizee.io',
      pass: 'teacher123',
      tag: 'TEACHER',
      desc: 'Cohort audits, student risk scores, challenge dispatcher & startup approvals.',
      color: '#7C3AED',
      bg: '#EDE9FE',
    },
    {
      id: 'student' as UserRole,
      title: 'Student Investor',
      email: 'student@skillizee.io',
      pass: 'student123',
      tag: 'STUDENT',
      desc: 'Virtual trading floor, 50/30/20 budget simulator & Shark Tank investor.',
      color: THEME.colors.primaryDark,
      bg: THEME.colors.primarySurface,
    },
  ];

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Access Control & Firebase Auth"
      subtitle="Role-Based Access Control (RBAC)"
      iconName="shield"
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Toggle Mode */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode('quick_switch')}
            style={[styles.tabBtn, activeMode === 'quick_switch' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeMode === 'quick_switch' && styles.tabBtnTextActive]}>
              1-Tap Fast Persona
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode('login')}
            style={[styles.tabBtn, activeMode === 'login' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeMode === 'login' && styles.tabBtnTextActive]}>
              Email / Password Auth
            </Text>
          </TouchableOpacity>
        </View>

        {activeMode === 'quick_switch' ? (
          <View style={styles.list}>
            {personas.map((p) => {
              const isActive = userProfile.role === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectRole(p.id)}
                  style={[
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                  ]}
                >
                  <View style={[styles.roleHeaderRow]}>
                    <View style={[styles.roleBadge, { backgroundColor: p.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: p.color }]}>{p.tag}</Text>
                    </View>
                    {isActive ? (
                      <View style={styles.activePill}>
                        <Icon name="check" size={12} color={THEME.colors.primaryDark} />
                        <Text style={styles.activePillText}>ACTIVE</Text>
                      </View>
                    ) : (
                      <Text style={styles.tapToSwitch}>Tap to Switch →</Text>
                    )}
                  </View>

                  <Text style={styles.personaName}>{p.title}</Text>
                  <Text style={styles.personaEmail}>
                    {p.email} · Pass: <Text style={{ fontWeight: '800' }}>{p.pass}</Text>
                  </Text>
                  <Text style={styles.personaDesc}>{p.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.superAdminCallout}>
              <Icon name="shield" size={18} color={THEME.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>Super Admin Master Access</Text>
                <Text style={styles.calloutSub}>
                  Default credentials configured for <Text style={{ fontWeight: '800' }}>pa1@skillizee.io</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Account Email</Text>
            <TextInput
              style={styles.textInput}
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="pa1@skillizee.io"
              placeholderTextColor={THEME.colors.textMuted}
            />

            <Text style={styles.inputLabel}>Password / PIN</Text>
            <TextInput
              style={styles.textInput}
              value={passInput}
              onChangeText={setPassInput}
              secureTextEntry
              placeholder="787700"
              placeholderTextColor={THEME.colors.textMuted}
            />

            <PrimaryButton
              title="Authenticate & Load RBAC Persona"
              iconName="lock"
              onPress={handleLoginSubmit}
              style={{ marginTop: 14 }}
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    gap: 12,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 3,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.card,
    ...THEME.shadows.subtle,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  roleCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    gap: 6,
    ...THEME.shadows.subtle,
  },
  roleCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radii.xs,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.xs,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  tapToSwitch: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  personaName: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  personaEmail: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  personaDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 15,
  },
  formContainer: {
    gap: 8,
  },
  superAdminCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySurface,
    borderRadius: THEME.radii.lg,
    padding: 12,
    gap: 10,
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  calloutSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
});
