import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { StockItem, RiskLevel } from '../types';
import { useApp } from '../context/AppContext';

interface AddStockModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ visible, onClose }) => {
  const { addNewStockToMarket, showToast } = useApp();

  // Hooks must run on every render. Returning early above them changes the hook
  // count between the hidden and visible renders, which React treats as fatal.
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [price, setPrice] = useState('150.00');
  const [risk, setRisk] = useState<RiskLevel>('Moderate');

  if (!visible) return null;

  const handleCreate = async () => {
    if (!symbol.trim() || !name.trim()) return;

    const parsedPrice = parseFloat(price) || 100;
    const newStock: StockItem = {
      id: `stock_${Date.now()}`,
      symbol: symbol.toUpperCase().trim(),
      name: name.trim(),
      sector: sector.trim() || 'Emerging Tech',
      currentPrice: parsedPrice,
      previousClose: parsedPrice * 0.98,
      changePercent: 2.04,
      risk,
      description: `Newly listed student simulated stock on the Minti Finance Exchange.`,
      marketCap: `₹${(parsedPrice * 10).toFixed(0)} Cr`,
      peRatio: 22.4,
      dividendYield: 1.5,
      sparkline: [parsedPrice * 0.95, parsedPrice * 0.97, parsedPrice * 0.99, parsedPrice],
      historical1D: [parsedPrice * 0.98, parsedPrice * 0.99, parsedPrice],
      historical1W: [parsedPrice * 0.92, parsedPrice * 0.95, parsedPrice],
      historical1M: [parsedPrice * 0.85, parsedPrice * 0.92, parsedPrice],
      historical1Y: [parsedPrice * 0.7, parsedPrice * 0.85, parsedPrice],
    };

    await addNewStockToMarket(newStock);
    showToast('Stock Asset Listed', `Added ${newStock.symbol} to the live simulation exchange!`, 'success');
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Create New Market Asset"
      subtitle="Super Admin Exchange Listing Desk"
      iconName="plus"
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stock Ticker Symbol</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. SKY (Skyline Robotics)"
            placeholderTextColor={THEME.colors.textMuted}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Skyline Autonomous Drones"
            placeholderTextColor={THEME.colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Industry / Sector</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Robotics & Automation"
            placeholderTextColor={THEME.colors.textMuted}
            value={sector}
            onChangeText={setSector}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Initial Virtual Share Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="150.00"
            placeholderTextColor={THEME.colors.textMuted}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Risk Rating</Text>
          <View style={styles.riskRow}>
            {(['Low', 'Moderate', 'High'] as RiskLevel[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRisk(r)}
                style={[
                  styles.riskPill,
                  risk === r && styles.riskPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.riskPillText,
                    risk === r && styles.riskPillTextActive,
                  ]}
                >
                  {r} Risk
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PrimaryButton
          title="List Stock on Minti Exchange"
          iconName="plus"
          onPress={handleCreate}
          disabled={!symbol.trim() || !name.trim()}
          size="lg"
        />
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingBottom: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  input: {
    height: 46,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 8,
  },
  riskPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  riskPillActive: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primary,
  },
  riskPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  riskPillTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
});
