import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { THEME } from '../../constants/theme';
import { logoCandidates } from '../../constants/companyDomains';

interface CompanyLogoProps {
  symbol: string;
  name?: string;
  /** Provider-supplied logo, tried before the domain-derived sources. */
  logoUrl?: string;
  size?: number;
  /** Corner radius; defaults to a squircle proportional to `size`. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Stable brand-ish colour per symbol, so a lettermark never looks random. */
const LETTERMARK_COLORS = [
  '#0284C7',
  '#1E3A8A',
  '#DC2626',
  '#D97706',
  '#0D9488',
  '#7C3AED',
  '#E11D48',
  '#0369A1',
  '#059669',
  '#B45309',
];

function colorFor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return LETTERMARK_COLORS[hash % LETTERMARK_COLORS.length];
}

/** Initials used when no logo is available. */
function lettermark(symbol: string, name?: string): string {
  const clean = (symbol ?? '').replace(/[^A-Za-z0-9&]/g, '').toUpperCase();
  if (clean.length >= 3) return clean.slice(0, 3);
  if (clean.length > 0) return clean;
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name ?? '?').slice(0, 2).toUpperCase();
}

/**
 * Company mark for an instrument.
 *
 * Tries each logo provider in turn and falls back to a coloured lettermark, so
 * every row renders something recognisable — a missing or slow logo never
 * leaves a blank square or shifts the layout.
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  name,
  logoUrl,
  size = 40,
  radius,
  style,
}) => {
  const candidates = useMemo(() => {
    const derived = logoCandidates(symbol, size);
    return logoUrl ? [logoUrl, ...derived] : derived;
  }, [symbol, size, logoUrl]);
  const [attempt, setAttempt] = useState(0);

  // Reset when the row is recycled onto a different instrument.
  const [trackedSymbol, setTrackedSymbol] = useState(symbol);
  if (trackedSymbol !== symbol) {
    setTrackedSymbol(symbol);
    setAttempt(0);
  }

  const handleError = useCallback(() => setAttempt((n) => n + 1), []);

  const boxRadius = radius ?? Math.round(size * 0.28);
  const box: ViewStyle = {
    width: size,
    height: size,
    borderRadius: boxRadius,
  };

  const uri = attempt < candidates.length ? candidates[attempt] : null;

  if (!uri) {
    const text = lettermark(symbol, name);
    return (
      <View
        style={[styles.fallback, box, { backgroundColor: colorFor(symbol || name || '?') }, style]}
        accessibilityRole="image"
        accessibilityLabel={name ? `${name} logo` : `${symbol} logo`}
      >
        <Text
          style={[styles.fallbackText, { fontSize: Math.max(9, size * 0.3) }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.imageBox, box, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name} logo` : `${symbol} logo`}
    >
      <Image
        // Keyed by attempt so a retry actually remounts the request.
        key={uri}
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: boxRadius }}
        resizeMode="contain"
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  fallbackText: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  imageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderSubtle,
  },
});
