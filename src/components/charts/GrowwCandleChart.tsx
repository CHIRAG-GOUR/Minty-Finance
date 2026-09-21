import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Line, Rect, G } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { HistoricalCandle } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';

interface GrowwCandleChartProps {
  candles: HistoricalCandle[];
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
}

export const GrowwCandleChart: React.FC<GrowwCandleChartProps> = ({
  candles,
  height = 240,
  positiveColor = '#00D09C',
  negativeColor = '#EB5757',
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(340);
  const [activeCandleIndex, setActiveCandleIndex] = useState<number | null>(null);

  const displayCandles = useMemo(() => {
    if (!candles || candles.length === 0) {
      // Fallback synthetic candles
      const synth: HistoricalCandle[] = [];
      let base = 2500;
      for (let i = 0; i < 20; i++) {
        const change = (Math.random() - 0.48) * 30;
        const open = base;
        const close = base + change;
        const high = Math.max(open, close) + Math.random() * 15;
        const low = Math.min(open, close) - Math.random() * 15;
        const volume = Math.floor(50000 + Math.random() * 200000);
        synth.push({
          timestamp: `T-${20 - i}`,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume,
        });
        base = close;
      }
      return synth;
    }
    // Take up to latest 28 candles so they fit nicely
    return candles.slice(-28);
  }, [candles]);

  const activeCandle =
    activeCandleIndex !== null ? displayCandles[activeCandleIndex] : displayCandles[displayCandles.length - 1];

  const minPrice = Math.min(...displayCandles.map((c) => c.low));
  const maxPrice = Math.max(...displayCandles.map((c) => c.high));
  const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;

  const maxVolume = Math.max(...displayCandles.map((c) => c.volume || 1000));

  const paddingTop = 16;
  const volumeHeight = 40;
  const candleAreaHeight = height - paddingTop - volumeHeight - 16;
  const chartWidth = Math.max(100, containerWidth);

  const candleCount = displayCandles.length;
  const candleSlotWidth = chartWidth / candleCount;
  const candleBodyWidth = Math.max(3, candleSlotWidth * 0.65);

  const updateTouchIndex = (locationX: number) => {
    const clampedX = Math.max(0, Math.min(chartWidth, locationX));
    const idx = Math.floor(clampedX / candleSlotWidth);
    const boundedIdx = Math.max(0, Math.min(candleCount - 1, idx));
    setActiveCandleIndex(boundedIdx);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          updateTouchIndex(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          updateTouchIndex(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          setTimeout(() => setActiveCandleIndex(null), 2500);
        },
      }),
    [displayCandles, candleSlotWidth, chartWidth]
  );

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      {/* Top OHLC Indicator Bar */}
      {activeCandle && (
        <View style={styles.ohlcHeader}>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>O</Text>
            <Text style={styles.ohlcVal}>{formatCurrency(activeCandle.open, true)}</Text>
          </View>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>H</Text>
            <Text style={[styles.ohlcVal, { color: positiveColor }]}>
              {formatCurrency(activeCandle.high, true)}
            </Text>
          </View>
          <View style={styles.ohlcItem}>
            <Text style={styles.ohlcLabel}>L</Text>
            <Text style={[styles.ohlcVal, { color: negativeColor }]}>
              {formatCurrency(activeCandle.low, true)}
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
              {formatCurrency(activeCandle.close, true)}
            </Text>
          </View>
          {activeCandle.volume ? (
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>Vol</Text>
              <Text style={styles.ohlcVal}>{formatCompactCurrency(activeCandle.volume)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* SVG Canvas for Candlesticks & Volume Histogram */}
      <View style={[styles.svgWrapper, { height }]} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={height}>
          {/* Background Grid Lines */}
          <Line
            x1="0"
            y1={paddingTop}
            x2={chartWidth}
            y2={paddingTop}
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={paddingTop + candleAreaHeight / 2}
            x2={chartWidth}
            y2={paddingTop + candleAreaHeight / 2}
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={paddingTop + candleAreaHeight}
            x2={chartWidth}
            y2={paddingTop + candleAreaHeight}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Render Candles */}
          {displayCandles.map((c, i) => {
            const isBullish = c.close >= c.open;
            const candleColor = isBullish ? positiveColor : negativeColor;

            const centerX = i * candleSlotWidth + candleSlotWidth / 2;
            const highY = paddingTop + candleAreaHeight - ((c.high - minPrice) / priceRange) * candleAreaHeight;
            const lowY = paddingTop + candleAreaHeight - ((c.low - minPrice) / priceRange) * candleAreaHeight;

            const openY = paddingTop + candleAreaHeight - ((c.open - minPrice) / priceRange) * candleAreaHeight;
            const closeY = paddingTop + candleAreaHeight - ((c.close - minPrice) / priceRange) * candleAreaHeight;

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            // Volume bar
            const vol = c.volume || 1000;
            const volBarHeight = Math.max(2, (vol / maxVolume) * volumeHeight);
            const volY = height - volBarHeight;

            return (
              <G key={i}>
                {/* High/Low Wick */}
                <Line
                  x1={centerX}
                  y1={highY}
                  x2={centerX}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />

                {/* Candle Real Body */}
                <Rect
                  x={centerX - candleBodyWidth / 2}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                />

                {/* Volume Histogram Bar */}
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

          {/* Touch Crosshair Line */}
          {activeCandleIndex !== null && (
            <Line
              x1={activeCandleIndex * candleSlotWidth + candleSlotWidth / 2}
              y1={0}
              x2={activeCandleIndex * candleSlotWidth + candleSlotWidth / 2}
              y2={height}
              stroke="#64748B"
              strokeDasharray="2 2"
              strokeWidth="1.2"
            />
          )}
        </Svg>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
