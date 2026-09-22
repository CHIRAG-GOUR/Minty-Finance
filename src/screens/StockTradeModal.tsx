import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { Icon } from '../constants/icons';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews';
import {
  formatCurrency,
  formatCurrencyOrDash,
  formatCompactNumber,
  formatPercentage,
  formatQuantity,
  formatSignedCurrency,
  formatCandleDate,
  toWidthPercent,
  UNAVAILABLE,
} from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { EDUCATIONAL_METRICS, PRE_INVESTMENT_CHECKLIST_ITEMS } from '../constants/mockData';
import { GrowwInteractiveChart, GrowwTimeframe } from '../components/charts/GrowwInteractiveChart';
import { GrowwCandleChart } from '../components/charts/GrowwCandleChart';
import { resolveInstrument } from '../services/instrumentResolver';
import { useHistoricalCandles, ChartRange } from '../hooks/useHistoricalCandles';
import { PortfolioEngine } from '../services/portfolioEngine';
import { isFiniteNumber, safePercent, toFiniteNumber, clamp } from '../utils/safeNumber';

interface StockTradeModalProps {
  visible: boolean;
  /** Route parameters. May be null, partial, or carry a stale stock snapshot. */
  data: unknown;
  onClose: () => void;
}

const TIMEFRAME_TO_RANGE: Record<GrowwTimeframe, ChartRange> = {
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
  '6M': '6M',
  '1Y': '1Y',
  '3Y': '3Y',
  '5Y': '5Y',
  ALL: 'MAX',
};

const POSITIVE = '#00D09C';
const NEGATIVE = '#EB5757';

function getStockEmblem(sym: string): { bg: string; text: string } {
  const s = (sym || '').toUpperCase();
  if (s.includes('RELIANCE')) return { bg: '#0284C7', text: 'RIL' };
  if (s.includes('TCS')) return { bg: '#1E3A8A', text: 'TCS' };
  if (s.includes('HDFC')) return { bg: '#DC2626', text: 'HDFC' };
  if (s.includes('INFY')) return { bg: '#0284C7', text: 'INFY' };
  if (s.includes('ICICI')) return { bg: '#D97706', text: 'ICICI' };
  if (s.includes('SBIN')) return { bg: '#0D9488', text: 'SBI' };
  if (s.includes('BHARTI')) return { bg: '#E11D48', text: 'AIR' };
  if (s.includes('ITC')) return { bg: '#7C3AED', text: 'ITC' };
  if (s.includes('TATAMOTORS') || s.includes('TATA')) return { bg: '#0369A1', text: 'TATA' };
  return { bg: POSITIVE, text: s.slice(0, 3) || '—' };
}

const StockTradeEmblem: React.FC<{ symbol: string; logoUrl?: string }> = ({ symbol, logoUrl }) => {
  const [imageError, setImageError] = useState(false);
  const emblem = getStockEmblem(symbol);

  if (logoUrl && !imageError) {
    return (
      <View style={styles.stockLogoBox}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.stockLogoImage}
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.stockEmblem, { backgroundColor: emblem.bg }]}>
      <Text style={styles.stockEmblemText} numberOfLines={1}>
        {emblem.text}
      </Text>
    </View>
  );
};

