import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { LessonCard } from '../components/cards/LessonCard';
import { useApp } from '../context/AppContext';

export const LearnScreen: React.FC = () => {
  const { lessons, openModal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Saving', 'Budgeting', 'Investing', 'Risk Management', 'Mindset', 'Planning'];

  const filteredLessons =
    selectedCategory === 'All'
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const totalXPEarned = lessons
    .filter((l) => l.isCompleted)
    .reduce((acc, l) => acc + l.xpReward, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Academy</Text>
        <Text style={styles.subtitle}>
          Interactive Grade 9 financial literacy lessons & quizzes
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>Your Learning Journey</Text>
            <Text style={styles.bannerHighlight}>
              {completedCount} of {lessons.length} Modules Finished
            </Text>
            <Text style={styles.bannerXP}>
              +{totalXPEarned} XP Earned from Academy
            </Text>
          </View>
          <View style={styles.bannerIconBox}>
            <Icon name="learn" size={30} color={THEME.colors.accentYellow} />
          </View>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lessons List */}
        <View style={styles.lessonsList}>
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() => openModal('lesson_detail', lesson)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    ...THEME.typography.bodySmall,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 120,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.card,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.accentYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bannerHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  bannerXP: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.accentYellow,
    marginTop: 2,
  },
  bannerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesRow: {
    gap: 8,
    paddingVertical: THEME.spacing.md,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  categoryPillSelected: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  categoryTextSelected: {
    color: THEME.colors.accentYellow,
    fontWeight: '800',
  },
  lessonsList: {
    gap: 8,
  },
});
