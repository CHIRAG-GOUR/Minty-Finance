import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { TabType } from '../../types';
import { useApp } from '../../context/AppContext';

interface TabItem {
  id: TabType;
  label: string;
  iconName: string;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', iconName: 'home' },
  { id: 'learn', label: 'Learn', iconName: 'learn' },
  { id: 'invest', label: 'Invest', iconName: 'invest' },
  { id: 'budget', label: 'Budget', iconName: 'budget' },
  { id: 'portfolio', label: 'Portfolio', iconName: 'portfolio' },
  { id: 'rewards', label: 'Rewards', iconName: 'rewards' },
  { id: 'profile', label: 'Profile', iconName: 'profile' },
];

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  isActive && styles.iconWrapperActive,
                ]}
              >
                <Icon
                  name={tab.iconName}
                  size={20}
                  color={isActive ? THEME.colors.primary : THEME.colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.colors.card,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 56 : 60,
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabButtonActive: {},
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: THEME.colors.primarySurface,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  labelActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  labelInactive: {
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
});
