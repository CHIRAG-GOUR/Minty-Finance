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
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { LessonModule } from '../types';
import { formatXP } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface LessonDetailModalProps {
  visible: boolean;
  lesson: LessonModule | null;
  onClose: () => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  visible,
  lesson,
  onClose,
}) => {
  const { completeLesson } = useApp();

  const [step, setStep] = useState<'content' | 'quiz' | 'completed'>('content');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  if (!visible || !lesson || !Array.isArray(lesson.quiz) || lesson.quiz.length === 0) return null;

  const currentQuestion = lesson.quiz[currentQuestionIdx] || lesson.quiz[0];

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    if (idx === currentQuestion.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIdx < lesson.quiz.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setStep('completed');
      await completeLesson(lesson.id, score + (selectedOption === currentQuestion.correctAnswerIndex ? 1 : 0));
    }
  };

  const handleClose = () => {
    setStep('content');
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title={lesson.title}
      subtitle={`Academy · ${lesson.category}`}
      iconName="learn"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === 'content' && (
          <>
            {/* Key takeaway banner */}
            <View style={styles.topSummaryCard}>
              <View style={styles.topSummaryHeader}>
                <Icon name="tip" size={16} color={THEME.colors.primary} />
                <Text style={styles.topSummaryTitle}>Core Concept Summary</Text>
              </View>
              {lesson.summaryPoints.map((pt: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>

            {/* Content Sections */}
            {lesson.fullContent.map((sec, idx: number) => (
              <View key={idx} style={styles.contentSection}>
                <Text style={styles.sectionHeading}>{sec.heading}</Text>
                <Text style={styles.sectionBody}>{sec.body}</Text>
                <View style={styles.takeawayPill}>
                  <Icon name="check" size={12} color={THEME.colors.primary} />
                  <Text style={styles.takeawayText}>{sec.keyTakeaway}</Text>
                </View>
              </View>
            ))}

            <PrimaryButton
              title={`Test Knowledge in Mini-Quiz (+${formatXP(lesson.xpReward)})`}
              iconName="award"
              onPress={() => setStep('quiz')}
              size="lg"
            />
          </>
        )}

        {step === 'quiz' && currentQuestion && (
          <View style={styles.quizCard}>
            <View style={styles.quizHeader}>
              <Text style={styles.quizStepText}>
                Question {currentQuestionIdx + 1} of {lesson.quiz.length}
              </Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>Score: {score}</Text>
              </View>
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Options list */}
            <View style={styles.optionsList}>
              {currentQuestion.options.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctAnswerIndex;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    disabled={hasAnswered}
                    onPress={() => handleSelectOption(idx)}
                    style={[
                      styles.optionBtn,
                      isSelected && styles.optionBtnSelected,
                      hasAnswered && isCorrect && styles.optionBtnCorrect,
                      hasAnswered && isSelected && !isCorrect && styles.optionBtnWrong,
                    ]}
                  >
                    <View style={styles.optionLetterBox}>
                      <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Immediate Explanation Box */}
            {hasAnswered && (
              <View
                style={[
                  styles.explanationBox,
                  selectedOption === currentQuestion.correctAnswerIndex
                    ? styles.explanationCorrect
                    : styles.explanationWrong,
                ]}
              >
                <View style={styles.expHeader}>
                  <Icon
                    name={selectedOption === currentQuestion.correctAnswerIndex ? 'check' : 'warning'}
                    size={16}
                    color={
                      selectedOption === currentQuestion.correctAnswerIndex
                        ? THEME.colors.primary
                        : THEME.colors.coral
                    }
                  />
                  <Text
                    style={[
                      styles.expTitle,
                      {
                        color:
                          selectedOption === currentQuestion.correctAnswerIndex
                            ? THEME.colors.primary
                            : THEME.colors.coral,
                      },
                    ]}
                  >
                    {selectedOption === currentQuestion.correctAnswerIndex
                      ? 'Correct Answer!'
                      : 'Incorrect'}
                  </Text>
                </View>
                <Text style={styles.expText}>{currentQuestion.explanation}</Text>
              </View>
            )}

            {hasAnswered && (
              <PrimaryButton
                title={currentQuestionIdx < lesson.quiz.length - 1 ? 'Next Question' : 'Complete Module'}
                iconName="chevron-right"
                onPress={handleNextQuestion}
                size="md"
              />
            )}
          </View>
        )}

        {step === 'completed' && (
          <View style={styles.completedCard}>
            <View style={styles.celebrateEmblem}>
              <Icon name="award" size={44} color={THEME.colors.primary} />
            </View>
            <Text style={styles.completedTitle}>Lesson Completed!</Text>
            <Text style={styles.completedSub}>
              You earned <Text style={styles.xpGainedHighlight}>+{formatXP(lesson.xpReward)}</Text> for mastering this module.
            </Text>

            <View style={styles.finalScoreBox}>
              <Text style={styles.finalScoreLabel}>Your Mini-Quiz Score</Text>
              <Text style={styles.finalScoreVal}>{score} / {lesson.quiz.length} Correct</Text>
            </View>

            <PrimaryButton
              title="Continue Learning"
              iconName="check"
              onPress={handleClose}
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
    gap: 12,
  },
  topSummaryCard: {
    backgroundColor: THEME.colors.primarySurface,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderColor: THEME.colors.primaryMuted,
    borderWidth: 1,
    gap: 6,
  },
  topSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  topSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  contentSection: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  sectionBody: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
  },
  takeawayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    padding: 8,
    borderRadius: THEME.radii.md,
    marginTop: 4,
    gap: 6,
  },
  takeawayText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    flex: 1,
  },
  quizCard: {
    gap: 10,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  scorePill: {
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    lineHeight: 22,
  },
  optionsList: {
    gap: 8,
    marginVertical: 6,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: THEME.radii.lg,
    gap: 10,
  },
  optionBtnSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  optionBtnCorrect: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySurface,
  },
  optionBtnWrong: {
    borderColor: THEME.colors.coral,
    backgroundColor: THEME.colors.coralSurface,
  },
  optionLetterBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  explanationBox: {
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  explanationCorrect: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primaryMuted,
  },
  explanationWrong: {
    backgroundColor: THEME.colors.coralSurface,
    borderColor: THEME.colors.coralMuted,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  expText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
  completedCard: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  celebrateEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  completedSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  xpGainedHighlight: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  finalScoreBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: THEME.radii.lg,
    alignItems: 'center',
    marginBottom: 18,
  },
  finalScoreLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  finalScoreVal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
});
