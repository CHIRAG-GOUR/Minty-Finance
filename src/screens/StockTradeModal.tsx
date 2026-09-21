import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { StockItem, StockHolding, HistoricalCandle } from '../types';
import { formatCurrency, formatPercentage, formatCompactCurrency } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { EDUCATIONAL_METRICS, PRE_INVESTMENT_CHECKLIST_ITEMS } from '../constants/mockData';
import { MarketDataService } from '../services/marketDataService';
import { GrowwInteractiveChart, GrowwTimeframe } from '../components/charts/GrowwInteractiveChart';
import { GrowwCandleChart } from '../components/charts/GrowwCandleChart';

interface StockTradeModalProps {
  visible: boolean;
  data: {
    stock: StockItem;
    action?: 'buy' | 'sell';
    holding?: StockHolding;
  } | null;
  onClose: () => void;
}

export const StockTradeModal: React.FC<StockTradeModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const {
    wallet,
    buyStock,
    sellStock,
    calculateCharges,
    toggleWatchlist,
    isWatchlisted,
    showToast,
  } = useApp();

  const [activeAction, setActiveAction] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState<number>(5);
  const [selectedTimeframe, setSelectedTimeframe] = useState<GrowwTimeframe>('1D');
  const [isCandleMode, setIsCandleMode] = useState<boolean>(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [candles, setCandles] = useState<HistoricalCandle[]>([]);

  useEffect(() => {
    if (data?.action) {
      setActiveAction(data.action);
    }
    setShares(5);
  }, [data]);

  // Fetch real multi-timeframe historical series for chart
  useEffect(() => {
    if (data?.stock?.symbol) {
      const tfMap: Record<GrowwTimeframe, '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'> = {
        '1D': '1D',
        '1W': '1W',
        '1M': '1M',
        '6M': '3M',
        '1Y': '1Y',
        '3Y': '5Y',
        '5Y': '5Y',
        'ALL': '5Y',
      };
      MarketDataService.getHistoricalCandles(data.stock.symbol, tfMap[selectedTimeframe] || '1D').then(
        (dataPoints) => {
          if (dataPoints && dataPoints.length > 0) {
            setCandles(dataPoints);
          }
        }
      );
    }
  }, [data?.stock?.symbol, selectedTimeframe]);

  if (!visible || !data || !data.stock) return null;

  const { stock, holding } = data;
  const isBuy = activeAction === 'buy';
  const heldShares = holding?.shares || 0;
  const inWatchlist = isWatchlisted(stock.symbol);

  const grossValue = parseFloat((stock.currentPrice * shares).toFixed(2));
  const charges = calculateCharges(grossValue, isBuy);
  const netTotal = isBuy
    ? parseFloat((grossValue + charges.totalCharges).toFixed(2))
    : parseFloat((grossValue - charges.totalCharges).toFixed(2));

  const maxBuyShares = Math.max(0, Math.floor(wallet.cashBalance / stock.currentPrice));
  const maxShares = isBuy ? maxBuyShares : heldShares;

  const isPos = stock.changePercent >= 0;
  const themeColor = isPos ? '#00D09C' : '#EB5757';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tracking ${stock.name} (${stock.symbol}) on Minti Finance. Current Price: ₹${stock.currentPrice} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%).`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleExecute = async () => {
    if (shares <= 0) {
      showToast('Invalid Quantity', 'Please select at least 1 virtual share.', 'warning');
      return;
    }
    if (isBuy && netTotal > wallet.cashBalance) {
      showToast('Insufficient Cash', 'Your virtual cash balance is lower than this trade value.', 'warning');
      return;
    }
    if (!isBuy && shares > heldShares) {
      showToast('Insufficient Shares', `You only own ${heldShares} shares in your portfolio.`, 'warning');
      return;
    }

    setIsSubmitting(true);
    let success = false;
    if (isBuy) {
      success = await buyStock(stock.symbol, shares);
    } else {
      success = await sellStock(stock.symbol, shares);
    }
    setIsSubmitting(false);
    if (success) {
      showToast(
        isBuy ? 'Simulated Buy Executed' : 'Simulated Sell Executed',
        `${isBuy ? 'Bought' : 'Sold'} ${shares} shares of ${stock.symbol} at ₹${stock.currentPrice}`,
        'success'
      );
      onClose();
    }
  };

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sparkline fallback or candles close series
  const chartSeries = useMemo(() => {
    if (candles.length > 0) {
      return candles.map((c) => c.close);
    }
    if (selectedTimeframe === '1D') return stock.historical1D || stock.sparkline;
    if (selectedTimeframe === '1W') return stock.historical1W || stock.sparkline;
    if (selectedTimeframe === '1M') return stock.historical1M || stock.sparkline;
    return stock.historical1Y || stock.sparkline;
  }, [candles, selectedTimeframe, stock]);

  // Performance slider range percentages
  const dayRange = (stock.dayHigh || stock.currentPrice * 1.02) - (stock.dayLow || stock.currentPrice * 0.98);
  const dayPos = dayRange > 0 ? ((stock.currentPrice - (stock.dayLow || stock.currentPrice * 0.98)) / dayRange) * 100 : 50;

  const yearRange = (stock.fiftyTwoWeekHigh || stock.currentPrice * 1.3) - (stock.fiftyTwoWeekLow || stock.currentPrice * 0.7);
  const yearPos = yearRange > 0 ? ((stock.currentPrice - (stock.fiftyTwoWeekLow || stock.currentPrice * 0.7)) / yearRange) * 100 : 50;

  // Company logo emblem colors
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
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title=""
      subtitle=""
      iconName="stocks"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Groww Top Navigation Bar */}
        <View style={styles.topHeaderBar}>
          <View style={styles.topHeaderLeft}>
            <View style={[styles.stockEmblem, { backgroundColor: emblem.bg }]}>
              <Text style={styles.stockEmblemText}>{emblem.text}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stockTitleText} numberOfLines={1}>
                {stock.name}
              </Text>
              <View style={styles.categoryBadgeRow}>
                <View style={styles.exchangePill}>
                  <Text style={styles.exchangeText}>{stock.exchange || 'NSE'}</Text>
                </View>
                <Text style={styles.badgeText}>{stock.sector}</Text>
                <Text style={styles.badgeDot}>•</Text>
                <Text style={[styles.badgeText, { color: stock.risk === 'High' ? '#DC2626' : '#059669' }]}>
                  {stock.risk} Risk
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topHeaderRight}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleWatchlist(stock.symbol)}
              style={styles.iconBtn}
            >
              <Icon
                name={inWatchlist ? 'bookmark' : 'bookmark'}
                size={18}
                color={inWatchlist ? '#00D09C' : '#64748B'}
              />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleShare} style={styles.iconBtn}>
              <Icon name="share" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Groww Interactive Chart Card */}
        <View style={styles.chartWrapperCard}>
          {isCandleMode ? (
            <View>
              <View style={styles.candleToggleRow}>
                <Text style={styles.candleHeading}>Candlestick Price Action</Text>
                <TouchableOpacity
                  onPress={() => setIsCandleMode(false)}
                  style={styles.lineToggleBtn}
                >
                  <Icon name="activity" size={14} color="#00D09C" />
                  <Text style={styles.lineToggleText}>Switch to Line</Text>
                </TouchableOpacity>
              </View>
              <GrowwCandleChart candles={candles} height={230} />
            </View>
          ) : (
            <GrowwInteractiveChart
              data={chartSeries}
              currentPrice={stock.currentPrice}
              timeframe={selectedTimeframe}
              onTimeframeChange={(tf) => setSelectedTimeframe(tf)}
              showCandleToggle={true}
              isCandleMode={isCandleMode}
              onToggleCandleMode={() => setIsCandleMode(true)}
              height={220}
            />
          )}
        </View>

        {/* Groww Performance Range Sliders (Today's Low/High & 52W Low/High) */}
        <View style={styles.performanceCard}>
          <Text style={styles.perfCardTitle}>Performance</Text>

          {/* Today's Range */}
          <View style={styles.rangeRow}>
            <View style={styles.rangeLimitCol}>
              <Text style={styles.rangeLabel}>Today's Low</Text>
              <Text style={styles.rangeVal}>{formatCurrency(stock.dayLow || stock.currentPrice * 0.98, true)}</Text>
            </View>

            <View style={styles.trackContainer}>
              <View style={styles.trackBar} />
              <View style={[styles.trackPointer, { left: `${Math.max(5, Math.min(95, dayPos))}%` }]} />
            </View>

            <View style={[styles.rangeLimitCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.rangeLabel}>Today's High</Text>
              <Text style={styles.rangeVal}>{formatCurrency(stock.dayHigh || stock.currentPrice * 1.02, true)}</Text>
            </View>
          </View>

          {/* 52-Week Range */}
          <View style={[styles.rangeRow, { marginTop: 14 }]}>
            <View style={styles.rangeLimitCol}>
              <Text style={styles.rangeLabel}>52W Low</Text>
              <Text style={styles.rangeVal}>{formatCurrency(stock.fiftyTwoWeekLow || stock.currentPrice * 0.7, true)}</Text>
            </View>

            <View style={styles.trackContainer}>
              <View style={styles.trackBar} />
              <View style={[styles.trackPointer, { left: `${Math.max(5, Math.min(95, yearPos))}%` }]} />
            </View>

            <View style={[styles.rangeLimitCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.rangeLabel}>52W High</Text>
              <Text style={styles.rangeVal}>{formatCurrency(stock.fiftyTwoWeekHigh || stock.currentPrice * 1.3, true)}</Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.quickMetricsGrid}>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Open Price</Text>
              <Text style={styles.qmVal}>{formatCurrency(stock.openPrice || stock.currentPrice, true)}</Text>
            </View>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Prev. Close</Text>
              <Text style={styles.qmVal}>{formatCurrency(stock.previousClose || stock.currentPrice, true)}</Text>
            </View>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Volume</Text>
              <Text style={styles.qmVal}>{formatCompactCurrency(stock.volume || 1500000)}</Text>
            </View>
          </View>
        </View>

        {/* Existing Holding Banner */}
        {holding && holding.shares > 0 && (
          <View style={styles.holdingBanner}>
            <View style={styles.holdingLeft}>
              <Icon name="invest" size={18} color="#00D09C" />
              <View>
                <Text style={styles.holdingTitle}>Portfolio Position</Text>
                <Text style={styles.holdingShares}>
                  {holding.shares} Shares · Avg ₹{holding.averageBuyPrice.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.holdingVal}>
                {formatCurrency(holding.currentValue || holding.shares * stock.currentPrice)}
              </Text>
              <Text
                style={[
                  styles.holdingPnl,
                  { color: (holding.unrealizedPnL || 0) >= 0 ? '#00D09C' : '#EB5757' },
                ]}
              >
                {(holding.unrealizedPnL || 0) >= 0 ? '+' : ''}
                {formatCurrency(holding.unrealizedPnL || 0)} ({(holding.returnPercent || 0).toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}

        {/* Groww Key Fundamentals & Ratios */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Fundamentals & Valuation</Text>
          <Text style={styles.sectionHeaderSub}>
            Key ratios to judge if the company is priced fairly
          </Text>

          <View style={styles.fundamentalsGrid}>
            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'pe' ? null : 'pe')}
              style={styles.fundGridItem}
            >
              <Text style={styles.fundLabel}>P/E Ratio ⓘ</Text>
              <Text style={styles.fundVal}>{stock.peRatio || 24.5}</Text>
              <Text style={styles.fundSub}>Ind: {stock.fundamentals?.sectorPE || 22.0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'marketCap' ? null : 'marketCap')}
              style={styles.fundGridItem}
            >
              <Text style={styles.fundLabel}>Market Cap</Text>
              <Text style={styles.fundVal}>{stock.marketCap || '₹8.5 Lakh Cr'}</Text>
              <Text style={styles.fundSub}>Large Cap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'roe' ? null : 'roe')}
              style={styles.fundGridItem}
            >
              <Text style={styles.fundLabel}>ROE % ⓘ</Text>
              <Text style={[styles.fundVal, { color: '#00D09C' }]}>{stock.roe || 18.4}%</Text>
              <Text style={styles.fundSub}>Profitability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'debt' ? null : 'debt')}
              style={styles.fundGridItem}
            >
              <Text style={styles.fundLabel}>Debt to Equity ⓘ</Text>
              <Text style={styles.fundVal}>{stock.debtToEquity || 0.35}</Text>
              <Text style={styles.fundSub}>Balance Sheet</Text>
            </TouchableOpacity>

            <View style={styles.fundGridItem}>
              <Text style={styles.fundLabel}>EPS (Earnings/Sh)</Text>
              <Text style={styles.fundVal}>₹{stock.eps || 64.2}</Text>
              <Text style={styles.fundSub}>Trailing 12M</Text>
            </View>

            <View style={styles.fundGridItem}>
              <Text style={styles.fundLabel}>Div. Yield</Text>
              <Text style={styles.fundVal}>{stock.dividendYield || 1.15}%</Text>
              <Text style={styles.fundSub}>Cash Return</Text>
            </View>
          </View>

          {/* Student Educational Explainer Popout */}
          {expandedMetric && EDUCATIONAL_METRICS[expandedMetric] && (
            <View style={styles.explainerBox}>
              <View style={styles.explainerHeader}>
                <Icon name="learn" size={16} color="#00D09C" />
                <Text style={styles.explainerTitle}>
                  {EDUCATIONAL_METRICS[expandedMetric].title}
                </Text>
              </View>
              <Text style={styles.explainerBody}>
                {EDUCATIONAL_METRICS[expandedMetric].whatItMeans}
              </Text>
              <Text style={styles.explainerTakeaway}>
                💡 {EDUCATIONAL_METRICS[expandedMetric].whyItMatters}
              </Text>
            </View>
          )}
        </View>

        {/* Order Execution & Quantity Selector Box */}
        <View style={styles.tradeControlCard}>
          <View style={styles.tradeControlHeader}>
            <Text style={styles.tradeControlTitle}>Simulate Order Execution</Text>
            <View style={styles.buySellToggle}>
              <TouchableOpacity
                onPress={() => setActiveAction('buy')}
                style={[styles.bsPill, isBuy && styles.bsPillBuyActive]}
              >
                <Text style={[styles.bsPillText, isBuy && styles.bsPillTextBuy]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveAction('sell')}
                style={[styles.bsPill, !isBuy && styles.bsPillSellActive]}
              >
                <Text style={[styles.bsPillText, !isBuy && styles.bsPillTextSell]}>SELL</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Share Quantity Controls */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity (Whole Shares):</Text>
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                onPress={() => setShares(Math.max(1, shares - 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                value={shares.toString()}
                onChangeText={(t) => {
                  const val = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  setShares(isNaN(val) ? 1 : Math.max(1, Math.min(10000, val)));
                }}
                keyboardType="numeric"
                style={styles.qtyInput}
              />
              <TouchableOpacity
                onPress={() => setShares(shares + 1)}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Quantity Shortcuts */}
          <View style={styles.quickQtyRow}>
            {[1, 5, 10, 25, 50].map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => setShares(q)}
                style={[styles.quickQtyBtn, shares === q && styles.quickQtyBtnActive]}
              >
                <Text style={[styles.quickQtyText, shares === q && styles.quickQtyTextActive]}>
                  +{q}
                </Text>
              </TouchableOpacity>
            ))}
            {maxBuyShares > 0 && isBuy && (
              <TouchableOpacity
                onPress={() => setShares(maxBuyShares)}
                style={styles.quickQtyBtn}
              >
                <Text style={[styles.quickQtyText, { color: '#00D09C', fontWeight: '800' }]}>
                  Max ({maxBuyShares})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Order Summary & Charges */}
          <View style={styles.orderSummary}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Gross Value ({shares} × ₹{stock.currentPrice}):</Text>
              <Text style={styles.orderVal}>{formatCurrency(grossValue)}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Simulated Statutory Taxes (STT + GST):</Text>
              <Text style={styles.orderVal}>+{formatCurrency(charges.totalCharges)}</Text>
            </View>
            <View style={[styles.orderRow, styles.orderTotalRow]}>
              <Text style={styles.orderTotalLabel}>Net Virtual Payable:</Text>
              <Text style={[styles.orderTotalVal, { color: isBuy ? '#00D09C' : '#EB5757' }]}>
                {formatCurrency(netTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pre-Investment Checklist */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Pre-Investment Checklist</Text>
          <Text style={styles.sectionHeaderSub}>
            Evaluate like a professional fund manager before hitting buy
          </Text>

          <View style={styles.checklistGroup}>
            {PRE_INVESTMENT_CHECKLIST_ITEMS.map((item) => {
              const checked = !!checkedItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleChecklist(item.id)}
                  style={[styles.checklistItem, checked && styles.checklistItemActive]}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked && <Icon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checklistTitle}>{item.title}</Text>
                    <Text style={styles.checklistDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Available Virtual Balance */}
        <View style={styles.balanceReminder}>
          <Icon name="wallet" size={14} color="#64748B" />
          <Text style={styles.balanceReminderText}>
            Available Virtual Practice Cash: {formatCurrency(wallet.cashBalance)}
          </Text>
        </View>
      </ScrollView>

      {/* Groww Sticky Action Footer Bar (Dual Action) */}
      <View style={styles.bottomStickyBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveAction('sell');
            handleExecute();
          }}
          style={styles.sellActionBtn}
          disabled={heldShares <= 0}
        >
          <Text style={[styles.sellActionText, heldShares <= 0 && { color: '#94A3B8' }]}>
            SELL {heldShares > 0 ? `(${heldShares})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setActiveAction('buy');
            handleExecute();
          }}
          style={styles.buyActionBtn}
        >
          <Text style={styles.buyActionText}>
            BUY {shares} SHARES ({formatCurrency(netTotal)})
          </Text>
        </TouchableOpacity>
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stockEmblem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockEmblemText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stockTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  exchangePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  exchangeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  badgeDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  candleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  candleHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  lineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lineToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00D09C',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  perfCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeLimitCol: {
    width: 80,
  },
  rangeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  rangeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  trackContainer: {
    flex: 1,
    height: 18,
    justifyContent: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  trackBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  trackPointer: {
    position: 'absolute',
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D09C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  quickMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  qmLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  qmVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  holdingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  holdingShares: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  holdingVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#00D09C',
  },
  holdingPnl: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 12,
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fundGridItem: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  fundLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  fundVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  fundSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  explainerBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderColor: '#00D09C',
    borderLeftWidth: 3,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explainerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  explainerBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  explainerTakeaway: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D09C',
    marginTop: 4,
  },
  tradeControlCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  tradeControlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeControlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  buySellToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  bsPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bsPillBuyActive: {
    backgroundColor: '#00D09C',
  },
  bsPillSellActive: {
    backgroundColor: '#EB5757',
  },
  bsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  bsPillTextBuy: {
    color: '#FFFFFF',
  },
  bsPillTextSell: {
    color: '#FFFFFF',
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  qtyInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 4,
  },
  quickQtyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  quickQtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  quickQtyBtnActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
  },
  quickQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickQtyTextActive: {
    color: '#00D09C',
    fontWeight: '800',
  },
  orderSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  orderVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 2,
  },
  orderTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderTotalVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  checklistGroup: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  checklistItemActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00D09C',
    borderColor: '#00D09C',
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  checklistDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  balanceReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  balanceReminderText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  sellActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderColor: '#EB5757',
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EB5757',
  },
  buyActionBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#00D09C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D09C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
