import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { THEME } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  isLoaded: boolean;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoaded, onFinish }) => {
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(10)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  // Track minimum display time for smooth visual experience
  const minTimeElapsed = useRef(false);
  const isLoadedRef = useRef(isLoaded);
  isLoadedRef.current = isLoaded;

  useEffect(() => {
    // 1. Lively spring entrance animation
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle pulse loop on the leaf icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Minimum display time of 1.4s so intro is cleanly appreciated
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      if (isLoadedRef.current) {
        triggerExit();
      }
    }, 1400);

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
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Ambient background glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.centerSection}>
        {/* Animated Brand Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }, { scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.brandIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Title & Tagline */}
        <Animated.View
          style={[
            styles.brandContent,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titleMinty}>Minty</Text>
            <Text style={styles.titleFinance}>Finance</Text>
          </View>

          <Text style={styles.tagline}>
            Master Virtual Investing & Financial Literacy
          </Text>
        </Animated.View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
        <View style={styles.footerPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.footerText}>Skillizee Financial Platform</Text>
        </View>
        <Text style={styles.subFooterText}>Simulated Real-Time Markets</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    zIndex: 99999,
  },
  ambientGlow: {
    position: 'absolute',
    top: '20%',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: 'rgba(0, 208, 156, 0.09)',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D09C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  brandIcon: {
    width: 140,
    height: 140,
  },
  brandContent: {
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleMinty: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  titleFinance: {
    fontSize: 34,
    fontWeight: '900',
    color: '#00D09C',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    gap: 6,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00D09C',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.2,
  },
  subFooterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
