import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { useApp } from '../context/AppContext';

interface OnboardingSlide {
  title: string;
  headline: string;
  description: string;
  iconName: string;
  accentColor: string;
  features: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    title: 'Minti Finance',
    headline: 'Learn Money. Practice Investing.',
    description: 'Master investment decisions with live market prices and ₹1,00,000 virtual practice money.',
    iconName: 'shield',
    accentColor: THEME.colors.primary,
    features: [
      'Real Indian Market Data (NSE/BSE) Feeds',
      '₹1,00,000 Virtual Practice Capital — Zero Real Risk',
      'Learn Before You Invest: Metric Research & Checklists',
    ],
  },
  {
    title: 'Learn',
    headline: 'Research Before You Buy',
    description: 'Understand what P/E, Debt-to-Equity, and ROE mean before placing simulated market orders.',
    iconName: 'learn',
    accentColor: THEME.colors.secondary,
    features: [
      'Interactive financial metric explainers',
      'Pre-investment checklists for each company',
      'Bite-sized modules designed for students',
    ],
  },
  {
    title: 'Invest',
    headline: 'Real-Time Investment Practice',
    description: 'Track real Indian bluechips (Reliance, TCS, HDFC Bank, Infosys) with multi-timeframe charts.',
    iconName: 'invest',
    accentColor: THEME.colors.primary,
    features: [
      'Simulated whole-share market orders',
      'Real-time statutory simulated charges breakdown',
      'Mutual Funds SIP & Bank Fixed Deposit simulators',
    ],
  },
  {
    title: 'Grow',
    headline: 'Harness Compound Growth',
    description: 'Visualize how small monthly savings snowball into substantial future wealth over time.',
    iconName: 'growth',
    accentColor: THEME.colors.amber,
    features: [
      'Interactive visual compound growth calculator',
      'Discover the power of the Rule of 72',
      'Build long-term positive financial habits',
    ],
  },
  {
    title: 'Play & Compete',
    headline: 'Gamified Levels, Badges & Streaks',
    description: 'Climb from Money Starter to Wealth Planner. Compete on the monthly educational leaderboard.',
    iconName: 'leaderboard',
    accentColor: THEME.colors.purple,
    features: [
      '6 Progressive investor levels with XP milestones',
      '12 Unique achievement badges to unlock',
      'Shark Tank startup pitching simulation',
    ],
  },
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setShowNameInput(true);
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding(studentName || 'Teen Explorer');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header Branding */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Icon name="invest" size={20} color={THEME.colors.textInverse} />
            </View>
            <Text style={styles.brandTitle}>Minti Finance</Text>
          </View>
          {!showNameInput && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowNameInput(true)}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {!showNameInput ? (
          <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
            {/* Visual Icon Emblem */}
            <View style={[styles.slideEmblem, { backgroundColor: `${slide.accentColor}15`, borderColor: slide.accentColor }]}>
              <Icon name={slide.iconName} size={48} color={slide.accentColor} />
            </View>

            {/* Slide Title & Text */}
            <View style={styles.slideHeader}>
              <Text style={[styles.sectionTag, { color: slide.accentColor }]}>
                {slide.title.toUpperCase()}
              </Text>
              <Text style={styles.headline}>{slide.headline}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>

            {/* Features List */}
            <View style={styles.featureList}>
              {slide.features.map((feat, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View style={[styles.checkCircle, { backgroundColor: `${slide.accentColor}20` }]}>
                    <Icon name="check" size={12} color={slide.accentColor} />
                  </View>
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.nameSetupContent} showsVerticalScrollIndicator={false}>
            <View style={styles.setupEmblem}>
              <Icon name="rocket" size={44} color={THEME.colors.primary} />
            </View>

            <Text style={styles.setupTitle}>Welcome to Your Journey</Text>
            <Text style={styles.setupSubtitle}>
              What should we call you in Minti Finance and on the monthly leaderboard?
            </Text>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Your Name / Nickname</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex Sharma"
                placeholderTextColor={THEME.colors.textMuted}
                value={studentName}
                onChangeText={setStudentName}
                autoFocus={true}
                maxLength={24}
              />
            </View>

            {/* Starting Balance Gift Card */}
            <View style={styles.giftCard}>
              <View style={styles.giftTop}>
                <View style={styles.giftIcon}>
                  <Icon name="wallet" size={22} color={THEME.colors.primary} />
                </View>
                <View>
                  <Text style={styles.giftTitle}>Starting Simulation Balance</Text>
                  <Text style={styles.giftAmount}>₹1,00,000 Virtual Cash</Text>
                </View>
              </View>
              <Text style={styles.giftNote}>
                This is simulated educational money to practice investing, budgeting, and building wealth without real risk.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {!showNameInput ? (
            <>
              {/* Dots indicator */}
              <View style={styles.dotsRow}>
                {SLIDES.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      currentSlide === idx ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>

              <PrimaryButton
                title={isLastSlide ? 'Get Started' : 'Next Step'}
                iconName={isLastSlide ? 'rocket' : 'chevron-right'}
                onPress={handleNext}
                size="lg"
              />
            </>
          ) : (
            <PrimaryButton
              title="Start Your Minti Journey"
              iconName="rocket"
              onPress={handleFinish}
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.backgroundSecondary,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  slideContent: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  slideEmblem: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.lg,
  },
  slideHeader: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  headline: {
    ...THEME.typography.h1,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    ...THEME.typography.bodyLarge,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  featureList: {
    width: '100%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
    ...THEME.shadows.subtle,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  nameSetupContent: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  setupEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.md,
  },
  setupTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  setupSubtitle: {
    ...THEME.typography.bodyMedium,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.md,
  },
  inputCard: {
    width: '100%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.subtle,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  giftCard: {
    width: '100%',
    backgroundColor: THEME.colors.primarySurface,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
  },
  giftTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  giftIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  giftAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  giftNote: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: THEME.spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: THEME.spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: THEME.colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: THEME.colors.cardBorder,
  },
});