const StockTradeModalBody: React.FC<StockTradeModalProps> = ({ visible, data, onClose }) => {
  const {
    wallet,
    stockCatalog,
    stockHoldings,
    marketStatus,
    buyStock,
    sellStock,
    calculateCharges,
    toggleWatchlist,
    isWatchlisted,
    showToast,
    setActiveTab,
  } = useApp();

  // ---------------------------------------------------------------------------
  // Hooks. Every hook below runs on EVERY render, including while the modal is
  // hidden. Returning early above any of them changes the hook count between
  // renders, which React treats as fatal ("Rendered more hooks than during the
  // previous render") and which took the whole app down when a stock was tapped.
  // ---------------------------------------------------------------------------
  const [activeAction, setActiveAction] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState<number>(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState<GrowwTimeframe>('1D');
  const [isCandleMode, setIsCandleMode] = useState<boolean>(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const bottomBarPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 12;

  // Resolve against the LIVE catalog every render, so the header price, the
  // chart and the position all move together on each market tick and stay
  // correct after a buy or sell. The snapshot handed over by the tapped card is
  // only a fallback for the first frame.
  const resolution = useMemo(
    () => resolveInstrument(data, stockCatalog, stockHoldings),
    [data, stockCatalog, stockHoldings]
  );

  const stock = resolution.ok ? resolution.stock : null;
  const instrument = resolution.ok ? resolution.instrument : null;
  const holding = resolution.ok ? resolution.holding : null;
  const symbol = instrument?.symbol ?? null;

  // Only fetch while the sheet is actually on screen; re-entering a stock
  // reuses this same hook rather than stacking listeners or duplicate requests.
  const chartRange = TIMEFRAME_TO_RANGE[selectedTimeframe] ?? '1D';
  const { candles, series, status: chartStatus, retry: retryChart } = useHistoricalCandles(
    visible ? symbol : null,
    chartRange
  );

  // Reset per-instrument UI state when a different stock is opened.
  useEffect(() => {
    if (!visible) return;
    setShares(1);
    setExpandedMetric(null);
    setCheckedItems({});
    setIsCandleMode(false);
    setSelectedTimeframe('1D');
  }, [visible, symbol]);

  // Honour an explicitly requested action (Buy More / Sell Position).
  useEffect(() => {
    const requested =
      data && typeof data === 'object' ? (data as { action?: unknown }).action : undefined;
    if (requested === 'buy' || requested === 'sell') setActiveAction(requested);
  }, [data]);

  const position = useMemo(
    () => PortfolioEngine.calculateHolding(holding, stock),
    [holding, stock]
  );

  // Fall back to the packaged range series only when the provider has nothing,
  // so a chart still draws offline instead of showing an error for known data.
  const fallbackSeries = useMemo(() => {
    if (!stock) return [];
    const byTimeframe: Partial<Record<GrowwTimeframe, number[] | undefined>> = {
      '1D': stock.historical1D,
      '1W': stock.historical1W,
      '1M': stock.historical1M,
      '6M': stock.historical1M,
      '1Y': stock.historical1Y,
      '3Y': stock.historical5Y ?? stock.historical1Y,
      '5Y': stock.historical5Y ?? stock.historical1Y,
      ALL: stock.historical5Y ?? stock.historical1Y,
    };
    const picked = byTimeframe[selectedTimeframe] ?? stock.sparkline;
    return Array.isArray(picked) ? picked.filter(isFiniteNumber) : [];
  }, [stock, selectedTimeframe]);

  const chartSeries = series.length >= 2 ? series : fallbackSeries;
  const chartHasData = chartSeries.length >= 2;

  const chartPoints = useMemo(() => {
    if (candles && candles.length >= 2) {
      return candles.map((c) => ({
        date: formatCandleDate(c.timestamp, selectedTimeframe),
        value: c.close,
      }));
    }
    if (chartSeries.length >= 2) {
      return chartSeries;
    }
    return [];
  }, [candles, chartSeries, selectedTimeframe]);

  const price = stock && isFiniteNumber(stock.currentPrice) ? stock.currentPrice : null;
  const isPriced = price !== null && price > 0;
  const heldShares = position.shares;

  const grossValue = isPriced ? price * shares : 0;
  const charges = useMemo(
    () => calculateCharges(grossValue, activeAction === 'buy'),
    [calculateCharges, grossValue, activeAction]
  );

  const handleShare = useCallback(async () => {
    if (!stock) return;
    try {
      await Share.share({
        message: `Tracking ${stock.name} (${stock.symbol}) on Minty Finance. Current price: ${formatCurrencyOrDash(
          price,
          true
        )} (${formatPercentage(stock.changePercent)}).`,
      });
    } catch {
      // The user dismissing the share sheet is not an error worth surfacing.
    }
  }, [stock, price]);

  const toggleChecklist = useCallback((id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Render-time guards. Safe here: no hook runs below this point.
  // ---------------------------------------------------------------------------
  if (!visible) return null;

  if (!resolution.ok || !stock || !instrument) {
    const notFound = resolution.ok === false && resolution.reason === 'not-found';
    return (
      <ModalWrapper visible={visible} onClose={onClose} title="Investment" iconName="stocks">
        <ErrorState
          title="Unable to open this investment."
          message={
            notFound
              ? `${
                  (resolution as { requested: string | null }).requested ?? 'This instrument'
                } is not in the current market list. It may have been delisted or the market data is still loading.`
              : 'This investment was opened without the details needed to load it.'
          }
          actionLabel="Retry"
          onAction={() => {
            onClose();
            setActiveTab('markets');
          }}
          secondaryActionLabel="Back"
          onSecondaryAction={onClose}
        />
      </ModalWrapper>
    );
  }

  const isBuy = activeAction === 'buy';
  const inWatchlist = isWatchlisted(stock.symbol);
  const netTotal = isBuy ? grossValue + charges.totalCharges : grossValue - charges.totalCharges;
  const maxBuyShares = isPriced ? Math.max(0, Math.floor(wallet.cashBalance / price)) : 0;

  const changePercent = isFiniteNumber(stock.changePercent) ? stock.changePercent : null;
  const isPos = (changePercent ?? 0) >= 0;
  const canSell = heldShares > 0 && isPriced;
  const canBuy = instrument.tradable && isPriced;

  // Range sliders. Positions are clamped so an odd quote can never emit "NaN%".
  const dayLow = isFiniteNumber(stock.dayLow) ? stock.dayLow : null;
  const dayHigh = isFiniteNumber(stock.dayHigh) ? stock.dayHigh : null;
  const hasDayRange = dayLow !== null && dayHigh !== null && dayHigh > dayLow && isPriced;
  const dayPos = hasDayRange ? safePercent(price - dayLow, dayHigh - dayLow, 50) : 50;

  const weekLow = isFiniteNumber(stock.fiftyTwoWeekLow) ? stock.fiftyTwoWeekLow : null;
  const weekHigh = isFiniteNumber(stock.fiftyTwoWeekHigh) ? stock.fiftyTwoWeekHigh : null;
  const hasYearRange = weekLow !== null && weekHigh !== null && weekHigh > weekLow && isPriced;
  const yearPos = hasYearRange ? safePercent(price - weekLow, weekHigh - weekLow, 50) : 50;

  const handleExecute = async (action: 'buy' | 'sell') => {
    if (isSubmitting) return;

    if (!isPriced) {
      showToast('Price Unavailable', 'Current market price is unavailable.', 'warning');
      return;
    }
    if (action === 'buy' && !instrument.tradable) {
      showToast(
        'Not Tradable',
        `${instrument.name} is a benchmark index and cannot be bought as shares.`,
        'warning'
      );
      return;
    }
    if (shares <= 0) {
      showToast('Invalid Quantity', 'Please select at least 1 virtual share.', 'warning');
      return;
    }
    if (action === 'buy' && netTotal > wallet.cashBalance) {
      showToast(
        'Insufficient Cash',
        'Your virtual cash balance is lower than this trade value.',
        'warning'
      );
      return;
    }
    if (action === 'sell' && heldShares <= 0) {
      showToast('No Holding', 'No available holding to sell.', 'warning');
      return;
    }
    if (action === 'sell' && shares > heldShares) {
      showToast(
        'Insufficient Shares',
        `You only own ${formatQuantity(heldShares)} shares in your portfolio.`,
        'warning'
      );
      return;
    }

    setActiveAction(action);
    setIsSubmitting(true);
    try {
      const success =
        action === 'buy'
          ? await buyStock(stock.symbol, shares)
          : await sellStock(stock.symbol, shares);
      if (success) onClose();
    } catch (err) {
      showToast(
        'Order Failed',
        err instanceof Error ? err.message : 'The simulated order could not be completed.',
        'warning'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChart = () => {
    if (chartStatus === 'loading' && !chartHasData) {
      return <LoadingState title="Loading chart..." compact />;
    }
    if (chartStatus === 'error' && !chartHasData) {
      return (
        <ErrorState
          title="Unable to load chart data."
          message="The historical price feed could not be reached."
          actionLabel="Retry"
          onAction={retryChart}
          compact
        />
      );
    }
    if (!chartHasData) {
      return (
        <EmptyState
          title="Chart data is not available for this time range."
          message="Try another timeframe below."
          iconName="activity"
          compact
        />
      );
    }

    if (isCandleMode) {
      return (
        <View>
          <View style={styles.candleToggleRow}>
            <Text style={styles.candleHeading}>Candlestick Price Action</Text>
            <TouchableOpacity
              onPress={() => setIsCandleMode(false)}
              style={styles.lineToggleBtn}
              accessibilityRole="button"
            >
              <Icon name="activity" size={14} color={POSITIVE} />
              <Text style={styles.lineToggleText}>Switch to Line</Text>
            </TouchableOpacity>
          </View>
          <GrowwCandleChart candles={candles} height={230} />
        </View>
      );
    }

    return (
      <GrowwInteractiveChart
        data={chartPoints}
        currentPrice={price ?? undefined}
        timeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        showCandleToggle={candles.length > 0}
        isCandleMode={isCandleMode}
        onToggleCandleMode={() => setIsCandleMode(true)}
        height={220}
        isRefreshing={chartStatus === 'loading'}
      />
    );
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose} title="" subtitle="" iconName="stocks">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: bottomBarPadding + 64 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header: identity, live price and change */}
        <View style={styles.topHeaderBar}>
          <View style={styles.topHeaderLeft}>
            <StockTradeEmblem symbol={stock.symbol} logoUrl={stock.logoUrl} />
            <View style={styles.headerTextCol}>
              <Text style={styles.stockTitleText} numberOfLines={2}>
                {stock.name}
              </Text>
              <View style={styles.categoryBadgeRow}>
                <View style={styles.exchangePill}>
                  <Text style={styles.exchangeText}>{instrument.exchange}</Text>
                </View>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {stock.sector}
                </Text>
                <Text style={styles.badgeDot}>·</Text>
                <Text
                  style={[styles.badgeText, { color: stock.risk === 'High' ? '#DC2626' : '#059669' }]}
                >
                  {stock.risk} Risk
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topHeaderRight}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleWatchlist(stock.symbol)}
              style={[styles.iconBtn, inWatchlist && styles.iconBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Icon name="bookmark" size={18} color={inWatchlist ? POSITIVE : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Share this stock"
            >
              <Icon name="share" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.livePriceRow}>
          <Text style={styles.livePriceText}>{formatCurrencyOrDash(price, true)}</Text>
          <View
            style={[styles.livePricePill, { backgroundColor: isPos ? '#E8FAF2' : '#FFEBEF' }]}
          >
            <Icon
              name={isPos ? 'arrow-up-right' : 'arrow-down-right'}
              size={12}
              color={isPos ? POSITIVE : NEGATIVE}
            />
            <Text style={[styles.livePricePillText, { color: isPos ? POSITIVE : NEGATIVE }]}>
              {formatSignedCurrency(stock.change, true)} ({formatPercentage(changePercent, true, 2)})
            </Text>
          </View>
          <Text style={styles.liveStatusText} numberOfLines={1}>
            {marketStatus.isOpen ? `${instrument.exchange} Live` : 'Market Closed'}
          </Text>
        </View>

        {!isPriced ? (
          <View style={styles.warningBanner}>
            <Icon name="alert" size={14} color="#B45309" />
            <Text style={styles.warningBannerText}>
              Current market price is unavailable. Orders are disabled until a live quote arrives.
            </Text>
          </View>
        ) : null}

        {/* Chart */}
        <View style={styles.chartWrapperCard}>{renderChart()}</View>

        {/* Performance ranges */}
        <View style={styles.performanceCard}>
          <Text style={styles.perfCardTitle}>Performance</Text>

          <View style={styles.rangeRow}>
            <View style={styles.rangeLimitCol}>
              <Text style={styles.rangeLabel}>Today's Low</Text>
              <Text style={styles.rangeVal}>{formatCurrencyOrDash(dayLow, true)}</Text>
            </View>
            <View style={styles.trackContainer}>
              <View style={styles.trackBar} />
              {hasDayRange ? (
                <View style={[styles.trackPointer, { left: toWidthPercent(dayPos, 4, 94) }]} />
              ) : null}
            </View>
            <View style={[styles.rangeLimitCol, styles.rangeLimitColEnd]}>
              <Text style={styles.rangeLabel}>Today's High</Text>
              <Text style={styles.rangeVal}>{formatCurrencyOrDash(dayHigh, true)}</Text>
            </View>
          </View>

          <View style={[styles.rangeRow, { marginTop: 14 }]}>
            <View style={styles.rangeLimitCol}>
              <Text style={styles.rangeLabel}>52W Low</Text>
              <Text style={styles.rangeVal}>{formatCurrencyOrDash(weekLow, true)}</Text>
            </View>
            <View style={styles.trackContainer}>
              <View style={styles.trackBar} />
              {hasYearRange ? (
                <View style={[styles.trackPointer, { left: toWidthPercent(yearPos, 4, 94) }]} />
              ) : null}
            </View>
            <View style={[styles.rangeLimitCol, styles.rangeLimitColEnd]}>
              <Text style={styles.rangeLabel}>52W High</Text>
              <Text style={styles.rangeVal}>{formatCurrencyOrDash(weekHigh, true)}</Text>
            </View>
          </View>

          <View style={styles.quickMetricsGrid}>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Open Price</Text>
              <Text style={styles.qmVal}>{formatCurrencyOrDash(stock.openPrice, true)}</Text>
            </View>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Prev. Close</Text>
              <Text style={styles.qmVal}>{formatCurrencyOrDash(stock.previousClose, true)}</Text>
            </View>
            <View style={styles.quickMetricItem}>
              <Text style={styles.qmLabel}>Volume</Text>
              <Text style={styles.qmVal}>{formatCompactNumber(stock.volume)}</Text>
            </View>
          </View>
        </View>

        {/* Portfolio position — present in both owned and not-owned states */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Your Position</Text>
          {position.isHeld ? (
            <>
              <Text style={styles.sectionHeaderSub}>
                Live valuation of your virtual holding in {stock.symbol}
              </Text>
              <View style={styles.positionGrid}>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Quantity</Text>
                  <Text style={styles.positionVal}>{formatQuantity(position.shares)} sh</Text>
                </View>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Avg Buy Price</Text>
                  <Text style={styles.positionVal}>
                    {formatCurrencyOrDash(position.averageBuyPrice, true)}
                  </Text>
                </View>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Current Price</Text>
                  <Text style={styles.positionVal}>{formatCurrencyOrDash(price, true)}</Text>
                </View>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Invested</Text>
                  <Text style={styles.positionVal}>{formatCurrency(position.totalInvested)}</Text>
                </View>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Current Value</Text>
                  <Text style={styles.positionVal}>
                    {position.hasLivePrice ? formatCurrency(position.currentValue) : UNAVAILABLE}
                  </Text>
                </View>
                <View style={styles.positionCell}>
                  <Text style={styles.positionLabel}>Portfolio Weight</Text>
                  <Text style={styles.positionVal}>
                    {formatPercentage(position.weightPercent, false)}
                  </Text>
                </View>
              </View>

              <View style={styles.pnlSplitRow}>
                <View style={styles.pnlSplitCell}>
                  <Text style={styles.positionLabel}>Today's P&amp;L</Text>
                  <Text
                    style={[
                      styles.pnlSplitVal,
                      { color: position.dayPnL >= 0 ? POSITIVE : NEGATIVE },
                    ]}
                  >
                    {position.hasLivePrice ? formatSignedCurrency(position.dayPnL) : UNAVAILABLE}
                  </Text>
                </View>
                <View style={styles.pnlSplitDivider} />
                <View style={styles.pnlSplitCell}>
                  <Text style={styles.positionLabel}>Total P&amp;L</Text>
                  <Text
                    style={[
                      styles.pnlSplitVal,
                      { color: position.unrealizedPnL >= 0 ? POSITIVE : NEGATIVE },
                    ]}
                  >
                    {position.hasLivePrice
                      ? `${formatSignedCurrency(position.unrealizedPnL)} (${formatPercentage(
                          position.returnPercent,
                          true,
                          2
                        )})`
                      : UNAVAILABLE}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionHeaderSub}>Not in your portfolio</Text>
              <View style={styles.notOwnedActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setActiveAction('buy')}
                  style={[styles.notOwnedBtn, styles.notOwnedBtnPrimary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.notOwnedBtnPrimaryText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleWatchlist(stock.symbol)}
                  style={styles.notOwnedBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.notOwnedBtnText}>
                    {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setExpandedMetric('pe')}
                  style={styles.notOwnedBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.notOwnedBtnText}>Research</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Fundamentals */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Fundamentals &amp; Valuation</Text>
          <Text style={styles.sectionHeaderSub}>
            Key ratios to judge if the company is priced fairly
          </Text>

          <View style={styles.fundamentalsGrid}>
            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'pe' ? null : 'pe')}
              style={styles.fundGridItem}
              accessibilityRole="button"
            >
              <View style={styles.fundLabelRow}>
                <Text style={styles.fundLabel} numberOfLines={1}>
                  P/E Ratio
                </Text>
                <Icon name="info" size={10} color="#94A3B8" />
              </View>
              <Text style={styles.fundVal}>{stock.peRatio > 0 ? stock.peRatio : UNAVAILABLE}</Text>
              <Text style={styles.fundSub}>
                Ind: {stock.fundamentals?.sectorPE ?? UNAVAILABLE}
              </Text>
            </TouchableOpacity>

            <View style={styles.fundGridItem}>
              <Text style={styles.fundLabel} numberOfLines={1}>
                Market Cap
              </Text>
              <Text style={styles.fundVal} numberOfLines={2}>
                {stock.marketCap}
              </Text>
              <Text style={styles.fundSub}>Company size</Text>
            </View>

            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'roe' ? null : 'roe')}
              style={styles.fundGridItem}
              accessibilityRole="button"
            >
              <View style={styles.fundLabelRow}>
                <Text style={styles.fundLabel} numberOfLines={1}>
                  ROE
                </Text>
                <Icon name="info" size={10} color="#94A3B8" />
              </View>
              <Text style={[styles.fundVal, { color: POSITIVE }]}>
                {formatPercentage(stock.roe, false)}
              </Text>
              <Text style={styles.fundSub}>Profitability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExpandedMetric(expandedMetric === 'debt' ? null : 'debt')}
              style={styles.fundGridItem}
              accessibilityRole="button"
            >
              <View style={styles.fundLabelRow}>
                <Text style={styles.fundLabel} numberOfLines={1}>
                  Debt/Equity
                </Text>
                <Icon name="info" size={10} color="#94A3B8" />
              </View>
              <Text style={styles.fundVal}>
                {isFiniteNumber(stock.debtToEquity) ? stock.debtToEquity : UNAVAILABLE}
              </Text>
              <Text style={styles.fundSub}>Balance sheet</Text>
            </TouchableOpacity>

            <View style={styles.fundGridItem}>
              <Text style={styles.fundLabel} numberOfLines={1}>
                EPS
              </Text>
              <Text style={styles.fundVal}>{formatCurrencyOrDash(stock.eps, true)}</Text>
              <Text style={styles.fundSub}>Trailing 12M</Text>
            </View>

            <View style={styles.fundGridItem}>
              <Text style={styles.fundLabel} numberOfLines={1}>
                Div. Yield
              </Text>
              <Text style={styles.fundVal}>{formatPercentage(stock.dividendYield, false, 2)}</Text>
              <Text style={styles.fundSub}>Cash return</Text>
            </View>
          </View>

          {expandedMetric && EDUCATIONAL_METRICS[expandedMetric] ? (
            <View style={styles.explainerBox}>
              <View style={styles.explainerHeader}>
                <Icon name="learn" size={16} color={POSITIVE} />
                <Text style={styles.explainerTitle}>
                  {EDUCATIONAL_METRICS[expandedMetric].title}
                </Text>
              </View>
              <Text style={styles.explainerBody}>
                {EDUCATIONAL_METRICS[expandedMetric].whatItMeans}
              </Text>
              <View style={styles.explainerTakeawayRow}>
                <Icon name="lightbulb" size={13} color={POSITIVE} />
                <Text style={styles.explainerTakeaway}>
                  {EDUCATIONAL_METRICS[expandedMetric].whyItMatters}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* About */}
        {stock.description ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>About {stock.symbol}</Text>
            <Text style={styles.aboutText}>{stock.description}</Text>
          </View>
        ) : null}

        {/* Order ticket */}
        <View style={styles.tradeControlCard}>
          <View style={styles.tradeControlHeader}>
            <Text style={styles.tradeControlTitle}>Simulate Order Execution</Text>
            <View style={styles.buySellToggle}>
              <TouchableOpacity
                onPress={() => setActiveAction('buy')}
                style={[styles.bsPill, isBuy && styles.bsPillBuyActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.bsPillText, isBuy && styles.bsPillTextActive]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveAction('sell')}
                style={[styles.bsPill, !isBuy && styles.bsPillSellActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.bsPillText, !isBuy && styles.bsPillTextActive]}>SELL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity (whole shares)</Text>
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                onPress={() => setShares((n) => Math.max(1, n - 1))}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Icon name="minus" size={16} color="#0F172A" />
              </TouchableOpacity>
              <TextInput
                value={String(shares)}
                onChangeText={(t) => {
                  const digits = t.replace(/[^0-9]/g, '');
                  const val = parseInt(digits, 10);
                  setShares(Number.isNaN(val) ? 1 : clamp(val, 1, 10000));
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={5}
                style={styles.qtyInput}
                accessibilityLabel="Share quantity"
              />
              <TouchableOpacity
                onPress={() => setShares((n) => Math.min(10000, n + 1))}
                style={styles.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Icon name="plus" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickQtyRow}>
            {[1, 5, 10, 25, 50].map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => setShares(q)}
                style={[styles.quickQtyBtn, shares === q && styles.quickQtyBtnActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.quickQtyText, shares === q && styles.quickQtyTextActive]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
            {isBuy && maxBuyShares > 0 ? (
              <TouchableOpacity
                onPress={() => setShares(maxBuyShares)}
                style={styles.quickQtyBtn}
                accessibilityRole="button"
              >
                <Text style={[styles.quickQtyText, styles.quickQtyMaxText]}>
                  Max ({maxBuyShares})
                </Text>
              </TouchableOpacity>
            ) : null}
            {!isBuy && heldShares > 0 ? (
              <TouchableOpacity
                onPress={() => setShares(Math.floor(heldShares))}
                style={styles.quickQtyBtn}
                accessibilityRole="button"
              >
                <Text style={[styles.quickQtyText, styles.quickQtyMaxText]}>
                  All ({formatQuantity(heldShares)})
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.orderSummary}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel} numberOfLines={2}>
                Gross value ({shares} × {formatCurrencyOrDash(price, true)})
              </Text>
              <Text style={styles.orderVal}>{isPriced ? formatCurrency(grossValue) : UNAVAILABLE}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel} numberOfLines={2}>
                Simulated statutory charges
              </Text>
              <Text style={styles.orderVal}>
                {isPriced ? formatCurrency(charges.totalCharges) : UNAVAILABLE}
              </Text>
            </View>
            <View style={[styles.orderRow, styles.orderTotalRow]}>
              <Text style={styles.orderTotalLabel}>
                {isBuy ? 'Net virtual payable' : 'Net virtual credit'}
              </Text>
              <Text style={[styles.orderTotalVal, { color: isBuy ? POSITIVE : NEGATIVE }]}>
                {isPriced ? formatCurrency(netTotal) : UNAVAILABLE}
              </Text>
            </View>
          </View>
        </View>

        {/* Pre-investment checklist */}
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
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked ? <Icon name="check" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <View style={styles.checklistTextCol}>
                    <Text style={styles.checklistTitle}>{item.title}</Text>
                    <Text style={styles.checklistDesc}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.balanceReminder}>
          <Icon name="wallet" size={14} color="#64748B" />
          <Text style={styles.balanceReminderText}>
            Available virtual practice cash: {formatCurrency(wallet.cashBalance)}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky dual action bar */}
      <View style={[styles.bottomStickyBar, { paddingBottom: bottomBarPadding }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleExecute('sell')}
          style={[styles.sellActionBtn, !canSell && styles.actionBtnDisabled]}
          disabled={!canSell || isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSell || isSubmitting }}
        >
          <Text
            style={[styles.sellActionText, !canSell && styles.actionTextDisabled]}
            numberOfLines={1}
          >
            {heldShares > 0 ? `SELL (${formatQuantity(heldShares)})` : 'NO HOLDING'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleExecute('buy')}
          style={[styles.buyActionBtn, !canBuy && styles.buyActionBtnDisabled]}
          disabled={!canBuy || isSubmitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canBuy || isSubmitting }}
        >
          <Text style={styles.buyActionText} numberOfLines={1}>
            {isSubmitting
              ? 'PLACING ORDER...'
              : !instrument.tradable
              ? 'INDEX — NOT TRADABLE'
              : !isPriced
              ? 'PRICE UNAVAILABLE'
              : `BUY ${shares} · ${formatCurrency(netTotal)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalWrapper>
  );
};

/**
 * Public entry point. The boundary keeps a fault inside the detail sheet from
 * reaching the root and terminating the app.
 */
export const StockTradeModal: React.FC<StockTradeModalProps> = (props) => {
  if (!props.visible) return null;
  return (
    <ErrorBoundary section="Stock detail" onGoBack={props.onClose}>
      <StockTradeModalBody {...props} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  stockEmblem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stockLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  stockLogoImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
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
    flexWrap: 'wrap',
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
    flexShrink: 1,
  },
  badgeDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#E6FAF5',
  },
  livePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  livePriceText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  livePricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    flexShrink: 1,
  },
  livePricePillText: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  liveStatusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 12,
  },
  warningBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#92400E',
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
    gap: 8,
  },
  candleHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
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
    color: POSITIVE,
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
    flexShrink: 1,
    minWidth: 68,
  },
  rangeLimitColEnd: {
    alignItems: 'flex-end',
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
    minWidth: 40,
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
    backgroundColor: POSITIVE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  quickMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  quickMetricItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
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
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  positionCell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 92,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  positionLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  positionVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  pnlSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  pnlSplitCell: {
    flex: 1,
    minWidth: 0,
  },
  pnlSplitDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  pnlSplitVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  notOwnedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notOwnedBtn: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  notOwnedBtnPrimary: {
    backgroundColor: POSITIVE,
    borderColor: POSITIVE,
  },
  notOwnedBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  notOwnedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fundGridItem: {
    flexGrow: 1,
    flexBasis: '29%',
    minWidth: 96,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  fundLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  fundLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 1,
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
    borderColor: POSITIVE,
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
    flexShrink: 1,
  },
  explainerBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  explainerTakeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 6,
  },
  explainerTakeaway: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    lineHeight: 16,
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginTop: 8,
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tradeControlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
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
    backgroundColor: POSITIVE,
  },
  bsPillSellActive: {
    backgroundColor: NEGATIVE,
  },
  bsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  bsPillTextActive: {
    color: '#FFFFFF',
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 1,
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    minWidth: 52,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 4,
  },
  quickQtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickQtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  quickQtyBtnActive: {
    backgroundColor: '#E6FAF5',
    borderColor: POSITIVE,
  },
  quickQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickQtyTextActive: {
    color: POSITIVE,
    fontWeight: '800',
  },
  quickQtyMaxText: {
    color: POSITIVE,
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
    alignItems: 'flex-start',
    gap: 10,
  },
  orderLabel: {
    fontSize: 11,
    color: '#64748B',
    flexShrink: 1,
  },
  orderVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 0,
  },
  orderTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 2,
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  orderTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 0,
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
    borderColor: POSITIVE,
  },
  checklistTextCol: {
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: POSITIVE,
    borderColor: POSITIVE,
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
    flexShrink: 1,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  sellActionBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderColor: NEGATIVE,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: NEGATIVE,
  },
  actionBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  actionTextDisabled: {
    color: '#94A3B8',
  },
  buyActionBtn: {
    flex: 2,
    minHeight: 48,
    paddingHorizontal: 8,
    backgroundColor: POSITIVE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  buyActionBtnDisabled: {
    backgroundColor: '#CBD5E1',
    elevation: 0,
  },
  buyActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
