import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  isLoaded: boolean;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoaded, onFinish }) => {
  const iconScale = useRef(new Animated.Value(0.88)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(14)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  // Minimum display time (1.6s) so the intro animation is smooth and clearly visible
  const minTimeElapsed = useRef(false);
  const isLoadedRef = useRef(isLoaded);
  isLoadedRef.current = isLoaded;

  useEffect(() => {
    // 1. Lively entrance spring animation
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 55,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Gentle icon breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Minimum display time of 1.6s
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      if (isLoadedRef.current) {
        triggerExit();
      }
    }, 1600);

    return () => {
      clearTimeout(minTimer);
      pulseLoop.stop();
    };
  }, []);

  // When app finishes loading in background
  useEffect(() => {
    if (isLoaded && minTimeElapsed.current) {
      triggerExit();
    }
  }, [isLoaded]);

  const triggerExit = () => {
    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Ambient background mint glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top spacer for optical balance */}
        <View style={styles.topSpacer} />

        {/* Center Hero: Icon + Title + Tagline */}
        <View style={styles.centerSection}>
          {/* Brand Icon in a polished rounded card */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                opacity: iconOpacity,
                transform: [{ scale: iconScale }, { scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconCard}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.brandIcon}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Brand Typography & Tagline */}
          <Animated.View
            style={[
              styles.brandContent,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {/* Title: Minty Finance */}
            <Text style={styles.brandTitle} numberOfLines={1}>
              <Text style={styles.titleMinty}>Minty </Text>
              <Text style={styles.titleFinance}>Finance</Text>
            </Text>

            {/* Category Pill */}
            <View style={styles.categoryPill}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryText}>FINANCIAL LITERACY & INVESTING</Text>
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              Master Virtual Investing & Financial Literacy
            </Text>
          </Animated.View>
        </View>

        {/* Footer info */}
        <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
          <View style={styles.footerPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.footerText}>Real-Time Market Intelligence</Text>
          </View>
          <Text style={styles.subFooterText}>Educational Simulation Sandbox</Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  ambientGlow: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(0, 208, 156, 0.09)',
  },
  safeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topSpacer: {
    height: 20,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCard: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 208, 156, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#00D09C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  brandIcon: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  brandContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleMinty: {
    color: '#0F172A',
  },
  titleFinance: {
    color: '#00D09C',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 208, 156, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 156, 0.22)',
    marginBottom: 10,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D09C',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A87D',
    letterSpacing: 0.7,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: 20,
    maxWidth: 290,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D09C',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.2,
  },
  subFooterText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
