import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
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

export const CreateChallengeModal: React.FC = () => {
  const { activeModal, closeModal, cohorts, assignTeacherChallenge, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('30');
  const [unit, setUnit] = useState('% Savings');
  const [xpReward, setXpReward] = useState('250');
  const [selectedCohortId, setSelectedCohortId] = useState(cohorts[0]?.id || 'cohort_grade9_alpha');

  if (activeModal !== 'create_challenge') return null;

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      showToast('Missing Fields', 'Please enter a mission title and instructions.', 'warning');
      return;
    }

    const cohort = cohorts.find((c) => c.id === selectedCohortId);

    await assignTeacherChallenge(selectedCohortId, {
      title: title.trim(),
      description: description.trim(),
      category: 'teacher_assigned',
      creatorName: 'Ms. Neha Sharma (Teacher)',
      cohortClass: cohort ? cohort.name : 'Grade 9',
      xpReward: parseInt(xpReward, 10) || 200,
      progress: 0,
      target: parseFloat(target) || 30,
      unit: unit.trim() || '% Savings',
      isCompleted: false,
      isClaimed: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    showToast('Challenge Dispatched!', `Assigned "${title}" to ${cohort ? cohort.name : 'all students'}.`, 'success');
    closeModal();
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeModal}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="challenge" size={18} color={THEME.colors.accentYellow} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Assign Class Mission</Text>
                <Text style={styles.headerSubtitle}>
                  Broadcast a weekly budget or saving goal to students
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Icon name="close" size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {/* Target Cohort */}
            <Text style={styles.fieldLabel}>Target Student Cohort</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cohortSelector}>
              {cohorts.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCohortId(c.id)}
                  style={[
                    styles.cohortChip,
                    selectedCohortId === c.id && styles.cohortChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.cohortChipText,
                      selectedCohortId === c.id && styles.cohortChipTextActive,
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.fieldLabel}>Mission Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 30% Savings Discipline Challenge"
              placeholderTextColor={THEME.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Instructions / Educational Objective</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Explain how students should allocate their virtual weekly budget to earn this reward..."
              placeholderTextColor={THEME.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Numeric Targets */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Target Metric</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={target}
                  onChangeText={setTarget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="% Savings"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>XP Reward</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="250"
                  keyboardType="numeric"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={xpReward}
                  onChangeText={setXpReward}
                />
              </View>
            </View>

            <PrimaryButton
              title="Broadcast Challenge to Cohort"
              iconName="send"
              onPress={handleCreate}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: THEME.radii.xxl,
    borderTopRightRadius: THEME.radii.xxl,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  cohortSelector: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  cohortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.pill,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    marginRight: 8,
  },
  cohortChipActive: {
    backgroundColor: THEME.colors.obsidian,
    borderColor: THEME.colors.obsidian,
  },
  cohortChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  cohortChipTextActive: {
    color: THEME.colors.accentYellow,
  },
  textInput: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
