import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { COUNTRIES, Country, DEFAULT_COUNTRY_CODE, findCountry } from '../../constants/countries';
import { formatNationalNumber, validatePhoneNumber } from '../../utils/phone';

interface PhoneEntryScreenProps {
  onSubmit: (e164: string) => Promise<void>;
  /** Error raised by the previous send attempt, if any. */
  submitError: string | null;
  isSubmitting: boolean;
  isConfigured: boolean;
}

export const PhoneEntryScreen: React.FC<PhoneEntryScreenProps> = ({
  onSubmit,
  submitError,
  isSubmitting,
  isConfigured,
}) => {
  const [country, setCountry] = useState<Country>(findCountry(DEFAULT_COUNTRY_CODE));
  const [rawNumber, setRawNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const validation = useMemo(
    () => validatePhoneNumber(rawNumber, country),
    [rawNumber, country]
  );

  const handleChange = useCallback(
    (text: string) => {
      setLocalError(null);
      setRawNumber(formatNationalNumber(text, country));
    },
    [country]
  );

  const handleSelectCountry = useCallback((next: Country) => {
    setCountry(next);
    setPickerOpen(false);
    // Grouping rules differ per country, so re-format what is already typed.
    setRawNumber((prev) => formatNationalNumber(prev, next));
    setLocalError(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (isSubmitting) return; // guards against a double tap
    if (!validation.valid || !validation.e164) {
      setLocalError(validation.error ?? 'Please enter a valid phone number.');
      return;
    }
    setLocalError(null);
    await onSubmit(validation.e164);
  }, [isSubmitting, validation, onSubmit]);

  const error = localError ?? submitError;
  const canContinue = validation.valid && !isSubmitting && isConfigured;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <View style={styles.logoMark}>
            <Icon name="growth" size={30} color={THEME.colors.obsidian} />
          </View>
          <Text style={styles.brandName}>Minty Finance</Text>
          <Text style={styles.brandTagline}>Learn. Practice. Invest.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter your phone number</Text>
          <Text style={styles.cardSubtitle}>
            We'll text you a 6-digit code to verify it's you.
          </Text>

          <View style={[styles.inputRow, !!error && styles.inputRowError]}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={styles.countryButton}
              accessibilityRole="button"
              accessibilityLabel={`Country code ${country.dialCode}, ${country.name}`}
            >
              <Text style={styles.countryDial}>{country.dialCode}</Text>
              <Icon name="chevron-right" size={14} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.inputDivider} />

            <TextInput
              style={styles.phoneInput}
              value={rawNumber}
              onChangeText={handleChange}
              placeholder={country.example}
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={!isSubmitting}
              accessibilityLabel="Phone number"
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Icon name="alert" size={13} color={THEME.colors.coral} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isConfigured ? (
            <View style={styles.configBanner}>
              <Icon name="alert" size={14} color="#92400E" />
              <Text style={styles.configBannerText}>
                Phone sign-in is not configured for this build yet. Add the Firebase
                google-services.json and enable the Phone provider to sign in.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
            style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            {isSubmitting ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color={THEME.colors.obsidian} />
                <Text style={styles.primaryButtonText}>Sending verification code...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.legalNote}>
            Minty is an educational simulator. You practise investing with virtual money —
            never real funds.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country</Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Close country picker"
              >
                <Icon name="close" size={16} color={THEME.colors.obsidian} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => `${item.code}-${item.dialCode}`}
              renderItem={({ item }) => {
                const selected = item.code === country.code;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelectCountry(item)}
                    style={[styles.countryRow, selected && styles.countryRowSelected]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.countryName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.countryRowDial}>{item.dialCode}</Text>
                    {selected ? <Icon name="check" size={15} color={THEME.colors.primaryDark} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xxl,
  },
  brandBlock: { alignItems: 'center', marginBottom: THEME.spacing.xxl, gap: 6 },
  logoMark: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: THEME.spacing.lg,
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: THEME.colors.textPrimary },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: THEME.colors.textSecondary,
    marginTop: -6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    minHeight: 54,
  },
  inputRowError: { borderColor: THEME.colors.coral },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexShrink: 0,
  },
  countryDial: { fontSize: 15, fontWeight: '800', color: THEME.colors.textPrimary },
  inputDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 10,
    backgroundColor: THEME.colors.cardBorder,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: THEME.colors.textPrimary,
  },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: THEME.colors.coral,
  },
  configBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: THEME.radii.md,
    padding: 10,
  },
  configBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonDisabled: { backgroundColor: THEME.colors.cardBorder },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.obsidian,
    textAlign: 'center',
  },
  legalNote: {
    fontSize: 10,
    lineHeight: 15,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,19,43,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '75%',
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: THEME.radii.xl,
    borderTopRightRadius: THEME.radii.xl,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: THEME.colors.textPrimary },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorderSubtle,
  },
  countryRowSelected: { backgroundColor: THEME.colors.primarySurface },
  countryName: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: '600', color: THEME.colors.textPrimary },
  countryRowDial: { fontSize: 13, fontWeight: '800', color: THEME.colors.textSecondary },
});
