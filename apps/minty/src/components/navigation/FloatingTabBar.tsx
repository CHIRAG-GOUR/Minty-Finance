import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { TabType } from '../../types';
import { useApp } from '../../context/AppContext';

interface TabItem {
  id: TabType;
  label: string;
  iconName: string;
}

export const FloatingTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const centerBtnScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const dockBottom = insets.bottom > 0 ? insets.bottom + 8 : Platform.OS === 'ios' ? 24 : 16;

  const handlePressIn = () => {
    Animated.spring(centerBtnScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(centerBtnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  // 1st: Portfolio, 2nd: Stocks | CENTER: Home | 4th: Mutual Funds, 5th: Startup
  const leftTabs: TabItem[] = [
    { id: 'portfolio', label: 'Portfolio', iconName: 'pie-chart' },
    { id: 'invest', label: 'Stocks', iconName: 'stocks' },
  ];

  const rightTabs: TabItem[] = [
    { id: 'markets', label: 'Mutual Funds', iconName: 'funds' },
    { id: 'shark_tank', label: 'Startup', iconName: 'rocket' },
  ];

  const isHomeActive = activeTab === 'home';

  return (
    <View
      style={[styles.floatingWrapper, { bottom: dockBottom }]}
      pointerEvents="box-none"
    >
      {/* Floating Obsidian Curved Dock */}
      <View style={styles.dockContainer}>
        {/* Left Tabs: Portfolio & Stocks */}
        {leftTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tabBtn}
            >
              <Icon
                name={tab.iconName}
                size={21}
                color={isActive ? THEME.colors.accentYellow : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Center Hero Home Button — Takes user directly back to Start / Home Dashboard */}
        <Animated.View style={{ transform: [{ scale: centerBtnScale }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => setActiveTab('home')}
            style={[
              styles.heroCenterBtn,
              isHomeActive && styles.heroCenterBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <View style={styles.heroCenterInner}>
              <Icon
                name="home"
                size={26}
                color={isHomeActive ? THEME.colors.obsidian : '#1E293B'}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Right Tabs: Mutual Funds & Startup */}
        {rightTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tabBtn}
            >
              <Icon
                name={tab.iconName}
                size={21}
                color={isActive ? THEME.colors.accentYellow : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  dockContainer: {
    width: '100%',
    height: 66,
    backgroundColor: THEME.colors.obsidian,
    borderRadius: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    ...THEME.shadows.floatingBar,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 9.5,
    marginTop: 3,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: THEME.colors.accentYellow,
  },
  tabLabelInactive: {
    color: THEME.colors.textMuted,
  },
  heroCenterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: THEME.colors.obsidian,
    ...THEME.shadows.yellowGlow,
  },
  heroCenterBtnActive: {
    backgroundColor: THEME.colors.accentYellow,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  heroCenterInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
