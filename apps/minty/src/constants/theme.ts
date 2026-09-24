export const THEME = {
  colors: {
    // Primary - Electric Mint Green
    primary: '#00D084',
    primaryLight: '#38EF7D',
    primaryDark: '#00A86B',
    primarySurface: '#E8FAF2',
    primaryMuted: '#C2F5E0',

    // Hero Accent - Sunburst Gold / Yellow
    accentYellow: '#FFC72C',
    accentYellowDark: '#E6A800',
    accentYellowSurface: '#FFF8E1',
    accentYellowMuted: '#FFE899',

    // Amber / Warm Gold
    amber: '#F59E0B',
    amberLight: '#FBBF24',
    amberDark: '#D97706',
    amberSurface: '#FEF3C7',
    amberMuted: '#FDE68A',

    // Deep Obsidian / Dark Charcoal (For floating dock & high-contrast elements)
    obsidian: '#0B132B',
    obsidianLight: '#1C2541',
    obsidianSurface: '#F1F5F9',

    // Secondary - Sky & Aqua Cyan
    secondary: '#00B4D8',
    secondaryLight: '#48CAE4',
    secondaryDark: '#0077B6',
    secondarySurface: '#EBF8FC',
    secondaryMuted: '#ADE8F4',

    // Alert Accents
    coral: '#FF4757',
    coralLight: '#FF6B81',
    coralSurface: '#FFEBEF',
    coralMuted: '#FFCCD5',

    purple: '#7C3AED',
    purpleLight: '#A78BFA',
    purpleSurface: '#F3E8FF',

    // Warm Clean Backgrounds (Neo-Fintech Canvas)
    background: '#F7F9F6',
    backgroundSecondary: '#EEF2EC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBorder: '#E5EADF',
    cardBorderSubtle: '#F0F4EC',
    divider: '#E5EADF',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    textOnPrimary: '#0B132B',

    // Status
    success: '#00D084',
    successSurface: '#E8FAF2',
    warning: '#FFC72C',
    warningSurface: '#FFF8E1',
    danger: '#FF4757',
    dangerSurface: '#FFEBEF',
    info: '#00B4D8',
    infoSurface: '#EBF8FC',
  },

  typography: {
    heroDisplay: {
      fontSize: 34,
      fontWeight: '900' as const,
      lineHeight: 40,
      letterSpacing: -1,
    },
    h1: {
      fontSize: 26,
      fontWeight: '800' as const,
      lineHeight: 32,
      letterSpacing: -0.6,
    },
    h2: {
      fontSize: 20,
      fontWeight: '800' as const,
      lineHeight: 26,
      letterSpacing: -0.4,
    },
    h3: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 14,
      fontWeight: '700' as const,
      lineHeight: 20,
    },
    bodyLarge: {
      fontSize: 15,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 18,
    },
    bodySmall: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 15,
    },
    caption: {
      fontSize: 10,
      fontWeight: '800' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    moneyHero: {
      fontSize: 32,
      fontWeight: '900' as const,
      lineHeight: 38,
      letterSpacing: -1,
    },
    moneyDisplay: {
      fontSize: 28,
      fontWeight: '900' as const,
      lineHeight: 34,
      letterSpacing: -0.5,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  radii: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
    pill: 9999,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    subtle: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    card: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    floatingBar: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
    },
    heroGlow: {
      shadowColor: '#00D084',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 5,
    },
    primaryGlow: {
      shadowColor: '#00D084',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 5,
    },
    yellowGlow: {
      shadowColor: '#FFC72C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};
