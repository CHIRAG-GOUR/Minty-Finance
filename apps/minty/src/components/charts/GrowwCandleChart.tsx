import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Line, Rect, G } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { HistoricalCandle } from '../../types';
import { formatCurrencyOrDash, formatCompactNumber } from '../../utils/formatters';
import { EmptyState } from '../common/StateViews';
import { validateCandle } from '../../services/marketDataNormalizer';
import { clamp, maxOf, minOf } from '../../utils/safeNumber';

interface GrowwCandleChartProps {
  candles: readonly HistoricalCandle[] | null | undefined;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  /** Most recent candles to draw. More than this and the bodies become slivers. */
  maxCandles?: number;
}

export const GrowwCandleChart: React.FC<GrowwCandleChartProps> = ({
  candles,
  height = 240,
  positiveColor = '#00D09C',
  negativeColor = '#EB5757',
  maxCandles = 28,
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activeCandleIndex, setActiveCandleIndex] = useState<number | null>(null);

  /**
   * Malformed candles are dropped one by one, so a single bad row from the
   * provider cannot blank out an otherwise readable chart. Nothing synthetic is
   * substituted — invented OHLC bars would be fabricated financial data.
   */
  const displayCandles = useMemo<HistoricalCandle[]>(() => {
    if (!Array.isArray(candles)) return [];
    const valid: HistoricalCandle[] = [];
    for (const c of candles) {
      const v = validateCandle(c);
      if (v) valid.push(v);
    }
    return valid.slice(-Math.max(1, maxCandles));
  }, [candles, maxCandles]);

  const candleCount = displayCandles.length;

  const geometry = useMemo(() => {
    const lows = displayCandles.map((c) => c.low);
    const highs = displayCandles.map((c) => c.high);
    const minPrice = minOf(lows, 0);
    const maxPrice = maxOf(highs, 1);
    const spread = maxPrice - minPrice;
    return {
      minPrice,
      // A flat series would divide by zero and collapse every candle onto one line.
      priceRange: spread > 0 ? spread : 1,
      maxVolume: Math.max(1, maxOf(displayCandles.map((c) => c.volume), 1)),
    };
  }, [displayCandles]);

  // The SVG follows the measured width; nothing is pinned to a fixed pixel size.
  const chartWidth = Math.max(80, containerWidth);
  const paddingTop = 16;
  const volumeHeight = 40;
  const candleAreaHeight = Math.max(40, height - paddingTop - volumeHeight - 16);
  const candleSlotWidth = candleCount > 0 ? chartWidth / candleCount : chartWidth;
  const candleBodyWidth = Math.max(2, candleSlotWidth * 0.65);

  const updateTouchIndex = useCallback(
    (locationX: number) => {
      if (candleCount === 0 || candleSlotWidth <= 0) return;
      const clampedX = clamp(locationX, 0, chartWidth);
      const idx = Math.floor(clampedX / candleSlotWidth);
      setActiveCandleIndex(clamp(idx, 0, candleCount - 1));
    },
    [candleCount, candleSlotWidth, chartWidth]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => candleCount > 0,
        onMoveShouldSetPanResponder: () => candleCount > 0,
        onPanResponderGrant: (evt: GestureResponderEvent) =>
          updateTouchIndex(evt.nativeEvent.locationX),
        onPanResponderMove: (evt: GestureResponderEvent) =>
          updateTouchIndex(evt.nativeEvent.locationX),
        onPanResponderRelease: () => setActiveCandleIndex(null),
        onPanResponderTerminate: () => setActiveCandleIndex(null),
      }),
    [candleCount, updateTouchIndex]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Number.isFinite(w) && w > 0) setContainerWidth(w);
  }, []);

  const activeCandle =
    activeCandleIndex !== null && activeCandleIndex < candleCount
      ? displayCandles[activeCandleIndex]
      : displayCandles[candleCount - 1];

  if (candleCount === 0) {
    return (
      <View style={styles.container} onLayout={handleLayout}>
        <EmptyState
          title="Historical chart data is currently unavailable."
          message="Try a different timeframe or refresh the market feed."
          iconName="activity"
          compact
        />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {activeCandle ? (
        <View style={styles.ohlcHeader}>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>O</Text>
            <Text style={styles.ohlcVal}>{formatCurrencyOrDash(activeCandle.open, true)}</Text>
          </View>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>H</Text>
            <Text style={[styles.ohlcVal, { color: positiveColor }]}>
              {formatCurrencyOrDash(activeCandle.high, true)}
            </Text>
          </View>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>L</Text>
            <Text style={[styles.ohlcVal, { color: negativeColor }]}>
              {formatCurrencyOrDash(activeCandle.low, true)}
            </Text>
          </View>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>C</Text>
            <Text
              style={[
                styles.ohlcVal,
                { color: activeCandle.close >= activeCandle.open ? positiveColor : negativeColor },
              ]}
            >
              {formatCurrencyOrDash(activeCandle.close, true)}
            </Text>
          </View>
          {activeCandle.volume > 0 ? (
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>Vol</Text>
              <Text style={styles.ohlcVal}>{formatCompactNumber(activeCandle.volume)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.svgWrapper, { height }]} {...panResponder.panHandlers}>
        {containerWidth > 0 ? (
          <Svg width={chartWidth} height={height}>
            <Line x1={0} y1={paddingTop} x2={chartWidth} y2={paddingTop} stroke="#F1F5F9" strokeWidth={1} />
            <Line
              x1={0}
              y1={paddingTop + candleAreaHeight / 2}
              x2={chartWidth}
              y2={paddingTop + candleAreaHeight / 2}
              stroke="#F1F5F9"
              strokeWidth={1}
            />
            <Line
              x1={0}
              y1={paddingTop + candleAreaHeight}
              x2={chartWidth}
              y2={paddingTop + candleAreaHeight}
              stroke="#E2E8F0"
              strokeWidth={1}
            />

            {displayCandles.map((c, i) => {
              const isBullish = c.close >= c.open;
              const candleColor = isBullish ? positiveColor : negativeColor;
              const toY = (price: number) =>
                paddingTop +
                candleAreaHeight -
                ((price - geometry.minPrice) / geometry.priceRange) * candleAreaHeight;

              const centerX = i * candleSlotWidth + candleSlotWidth / 2;
              const highY = toY(c.high);
              const lowY = toY(c.low);
              const openY = toY(c.open);
              const closeY = toY(c.close);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(closeY - openY));

              const volBarHeight = Math.max(1, (c.volume / geometry.maxVolume) * volumeHeight);
              const volY = height - volBarHeight;

              return (
                <G key={`${c.timestamp}-${i}`}>
                  <Line
                    x1={centerX}
                    y1={highY}
                    x2={centerX}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth={1.2}
                  />
                  <Rect
                    x={centerX - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx={1}
                  />
                  <Rect
                    x={centerX - candleBodyWidth / 2}
                    y={volY}
                    width={candleBodyWidth}
                    height={volBarHeight}
                    fill={candleColor}
                    opacity={0.35}
                  />
                </G>
              );
            })}

            {activeCandleIndex !== null ? (
              <Line
                x1={activeCandleIndex * candleSlotWidth + candleSlotWidth / 2}
                y1={0}
                x2={activeCandleIndex * candleSlotWidth + candleSlotWidth / 2}
                y2={height}
                stroke="#64748B"
                strokeDasharray="2 2"
                strokeWidth={1.2}
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    paddingVertical: 10,
    marginVertical: 4,
  },
  ohlcHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ohlcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ohlcLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  ohlcVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  svgWrapper: {
    width: '100%',
    position: 'relative',
    marginTop: 6,
  },
});
