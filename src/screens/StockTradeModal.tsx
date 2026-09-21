import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { StockItem, StockHolding, HistoricalCandle } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { EDUCATIONAL_METRICS, PRE_INVESTMENT_CHECKLIST_ITEMS } from '../constants/mockData';
import { MarketDataService } from '../services/marketDataService';
import { StockLineChart } from '../components/charts/StockLineChart';

interface StockTradeModalProps {
  visible: boolean;
  data: {
    stock: StockItem;
    action?: 'buy' | 'sell';
    holding?: StockHolding;
  } | null;
  onClose: () => void;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';

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
    marketStatus,
  } = useApp();

  const [activeAction, setActiveAction] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState<number>(5);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');
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
      MarketDataService.getHistoricalCandles(data.stock.symbol, selectedTimeframe).then(
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

  const handleExecute = async () => {
    if (shares <= 0) return;
    setIsSubmitting(true);
    let success = false;
    if (isBuy) {
      success = await buyStock(stock.symbol, shares);
    } else {
      success = await sellStock(stock.symbol, shares);
    }
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sparkline fallback or candles close series
  const chartSeries =
    candles.length > 0
      ? candles.map((c) => c.close)
      : selectedTimeframe === '1D'
      ? stock.historical1D
      : selectedTimeframe === '1W'
      ? stock.historical1W
      : selectedTimeframe === '1M'
      ? stock.historical1M
      : stock.historical1Y;

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title={stock.symbol}
      subtitle={`${stock.name} · ${stock.exchange || 'NSE'}`}
      iconName="stocks"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Header Bar: Symbol, Sector, Watchlist toggle */}
        <View style={styles.headerBar}>
          <View style={styles.headerBarLeft}>
            <View style={styles.exchangePill}>
              <Text style={styles.exchangePillText}>{stock.exchange || 'NSE'}</Text>
            </View>
            <Text style={styles.sectorText}>{stock.sector}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleWatchlist(stock.symbol)}
            style={[styles.watchlistBtn, inWatchlist && styles.watchlistBtnActive]}
          >
            <Icon
              name={inWatchlist ? 'bookmark' : 'plus'}
              size={13}
              color={inWatchlist ? THEME.colors.accentYellow : THEME.colors.textMuted}
            />
            <Text style={[styles.watchlistText, inWatchlist && styles.watchlistTextActive]}>
              {inWatchlist ? 'Watchlisted' : 'Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Price, Change & Data Freshness Row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Current Market Price (LTP)</Text>
            <Text style={styles.priceValue}>{formatCurrency(stock.currentPrice, true)}</Text>
          </View>

          <View style={styles.priceChangeCol}>
            <View
              style={[
                styles.changeTag,
                {
                  backgroundColor: isPos
                    ? THEME.colors.primarySurface
                    : THEME.colors.coralSurface,
                },
              ]}
            >
              <Icon
                name={isPos ? 'arrow-up-right' : 'arrow-down-right'}
                size={12}
                color={isPos ? THEME.colors.primaryDark : THEME.colors.coral}
              />
              <Text
                style={[
                  styles.changeTagText,
                  { color: isPos ? THEME.colors.primaryDark : THEME.colors.coral },
                ]}
              >
                {isPos ? '+' : ''}
                {stock.change ? stock.change.toFixed(2) : '0.00'} (
                {formatPercentage(stock.changePercent)})
              </Text>
            </View>
            <Text style={styles.freshnessText}>
              {marketStatus.isOpen ? 'LIVE DATA' : 'MARKET CLOSED'}
            </Text>
          </View>
        </View>

        {/* Multi-Timeframe Interactive Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.timeframeRow}>
            {(['1D', '1W', '1M', '3M', '1Y', '5Y'] as Timeframe[]).map((tf) => (
              <TouchableOpacity
                key={tf}
                onPress={() => setSelectedTimeframe(tf)}
                style={[
                  styles.tfBtn,
                  selectedTimeframe === tf && styles.tfBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.tfBtnText,
                    selectedTimeframe === tf && styles.tfBtnTextActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartWrapper}>
            <StockLineChart
              data={chartSeries && chartSeries.length > 0 ? chartSeries : stock.sparkline}
              color={isPos ? THEME.colors.primary : THEME.colors.coral}
              height={140}
            />
          </View>
        </View>

        {/* Order Mode Switch: BUY vs SELL */}
        <View style={styles.actionTabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveAction('buy')}
            style={[styles.actionTab, isBuy && styles.actionTabBuyActive]}
          >
            <Icon name="invest" size={14} color={isBuy ? '#FFFFFF' : THEME.colors.textMuted} />
            <Text style={[styles.actionTabText, isBuy && styles.actionTabTextActive]}>
              BUY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveAction('sell')}
            style={[styles.actionTab, !isBuy && styles.actionTabSellActive]}
          >
            <Icon name="wallet" size={14} color={!isBuy ? '#FFFFFF' : THEME.colors.textMuted} />
            <Text style={[styles.actionTabText, !isBuy && styles.actionTabTextActive]}>
              SELL ({heldShares} Held)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quantity Controls & Whole Share Selector */}
        <View style={styles.orderSection}>
          <View style={styles.qtyHeaderRow}>
            <Text style={styles.orderSectionTitle}>
              {isBuy ? 'Quantity to Buy' : 'Quantity to Sell'}
            </Text>
            <Text style={styles.balanceHint}>
              {isBuy
                ? `Available: ${formatCurrency(wallet.cashBalance)}`
                : `Holding: ${heldShares} Shares`}
            </Text>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={() => setShares((prev) => Math.max(1, prev - 1))}
              style={styles.qtyBtn}
            >
              <Icon name="minus" size={16} color={THEME.colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.qtyValueBox}>
              <Text style={styles.qtyDisplay}>{shares}</Text>
              <Text style={styles.qtyUnit}>Whole Shares</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setShares((prev) =>
                  maxShares > 0 ? Math.min(maxShares, prev + 1) : prev + 1
                )
              }
              style={styles.qtyBtn}
            >
              <Icon name="plus" size={16} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Share Pills */}
          <View style={styles.quickPillsRow}>
            {[1, 5, 10, 25, 50].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setShares(amt)}
                style={[styles.quickPill, shares === amt && styles.quickPillActive]}
              >
                <Text
                  style={[
                    styles.quickPillText,
                    shares === amt && styles.quickPillTextActive,
                  ]}
                >
                  +{amt}
                </Text>
              </TouchableOpacity>
            ))}
            {maxShares > 0 && (
              <TouchableOpacity
                onPress={() => setShares(maxShares)}
                style={[styles.quickPill, styles.quickPillMax]}
              >
                <Text style={styles.quickPillMaxText}>MAX ({maxShares})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Simulated Order Review Breakdown Card */}
          <View style={styles.orderReviewCard}>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>
                {shares} × {formatCurrency(stock.currentPrice, true)}
              </Text>
              <Text style={styles.reviewVal}>{formatCurrency(grossValue)}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Simulated Statutory Charges</Text>
              <Text style={styles.reviewVal}>
                +{formatCurrency(charges.totalCharges)}
              </Text>
            </View>

            <View style={styles.chargesDetailBox}>
              <Text style={styles.chargesDetailText}>
                STT (0.1%): ₹{charges.stt.toFixed(2)} · Exch Txn: ₹{charges.exchangeTurnover.toFixed(2)} · GST: ₹{charges.gst.toFixed(2)} · Stamp Duty: ₹{charges.stampDuty.toFixed(2)}
              </Text>
            </View>

            <View style={styles.reviewDivider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewTotalLabel}>
                Total Virtual {isBuy ? 'Cost' : 'Proceeds'}
              </Text>
              <Text
                style={[
                  styles.reviewTotalVal,
                  { color: isBuy ? THEME.colors.primaryDark : THEME.colors.coral },
                ]}
              >
                {formatCurrency(netTotal)}
              </Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewSubLabel}>Remaining Virtual Cash</Text>
              <Text style={styles.reviewSubVal}>
                {formatCurrency(
                  isBuy ? wallet.cashBalance - netTotal : wallet.cashBalance + netTotal
                )}
              </Text>
            </View>
          </View>

          <PrimaryButton
            title={`Confirm ${isBuy ? 'Buy' : 'Sell'}`}
            iconName={isBuy ? 'invest' : 'wallet'}
            onPress={handleExecute}
            loading={isSubmitting}
            disabled={
              shares <= 0 ||
              (isBuy && netTotal > wallet.cashBalance) ||
              (!isBuy && shares > heldShares)
            }
            variant={isBuy ? 'primary' : 'danger'}
            size="lg"
          />
        </View>

        {/* Key Market Statistics */}
        <View style={styles.researchSection}>
          <Text style={styles.researchHeading}>Key Trading Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>Day High</Text>
              <Text style={styles.statCellVal}>
                {formatCurrency(stock.dayHigh || stock.currentPrice * 1.01, true)}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>Day Low</Text>
              <Text style={styles.statCellVal}>
                {formatCurrency(stock.dayLow || stock.currentPrice * 0.99, true)}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>52-Week High</Text>
              <Text style={styles.statCellVal}>
                {formatCurrency(stock.fiftyTwoWeekHigh || stock.currentPrice * 1.15, true)}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>52-Week Low</Text>
              <Text style={styles.statCellVal}>
                {formatCurrency(stock.fiftyTwoWeekLow || stock.currentPrice * 0.75, true)}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>Prev Close</Text>
              <Text style={styles.statCellVal}>
                {formatCurrency(stock.previousClose, true)}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statCellLabel}>Volume</Text>
              <Text style={styles.statCellVal}>
                {stock.volume ? stock.volume.toLocaleString('en-IN') : '3.8M'}
              </Text>
            </View>
          </View>
        </View>

        {/* Company Fundamentals & "Learn What to Look For" */}
        <View style={styles.researchSection}>
          <View style={styles.researchHeaderRow}>
            <Text style={styles.researchHeading}>Company Fundamentals</Text>
            <Text style={styles.learnPrompt}>Tap metric to learn</Text>
          </View>

          <View style={styles.fundamentalsGrid}>
            {/* Market Cap */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'marketCap' ? null : 'marketCap')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'marketCap' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>Market Cap</Text>
              <Text style={styles.fundVal}>{stock.marketCap}</Text>
            </TouchableOpacity>

            {/* P/E Ratio */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'peRatio' ? null : 'peRatio')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'peRatio' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>P/E Ratio</Text>
              <Text style={styles.fundVal}>{stock.peRatio.toFixed(1)}x</Text>
            </TouchableOpacity>

            {/* EPS */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'eps' ? null : 'eps')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'eps' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>EPS</Text>
              <Text style={styles.fundVal}>
                ₹{stock.eps ? stock.eps.toFixed(2) : (stock.currentPrice / stock.peRatio).toFixed(2)}
              </Text>
            </TouchableOpacity>

            {/* ROE */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'roe' ? null : 'roe')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'roe' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>ROE</Text>
              <Text style={styles.fundVal}>
                {stock.roe ? `${stock.roe.toFixed(1)}%` : '18.4%'}
              </Text>
            </TouchableOpacity>

            {/* Debt to Equity */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'debtToEquity' ? null : 'debtToEquity')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'debtToEquity' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>Debt to Equity</Text>
              <Text style={styles.fundVal}>
                {stock.debtToEquity !== undefined ? stock.debtToEquity.toFixed(2) : '0.12'}
              </Text>
            </TouchableOpacity>

            {/* Dividend Yield */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setExpandedMetric(expandedMetric === 'dividendYield' ? null : 'dividendYield')
              }
              style={[
                styles.fundCell,
                expandedMetric === 'dividendYield' && styles.fundCellExpanded,
              ]}
            >
              <Text style={styles.fundLabel}>Dividend Yield</Text>
              <Text style={styles.fundVal}>{stock.dividendYield.toFixed(2)}%</Text>
            </TouchableOpacity>
          </View>

          {/* Educational Explainer Card if a metric is selected */}
          {expandedMetric && EDUCATIONAL_METRICS[expandedMetric] && (
            <View style={styles.explainerCard}>
              <View style={styles.explainerHeader}>
                <Icon name="book-open" size={14} color={THEME.colors.primaryDark} />
                <Text style={styles.explainerTitle}>
                  {EDUCATIONAL_METRICS[expandedMetric].title}
                </Text>
              </View>
              <Text style={styles.explainerBody}>
                {EDUCATIONAL_METRICS[expandedMetric].whatItMeans}
              </Text>
              <Text style={styles.explainerWhy}>
                <Text style={{ fontWeight: '800' }}>Why Investors Care: </Text>
                {EDUCATIONAL_METRICS[expandedMetric].whyItMatters}
              </Text>
              <Text style={styles.explainerCaution}>
                <Text style={{ fontWeight: '800' }}>What to Watch: </Text>
                {EDUCATIONAL_METRICS[expandedMetric].cautionPoint}
              </Text>
            </View>
          )}
        </View>

        {/* Pre-Investment Checklist */}
        <View style={styles.researchSection}>
          <Text style={styles.researchHeading}>Pre-Investment Checklist</Text>
          <Text style={styles.checklistSub}>
            Evaluate these fundamental factors before confirming your simulated trade:
          </Text>

          <View style={styles.checklistCard}>
            {PRE_INVESTMENT_CHECKLIST_ITEMS.map((item: { id: string; title: string; description: string }) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => toggleChecklist(item.id)}
                  style={styles.checkItem}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      isChecked && styles.checkCircleChecked,
                    ]}
                  >
                    {isChecked && <Icon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>{item.title}</Text>
                    <Text style={styles.checkDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* About Company & Risk Profile */}
        <View style={styles.researchSection}>
          <Text style={styles.researchHeading}>About {stock.name}</Text>
          <Text style={styles.aboutText}>{stock.description}</Text>

          <View style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Icon name="shield" size={14} color={THEME.colors.secondary} />
              <Text style={styles.riskTitle}>Risk & Volatility Rating: {stock.risk}</Text>
            </View>
            <Text style={styles.riskDisclaimer}>
              Historical price volatility does not guarantee future returns. Always maintain a diversified portfolio across sectors.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: THEME.spacing.md,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  headerBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangePill: {
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exchangePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  sectorText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  watchlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    gap: 4,
  },
  watchlistBtnActive: {
    backgroundColor: THEME.colors.obsidian,
  },
  watchlistText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  watchlistTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  priceLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  priceValue: {
    ...THEME.typography.moneyDisplay,
    fontSize: 26,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  priceChangeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  changeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: THEME.radii.xs,
    gap: 3,
  },
  changeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  freshnessText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    backgroundColor: THEME.colors.primarySurface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  chartContainer: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 10,
    marginVertical: 8,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tfBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tfBtnActive: {
    backgroundColor: THEME.colors.obsidian,
  },
  tfBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  tfBtnTextActive: {
    color: '#FFFFFF',
  },
  chartWrapper: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 4,
    marginVertical: 10,
    gap: 6,
  },
  actionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: THEME.radii.md,
    gap: 6,
  },
  actionTabBuyActive: {
    backgroundColor: THEME.colors.primary,
  },
  actionTabSellActive: {
    backgroundColor: THEME.colors.coral,
  },
  actionTabText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textMuted,
  },
  actionTabTextActive: {
    color: '#FFFFFF',
  },
  orderSection: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: 14,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1.5,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  qtyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  balanceHint: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 6,
    marginBottom: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.sm,
  },
  qtyValueBox: {
    alignItems: 'center',
  },
  qtyDisplay: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  qtyUnit: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  quickPill: {
    flex: 1,
    backgroundColor: THEME.colors.backgroundSecondary,
    paddingVertical: 6,
    borderRadius: THEME.radii.xs,
    alignItems: 'center',
  },
  quickPillActive: {
    backgroundColor: THEME.colors.accentYellow,
  },
  quickPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  quickPillTextActive: {
    color: THEME.colors.obsidian,
  },
  quickPillMax: {
    flex: 1.4,
    backgroundColor: THEME.colors.coralSurface,
  },
  quickPillMaxText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.coral,
  },
  orderReviewCard: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  reviewVal: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  chargesDetailBox: {
    paddingVertical: 2,
  },
  chargesDetailText: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorderSubtle,
    marginVertical: 4,
  },
  reviewTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  reviewTotalVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  reviewSubLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  reviewSubVal: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  researchSection: {
    marginVertical: 8,
  },
  researchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  researchHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  learnPrompt: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    padding: 8,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  statCellLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  statCellVal: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fundCell: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    padding: 8,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
  },
  fundCellExpanded: {
    backgroundColor: THEME.colors.primarySurface,
    borderColor: THEME.colors.primary,
  },
  fundLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  fundVal: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  explainerCard: {
    backgroundColor: THEME.colors.primarySurface,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginTop: 8,
    gap: 4,
    borderColor: THEME.colors.primary,
    borderWidth: 1,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explainerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  explainerBody: {
    fontSize: 10,
    color: THEME.colors.textPrimary,
    lineHeight: 14,
  },
  explainerWhy: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    lineHeight: 14,
  },
  explainerCaution: {
    fontSize: 10,
    color: THEME.colors.coral,
    lineHeight: 14,
  },
  checklistSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginVertical: 4,
  },
  checklistCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 10,
    borderColor: THEME.colors.cardBorder,
    borderWidth: 1,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: THEME.colors.textMuted,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkCircleChecked: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  checkTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  checkDesc: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    lineHeight: 13,
  },
  aboutText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginVertical: 4,
  },
  riskCard: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginTop: 6,
    gap: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.secondary,
  },
  riskDisclaimer: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    lineHeight: 13,
  },
});
