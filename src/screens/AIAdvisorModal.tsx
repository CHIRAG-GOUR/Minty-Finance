import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { AIChatMessage } from '../types';
import { AIAdvisorService } from '../services/aiAdvisorService';
import { useApp } from '../context/AppContext';

interface AIAdvisorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({ visible, onClose }) => {
  const { budget, wallet, userProfile, setActiveTab } = useApp();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visible && messages.length === 0) {
      // Generate initial personalized budget advice
      const initialAdvice = AIAdvisorService.generateBudgetAnalysis(budget);
      const greetingMsg: AIChatMessage = {
        id: 'msg-init',
        sender: 'assistant',
        text: `Hello ${userProfile.name}! I'm your Minti Financial Advisor. ${initialAdvice.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: initialAdvice.suggestedPrompts,
      };
      setMessages([greetingMsg]);
    }
  }, [visible, budget]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Call service abstraction
    const response = await AIAdvisorService.askQuestion(textToSend, {
      budget,
      currentCash: wallet.cashBalance,
      portfolioValue: wallet.cashBalance + wallet.totalInvested,
      level: userProfile.level,
    });

    setIsTyping(false);

    const botMsg: AIChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: response.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: response.suggestedPrompts,
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Minti Financial Advisor"
      subtitle="Personalized budget analysis & teen financial guidance"
      iconName="tip"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <View key={msg.id} style={styles.msgWrapper}>
                <View
                  style={[
                    styles.msgBubble,
                    isBot ? styles.msgBubbleBot : styles.msgBubbleUser,
                  ]}
                >
                  <View style={styles.msgHeader}>
                    <Icon
                      name={isBot ? 'tip' : 'user'}
                      size={13}
                      color={isBot ? THEME.colors.secondary : THEME.colors.textInverse}
                    />
                    <Text
                      style={[
                        styles.msgSender,
                        { color: isBot ? THEME.colors.secondary : THEME.colors.textInverse },
                      ]}
                    >
                      {isBot ? 'Minti Advisor' : 'You'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.msgText,
                      { color: isBot ? THEME.colors.textPrimary : THEME.colors.textInverse },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>

                {/* Prompt Suggestions */}
                {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestionsRow}>
                    {msg.suggestions.map((sug, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.75}
                        onPress={() => handleSend(sug)}
                        style={styles.suggestionPill}
                      >
                        <Text style={styles.suggestionText}>{sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.msgBubble, styles.msgBubbleBot, { width: 100 }]}>
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about saving, stocks, compounding..."
            placeholderTextColor={THEME.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            style={[
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
            ]}
          >
            <Icon
              name="arrow-up-right"
              size={18}
              color={inputText.trim() ? THEME.colors.textInverse : THEME.colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 420,
    justifyContent: 'space-between',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 10,
    gap: 12,
  },
  msgWrapper: {
    gap: 6,
  },
  msgBubble: {
    padding: 12,
    borderRadius: THEME.radii.lg,
    maxWidth: '90%',
  },
  msgBubbleBot: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    alignSelf: 'flex-start',
  },
  msgBubbleUser: {
    backgroundColor: THEME.colors.primary,
    alignSelf: 'flex-end',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  msgSender: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 4,
  },
  suggestionPill: {
    backgroundColor: THEME.colors.secondarySurface,
    borderColor: THEME.colors.secondaryMuted,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.pill,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.secondary,
  },
  typingText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.pill,
    paddingHorizontal: 14,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: THEME.colors.primary,
  },
  sendBtnDisabled: {
    backgroundColor: THEME.colors.cardBorder,
  },
});
