import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { StockItem, RiskLevel } from '../types';
import { useApp } from '../context/AppContext';
import { MarketDataService } from '../services/marketDataService';
import { Icon } from '../constants/icons';

interface AddStockModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ visible, onClose }) => {
  const { addNewStockToMarket, showToast } = useApp();

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [price, setPrice] = useState('150.00');
  const [risk, setRisk] = useState<RiskLevel>('Moderate');
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  if (!visible) return null;

  const handleFetchLive = async () => {
    const q = symbol.trim() || name.trim();
    if (!q) {
      showToast('Input Required', 'Enter a symbol or company name first.', 'info');
      return;
    }

    setIsFetchingLive(true);
    try {
      const results = await MarketDataService.searchLiveYahoo(q);
      if (results && results.length > 0) {
        const best = results[0];
        setSymbol(best.symbol);
        setName(best.name);
        setSector(best.sector || 'Live Market');
        setPrice(best.currentPrice.toFixed(2));
        setRisk(best.risk || 'Moderate');
        showToast('Live Data Loaded', `Fetched live quote for ${best.name} (₹${best.currentPrice})`, 'success');
      } else {
        showToast('Not Found on Market', `No active live quote found for "${q}". You can enter custom values.`, 'warning');
      }
    } catch {
      showToast('Network Alert', 'Could not query live market in real time. Please enter manually.', 'warning');
    } finally {
      setIsFetchingLive(false);
    }
  };

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
      description: `${name.trim()} listed on the Minty Finance Exchange.`,
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>Stock Ticker Symbol</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFetchLive}
              disabled={isFetchingLive || (!symbol.trim() && !name.trim())}
              style={styles.fetchLiveBtn}
            >
              {isFetchingLive ? (
                <ActivityIndicator size="small" color={THEME.colors.primaryDark} />
              ) : (
                <>
                  <Icon name="search" size={12} color={THEME.colors.primaryDark} />
                  <Text style={styles.fetchLiveBtnText}>Fetch Live Market</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. SWIGGY, ZOMATO, PAYTM, TSLA..."
            placeholderTextColor={THEME.colors.textMuted}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Swiggy Limited"
            placeholderTextColor={THEME.colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Industry / Sector</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Quick Commerce & Food Delivery"
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
          title="List Stock on Minty Exchange"
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fetchLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    borderColor: THEME.colors.primary,
    borderWidth: 1,
  },
  fetchLiveBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
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
