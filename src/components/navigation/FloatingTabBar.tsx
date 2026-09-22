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
  const { activeTab, setActiveTab, userProfile, openModal } = useApp();
  const centerBtnScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // A fixed 16px offset put the dock inside the gesture-navigation strip on
  // phones with a nav bar, so the system swallowed taps meant for the tabs.
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

  const getTabsForRole = (): { leftTabs: TabItem[]; rightTabs: TabItem[] } => {
    if (userProfile.role === 'teacher') {
      return {
        leftTabs: [
          { id: 'classroom', label: 'Cohorts', iconName: 'learn' },
          { id: 'markets', label: 'Markets', iconName: 'invest' },
        ],
        rightTabs: [
          { id: 'shark_tank', label: 'Startups', iconName: 'rocket' },
          { id: 'profile', label: 'Mentor', iconName: 'user' },
        ],
      };
    }

    if (userProfile.role === 'super_admin') {
      return {
        leftTabs: [
          { id: 'admin_control', label: 'Desk', iconName: 'settings' },
          { id: 'markets', label: 'Assets', iconName: 'invest' },
        ],
        rightTabs: [
          { id: 'classroom', label: 'Schools', iconName: 'learn' },
          { id: 'profile', label: 'Admin', iconName: 'user' },
        ],
      };
    }

    // Student tabs
    return {
      leftTabs: [
        { id: 'home', label: 'Home', iconName: 'home' },
        { id: 'markets', label: 'Trade', iconName: 'invest' },
      ],
      rightTabs: [
        { id: 'wealth_lab', label: 'Wealth', iconName: 'budget' },
        { id: 'shark_tank', label: 'Startups', iconName: 'rocket' },
      ],
    };
  };

  const { leftTabs, rightTabs } = getTabsForRole();

  return (
    <View
      style={[styles.floatingWrapper, { bottom: dockBottom }]}
      pointerEvents="box-none"
    >
      {/* Floating Obsidian Curved Dock (Inspired by Reference UI) */}
      <View style={styles.dockContainer}>
        {/* Left Tabs */}
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

        {/* Center Sunburst Yellow Audio Waveform Button (Zero Lightning SVG, Exact Reference Image 1 Soundwave) */}
        <Animated.View style={{ transform: [{ scale: centerBtnScale }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => openModal('quick_action_terminal')}
            style={styles.heroCenterBtn}
          >
            <View style={styles.heroCenterInner}>
              <Icon name="waveform" size={28} color={THEME.colors.obsidian} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Right Tabs */}
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
    left: 20,
    right: 20,
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
    paddingHorizontal: 16,
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
    fontSize: 10,
    marginTop: 3,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: THEME.colors.accentYellow,
  },
  tabLabelInactive: {
    color: THEME.colors.textMuted,
  },
  heroCenterBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    borderWidth: 4,
    borderColor: THEME.colors.obsidian,
    ...THEME.shadows.yellowGlow,
  },
  heroCenterInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
