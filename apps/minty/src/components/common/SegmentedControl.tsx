import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  iconName?: string;
  badgeCount?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: ViewStyle;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedId,
  onSelect,
  style,
  scrollable = true,
}: SegmentedControlProps<T>) {
  const content = options.map((option) => {
    const isSelected = option.id === selectedId;
    return (
      <TouchableOpacity
        key={option.id}
        activeOpacity={0.8}
        onPress={() => onSelect(option.id)}
        style={[
          styles.segment,
          scrollable && styles.segmentScrollable,
          isSelected && styles.segmentSelected,
        ]}
      >
        {option.iconName ? (
          <View style={styles.iconWrapper}>
            <Icon
              name={option.iconName}
              size={15}
              color={isSelected ? THEME.colors.primaryDark : THEME.colors.textSecondary}
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.segmentText,
            isSelected ? styles.segmentTextSelected : styles.segmentTextUnselected,
          ]}
          numberOfLines={1}
        >
          {option.label}
        </Text>
        {option.badgeCount !== undefined && option.badgeCount > 0 ? (
          <View style={[styles.badge, isSelected && styles.badgeSelected]}>
            <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
              {option.badgeCount}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, style]}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 4,
    gap: 8,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 4,
    borderRadius: THEME.radii.lg,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  segmentScrollable: {
    flex: undefined,
  },
  segmentSelected: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
    ...THEME.shadows.card,
  },
  iconWrapper: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: THEME.colors.accentYellow,
    fontWeight: '800',
  },
  segmentTextUnselected: {
    color: THEME.colors.textSecondary,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: THEME.colors.cardBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.pill,
  },
  badgeSelected: {
    backgroundColor: THEME.colors.primaryDark,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  badgeTextSelected: {
    color: THEME.colors.accentYellow,
  },
});
