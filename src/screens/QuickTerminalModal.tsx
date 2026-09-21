import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { useApp } from '../context/AppContext';

interface QuickTerminalModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickTerminalModal: React.FC<QuickTerminalModalProps> = ({
  visible,
  onClose,
}) => {
  const { setActiveTab, openModal, stockCatalog } = useApp();
  if (!visible) return null;

  const handleAction = (type: string) => {
    onClose();
    switch (type) {
      case 'trade_stock':
        openModal('stock_trade', { stock: stockCatalog[0], action: 'buy' });
        break;
      case 'compound':
        openModal('compound_calculator');
        break;
      case 'budget':
        setActiveTab('wealth_lab');
        break;
      case 'shark_tank':
        setActiveTab('shark_tank');
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      id: 'trade_stock',
      title: 'Quick Stock Order',
      desc: 'Buy or sell simulated shares with 1 tap',
      icon: 'invest',
      color: THEME.colors.primary,
      bg: THEME.colors.primarySurface,
    },
    {
      id: 'compound',
      title: 'Compound Time Machine',
      desc: 'Simulate wealth growth across 10-30 years',
      icon: 'growth',
      color: THEME.colors.secondary,
      bg: THEME.colors.secondarySurface,
    },
    {
      id: 'budget',
      title: '50/30/20 Cashflow Splitter',
      desc: 'Allocate monthly income into Needs, Wants & Savings',
      icon: 'budget',
      color: THEME.colors.accentYellowDark,
      bg: THEME.colors.accentYellowSurface,
    },
    {
      id: 'shark_tank',
      title: 'Shark Tank Deal Room',
      desc: 'Evaluate student pitches and negotiate equity stakes',
      icon: 'rocket',
      color: THEME.colors.coral,
      bg: THEME.colors.coralSurface,
    },
  ];

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Finance Command Terminal"
      subtitle="Fast actions & financial simulation tools"
      iconName="challenge"
    >
      <View style={styles.container}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.8}
            onPress={() => handleAction(action.id)}
            style={styles.actionCard}
          >
            <View style={[styles.iconBox, { backgroundColor: action.bg }]}>
              <Icon name={action.icon} size={22} color={action.color} />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 12,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 12,
    ...THEME.shadows.subtle,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
});
