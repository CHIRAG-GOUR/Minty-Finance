import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Rect } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export type GrowwTimeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';

export interface ChartDataPoint {
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface GrowwInteractiveChartProps {
  data: number[] | ChartDataPoint[];
  currentPrice?: number;
  timeframe?: GrowwTimeframe;
  onTimeframeChange?: (tf: GrowwTimeframe) => void;
  height?: number;
  isMutualFund?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  showTimeframeSelector?: boolean;
  showCandleToggle?: boolean;
  isCandleMode?: boolean;
  onToggleCandleMode?: () => void;
  valuePrefix?: string; // '₹' or '%'
  isPercentageReturn?: boolean;
}

/**
 * Creates a smooth cubic Bezier curve path through data points
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion
    const tension = 0.2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export const GrowwInteractiveChart: React.FC<GrowwInteractiveChartProps> = ({
  data,
  currentPrice,
  timeframe = '1Y',
  onTimeframeChange,
  height = 220,
  isMutualFund = false,
  positiveColor = '#00D09C', // Groww signature emerald
  negativeColor = '#EB5757', // Groww signature red
  showTimeframeSelector = true,
  showCandleToggle = false,
  isCandleMode = false,
  onToggleCandleMode,
  valuePrefix = '₹',
  isPercentageReturn = false,
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(340);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedTf, setSelectedTf] = useState<GrowwTimeframe>(timeframe);

  // Normalize input data points
  const pointsData = useMemo<ChartDataPoint[]>(() => {
    if (!data || data.length === 0) {
      return [{ date: 'Today', value: currentPrice || 100 }];
    }

    if (typeof data[0] === 'number') {
      const nums = data as number[];
      const count = nums.length;
      return nums.map((val, idx) => {
        let dateLabel = '';
        if (timeframe === '1D') {
          const hour = 9 + Math.floor((idx / count) * 6.5);
          const mins = Math.floor(((idx / count) * 6.5 * 60) % 60);
          dateLabel = `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        } else if (timeframe === '1W') {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];
          dateLabel = days[idx % days.length];
        } else if (timeframe === '1M' || timeframe === '6M') {
          dateLabel = `Day ${idx + 1}`;
        } else {
          const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Today'];
          dateLabel = months[idx % months.length];
        }
        return {
          date: dateLabel,
          value: val,
        };
      });
    }

    return data as ChartDataPoint[];
  }, [data, currentPrice, timeframe]);

  const values = pointsData.map((p) => p.value);
  const baselineValue = values[0] || 1;
  const latestValue = values[values.length - 1] || currentPrice || 1;

  const activePoint = activeIndex !== null ? pointsData[activeIndex] : null;
  const displayValue = activePoint ? activePoint.value : latestValue;
  const displayDate = activePoint
    ? activePoint.date
    : isMutualFund
    ? '3Y Annualised'
    : 'Live Price';

  const changeFromBase = displayValue - baselineValue;
  const changePercentFromBase = (changeFromBase / baselineValue) * 100;
  const isPositive = changeFromBase >= 0;
  const themeColor = isPositive ? positiveColor : negativeColor;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const paddingTop = 24;
  const paddingBottom = 24;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = Math.max(100, containerWidth);

  // Map to SVG coordinates
  const svgPoints = useMemo(() => {
    if (pointsData.length <= 1) {
      return [{ x: chartWidth / 2, y: paddingTop + chartHeight / 2, raw: pointsData[0] }];
    }
    const stepX = chartWidth / (pointsData.length - 1);
    return pointsData.map((pt, idx) => {
      const x = idx * stepX;
      const y = paddingTop + chartHeight - ((pt.value - minVal) / valRange) * chartHeight;
      return { x, y, raw: pt };
    });
  }, [pointsData, chartWidth, chartHeight, minVal, valRange]);

  const pathD = useMemo(() => createSmoothPath(svgPoints), [svgPoints]);

  const areaD = useMemo(() => {
    if (svgPoints.length === 0) return '';
    const first = svgPoints[0];
    const last = svgPoints[svgPoints.length - 1];
    return `${pathD} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [pathD, svgPoints, height]);

  // Handle Touch Scrubbing
  const updateTouchIndex = (locationX: number) => {
    if (svgPoints.length < 2) return;
    const clampedX = Math.max(0, Math.min(chartWidth, locationX));
    const stepX = chartWidth / (svgPoints.length - 1);
    const closestIdx = Math.round(clampedX / stepX);
    const boundedIdx = Math.max(0, Math.min(svgPoints.length - 1, closestIdx));
    setActiveIndex(boundedIdx);
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
          // Keep active for a moment or reset
          setTimeout(() => setActiveIndex(null), 3000);
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
        },
      }),
    [svgPoints, chartWidth]
  );

  const activeSvgPoint = activeIndex !== null ? svgPoints[activeIndex] : null;

  const timeframes: GrowwTimeframe[] = ['1D', '1W', '1M', '6M', '1Y', '3Y', '5Y', 'ALL'];

  const handleTimeframePress = (tf: GrowwTimeframe) => {
    setSelectedTf(tf);
    setActiveIndex(null);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      {/* Top Groww Interactive Price/Return Header */}
      <View style={styles.topInfoRow}>
        <View style={styles.priceInfoCol}>
          <Text style={styles.displayPriceText}>
            {isPercentageReturn ? `${displayValue.toFixed(2)}%` : formatCurrency(displayValue, true)}
          </Text>
          <View style={styles.changeBadgeRow}>
            <View style={[styles.changePill, { backgroundColor: isPositive ? '#E8FAF2' : '#FFEBEF' }]}>
              <Icon
                name={isPositive ? 'arrow-up-right' : 'arrow-down-left'}
                size={12}
                color={themeColor}
              />
              <Text style={[styles.changePillText, { color: themeColor }]}>
                {isPositive ? '+' : ''}
                {isPercentageReturn
                  ? `${changeFromBase.toFixed(2)}%`
                  : `${formatCurrency(changeFromBase, true)} (${changePercentFromBase.toFixed(2)}%)`}
              </Text>
            </View>
            <Text style={styles.timeframeIndicatorText}>
              {activePoint ? `on ${displayDate}` : selectedTf}
            </Text>
          </View>
        </View>

        {/* Toggle Candle Mode if enabled */}
        {showCandleToggle && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleCandleMode}
            style={[styles.chartModeBtn, isCandleMode && styles.chartModeBtnActive]}
          >
            <Icon
              name={isCandleMode ? 'activity' : 'stocks'}
              size={14}
              color={isCandleMode ? '#00D09C' : THEME.colors.textSecondary}
            />
            <Text style={[styles.chartModeText, isCandleMode && styles.chartModeTextActive]}>
              {isCandleMode ? 'Candles' : 'Line'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SVG Canvas with Gesture Responder */}
      <View style={[styles.svgWrapper, { height }]} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="growwChartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={themeColor} stopOpacity="0.28" />
              <Stop offset="50%" stopColor={themeColor} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Background Grid Horizontal Dashed Guides */}
          <Line
            x1="0"
            y1={paddingTop}
            x2={chartWidth}
            y2={paddingTop}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
            strokeWidth="1"
            opacity={0.6}
          />
          <Line
            x1="0"
            y1={paddingTop + chartHeight / 2}
            x2={chartWidth}
            y2={paddingTop + chartHeight / 2}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
            strokeWidth="1"
            opacity={0.6}
          />
          <Line
            x1="0"
            y1={paddingTop + chartHeight}
            x2={chartWidth}
            y2={paddingTop + chartHeight}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
            strokeWidth="1"
            opacity={0.6}
          />

          {/* Gradient Area Fill */}
          <Path d={areaD} fill="url(#growwChartGradient)" />

          {/* Smooth Vector Curve Line */}
          <Path
            d={pathD}
            fill="none"
            stroke={themeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scrubber Vertical Line and Node Dot */}
          {activeSvgPoint ? (
            <>
              <Line
                x1={activeSvgPoint.x}
                y1={0}
                x2={activeSvgPoint.x}
                y2={height}
                stroke="#64748B"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {/* Pulsing Outer Aura */}
              <Circle
                cx={activeSvgPoint.x}
                cy={activeSvgPoint.y}
                r="9"
                fill={themeColor}
                opacity={0.25}
              />
              {/* Inner Glowing Center */}
              <Circle
                cx={activeSvgPoint.x}
                cy={activeSvgPoint.y}
                r="5"
                fill={themeColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </>
          ) : (
            // Default endpoint indicator
            svgPoints.length > 0 && (
              <>
                <Circle
                  cx={svgPoints[svgPoints.length - 1].x}
                  cy={svgPoints[svgPoints.length - 1].y}
                  r="7"
                  fill={themeColor}
                  opacity={0.25}
                />
                <Circle
                  cx={svgPoints[svgPoints.length - 1].x}
                  cy={svgPoints[svgPoints.length - 1].y}
                  r="4.5"
                  fill={themeColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </>
            )
          )}
        </Svg>

        {/* Floating Groww Tooltip / Callout Tag when scrubbing */}
        {activeSvgPoint && (
          <View
            style={[
              styles.floatingTooltip,
              {
                left: Math.max(
                  10,
                  Math.min(chartWidth - 110, activeSvgPoint.x - 50)
                ),
                top: Math.max(10, activeSvgPoint.y - 42),
              },
            ]}
          >
            <Text style={styles.tooltipDateText}>{activeSvgPoint.raw.date}</Text>
            <Text style={styles.tooltipValText}>
              {isMutualFund ? 'NAV: ' : ''}
              {isPercentageReturn
                ? `${activeSvgPoint.raw.value.toFixed(2)}%`
                : formatCurrency(activeSvgPoint.raw.value, true)}
            </Text>
          </View>
        )}
      </View>

      {/* Timeframe Selector Pills (Groww Signature Tabs) */}
      {showTimeframeSelector && (
        <View style={styles.timeframeRow}>
          {timeframes.map((tf) => {
            const isSelected = selectedTf === tf;
            return (
              <TouchableOpacity
                key={tf}
                activeOpacity={0.75}
                onPress={() => handleTimeframePress(tf)}
                style={[
                  styles.tfPill,
                  isSelected && styles.tfPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tfPillText,
                    isSelected && styles.tfPillTextActive,
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xl,
    paddingVertical: 12,
    marginVertical: 6,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  priceInfoCol: {
    gap: 4,
  },
  displayPriceText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  changeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeframeIndicatorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  chartModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartModeBtnActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#00D09C',
  },
  chartModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chartModeTextActive: {
    color: '#00D09C',
    fontWeight: '800',
  },
  svgWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  floatingTooltip: {
    position: 'absolute',
    backgroundColor: '#0B132B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipDateText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 1,
  },
  tooltipValText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tfPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tfPillActive: {
    backgroundColor: '#E6FAF5',
  },
  tfPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tfPillTextActive: {
    color: '#00D09C',
    fontWeight: '900',
  },
});
