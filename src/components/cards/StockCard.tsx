import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { StockItem } from '../../types';
import { StockLineChart } from '../charts/StockLineChart';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { isIndexSymbol } from '../../services/instrumentResolver';
import { isFiniteNumber } from '../../utils/safeNumber';

interface StockCardProps {
  stock: StockItem;
  heldShares?: number;
  onTradePress: (action: 'buy' | 'sell') => void;
  onCardPress?: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  heldShares = 0,
  onTradePress,
  onCardPress,
}) => {
  // An unknown change must not read as a gain, so require a real number.
  const isPositive = isFiniteNumber(stock.changePercent) ? stock.changePercent >= 0 : true;
  const trendColor = isPositive ? '#00D09C' : '#EB5757';

  // NIFTY 50 / SENSEX are benchmarks: quoted, charted, but not buyable as a
  // share. Offering BUY on them led students into an order that cannot exist.
  const isTradable = !isIndexSymbol(stock.symbol);

  const getStockEmblem = (sym: string) => {
    if (sym.includes('RELIANCE')) return { bg: '#0284C7', text: 'RIL' };
    if (sym.includes('TCS')) return { bg: '#1E3A8A', text: 'TCS' };
    if (sym.includes('HDFC')) return { bg: '#DC2626', text: 'HDFC' };
    if (sym.includes('INFY')) return { bg: '#0284C7', text: 'INFY' };
    if (sym.includes('ICICI')) return { bg: '#D97706', text: 'ICICI' };
    if (sym.includes('SBIN')) return { bg: '#0D9488', text: 'SBI' };
    if (sym.includes('BHARTI')) return { bg: '#E11D48', text: 'AIR' };
    if (sym.includes('ITC')) return { bg: '#7C3AED', text: 'ITC' };
    if (sym.includes('TATAMOTORS') || sym.includes('TATA')) return { bg: '#0369A1', text: 'TATA' };
    return { bg: '#00D09C', text: sym.slice(0, 3) };
  };

  const emblem = getStockEmblem(stock.symbol);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onCardPress || (() => onTradePress('buy'))}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.emblemBox, { backgroundColor: emblem.bg }]}>
            <Text style={styles.emblemText}>{emblem.text}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.symbolRow}>
              <Text style={styles.symbol}>{stock.symbol}</Text>
              <View style={styles.exchangePill}>
                <Text style={styles.exchangeText}>{stock.exchange || 'NSE'}</Text>
              </View>
            </View>
            <Text style={styles.companyName} numberOfLines={1}>
              {stock.name}
            </Text>
          </View>
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.price}>{formatCurrency(stock.currentPrice, true)}</Text>
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#E8FAF2' : '#FFEBEF' }]}>
            <Icon
              name={isPositive ? 'arrow-up-right' : 'arrow-down-left'}
              size={10}
              color={trendColor}
            />
            <Text style={[styles.changeText, { color: trendColor }]}>
              {formatPercentage(stock.changePercent)}
            </Text>
          </View>
        </View>
      </View>

      {/* Mini Sparkline Chart */}
      <View style={styles.chartWrapper}>
        <StockLineChart
          data={stock.sparkline}
          color={trendColor}
          height={65}
          showLabels={false}
        />
      </View>

      {/* Key Stats Pill Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sector</Text>
          <Text style={styles.statValue} numberOfLines={1}>{stock.sector}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mkt Cap</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {stock.marketCap || '—'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>P/E Ratio</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {isFiniteNumber(stock.peRatio) && stock.peRatio > 0
              ? stock.peRatio.toFixed(1)
              : '—'}
          </Text>
        </View>
      </View>

      {/* Holding & Trade Actions */}
      <View style={styles.footerRow}>
        <View style={styles.holdingStatus}>
          {heldShares > 0 ? (
            <Text style={styles.holdingText} numberOfLines={1}>
              Owned: <Text style={styles.holdingHighlight}>{heldShares} sh</Text> (
              {formatCurrency(heldShares * stock.currentPrice)})
            </Text>
          ) : (
            <Text style={styles.noHoldingText} numberOfLines={1}>
              {isTradable ? '1-tap virtual practice buy' : 'Benchmark index · tracking only'}
            </Text>
          )}
        </View>

        {isTradable ? (
          <View style={styles.tradeButtons}>
            {heldShares > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  onTradePress('sell');
                }}
                style={[styles.tradeBtn, styles.sellBtn]}
                accessibilityRole="button"
                accessibilityLabel={`Sell ${stock.symbol}`}
              >
                <Text style={styles.sellBtnText}>SELL</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                onTradePress('buy');
              }}
              style={[styles.tradeBtn, styles.buyBtn]}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${stock.symbol}`}
            >
              <Text style={styles.buyBtnText}>BUY</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    padding: 14,
    marginVertical: 5,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  emblemBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  symbol: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  exchangePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  exchangeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  companyName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartWrapper: {
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  holdingStatus: {
    flex: 1,
  },
  holdingText: {
    fontSize: 11,
    color: '#475569',
  },
  holdingHighlight: {
    fontWeight: '800',
    color: '#00D09C',
  },
  noHoldingText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tradeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  tradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    backgroundColor: '#00D09C',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  sellBtn: {
    backgroundColor: '#FFEBEF',
    borderColor: '#EB5757',
    borderWidth: 1,
  },
  sellBtnText: {
    color: '#EB5757',
    fontSize: 11,
    fontWeight: '800',
  },
});
