import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { EmptyState } from '../common/StateViews';
import { clamp, isFiniteNumber, maxOf, minOf, safePercent } from '../../utils/safeNumber';

export type GrowwTimeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';

export interface ChartDataPoint {
  date: string;
  value: number;
}

interface GrowwInteractiveChartProps {
  data: readonly number[] | readonly ChartDataPoint[] | null | undefined;
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
  isPercentageReturn?: boolean;
  /** Shows an inline spinner while a new range loads, without unmounting the chart. */
  isRefreshing?: boolean;
}

const TIMEFRAMES: GrowwTimeframe[] = ['1D', '1W', '1M', '6M', '1Y', '3Y', '5Y', 'ALL'];

/** Smooth cubic Bezier through the points. Assumes finite coordinates. */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(
      1
    )} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  const tension = 0.2;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(
      1
    )}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

function labelFor(index: number, count: number, timeframe: GrowwTimeframe): string {
  if (timeframe === '1D') {
    const progress = count > 1 ? index / (count - 1) : 0;
    const totalMinutes = Math.round(progress * 6.25 * 60);
    const hour = 9 + Math.floor((15 + totalMinutes) / 60);
    const mins = (15 + totalMinutes) % 60;
    return `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  if (timeframe === '1W') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return index === count - 1 ? 'Today' : days[index % days.length];
  }
  if (timeframe === '1M' || timeframe === '6M' || count <= 15) {
    return index === count - 1 ? 'Today' : `Day ${index + 1}`;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return index === count - 1 ? 'Today' : months[index % months.length];
}

export const GrowwInteractiveChart: React.FC<GrowwInteractiveChartProps> = ({
  data,
  currentPrice,
  timeframe = '1D',
  onTimeframeChange,
  height = 220,
  isMutualFund = false,
  positiveColor = '#00D09C',
  negativeColor = '#EB5757',
  showTimeframeSelector = true,
  showCandleToggle = false,
  isCandleMode = false,
  onToggleCandleMode,
  isPercentageReturn = false,
  isRefreshing = false,
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // The selected pill follows the controlled prop so a parent-driven range
  // change (or a reset when a different stock is opened) stays in sync.
  const selectedTf = timeframe;

  /**
   * Normalize whatever was passed in, dropping every non-finite entry.
   * A NaN coordinate produces an SVG path string of "M NaN NaN ..." which draws
   * nothing and leaves an invisible, untappable chart.
   */
  const pointsData = useMemo<ChartDataPoint[]>(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const out: ChartDataPoint[] = [];
    for (let i = 0; i < data.length; i++) {
      const entry = data[i] as unknown;
      if (isFiniteNumber(entry)) {
        out.push({ date: '', value: entry });
      } else if (entry && typeof entry === 'object') {
        const value = (entry as ChartDataPoint).value;
        if (isFiniteNumber(value)) {
          out.push({
            date: typeof (entry as ChartDataPoint).date === 'string' ? (entry as ChartDataPoint).date : '',
            value,
          });
        }
      }
    }

    // Fill in the time labels only once the series length is final.
    return out.map((p, idx) => ({
      date: p.date || labelFor(idx, out.length, timeframe),
      value: p.value,
    }));
  }, [data, timeframe]);

  const hasSeries = pointsData.length >= 2;

  // A stale scrub index would read past the end of a shorter new series.
  useEffect(() => {
    setActiveIndex(null);
  }, [pointsData.length, timeframe]);

  const paddingTop = 24;
  const paddingBottom = 24;
  const chartHeight = Math.max(40, height - paddingTop - paddingBottom);
  const chartWidth = Math.max(80, containerWidth);

  const bounds = useMemo(() => {
    const values = pointsData.map((p) => p.value);
    const min = minOf(values, 0);
    const max = maxOf(values, 1);
    const spread = max - min;
    return { min, range: spread > 0 ? spread : Math.max(1, Math.abs(max) * 0.01) };
  }, [pointsData]);

  const svgPoints = useMemo(() => {
    if (!hasSeries || containerWidth <= 0) return [];
    const stepX = chartWidth / (pointsData.length - 1);
    return pointsData.map((pt, idx) => ({
      x: idx * stepX,
      y: paddingTop + chartHeight - ((pt.value - bounds.min) / bounds.range) * chartHeight,
      raw: pt,
    }));
  }, [hasSeries, containerWidth, chartWidth, chartHeight, pointsData, bounds]);

  const pathD = useMemo(() => createSmoothPath(svgPoints), [svgPoints]);
  const areaD = useMemo(() => {
    if (svgPoints.length < 2 || !pathD) return '';
    const first = svgPoints[0];
    const last = svgPoints[svgPoints.length - 1];
    return `${pathD} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;
  }, [pathD, svgPoints, height]);

  const updateTouchIndex = useCallback(
    (locationX: number) => {
      if (svgPoints.length < 2) return;
      const stepX = chartWidth / (svgPoints.length - 1);
      if (!(stepX > 0)) return;
      const clampedX = clamp(locationX, 0, chartWidth);
      setActiveIndex(clamp(Math.round(clampedX / stepX), 0, svgPoints.length - 1));
    },
    [svgPoints.length, chartWidth]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => svgPoints.length >= 2,
        onMoveShouldSetPanResponder: () => svgPoints.length >= 2,
        onPanResponderGrant: (evt: GestureResponderEvent) =>
          updateTouchIndex(evt.nativeEvent.locationX),
        onPanResponderMove: (evt: GestureResponderEvent) =>
          updateTouchIndex(evt.nativeEvent.locationX),
        // Released immediately rather than on a timer: a pending timeout would
        // fire after unmount and set state on a dead component.
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
      }),
    [svgPoints.length, updateTouchIndex]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Number.isFinite(w) && w > 0) setContainerWidth(w);
  }, []);

  const values = pointsData.map((p) => p.value);
  const baselineValue = hasSeries ? values[0] : null;
  const latestValue = hasSeries
    ? values[values.length - 1]
    : isFiniteNumber(currentPrice)
    ? currentPrice
    : null;

  const activePoint =
    activeIndex !== null && activeIndex < pointsData.length ? pointsData[activeIndex] : null;
  const displayValue = activePoint ? activePoint.value : latestValue;

  const changeFromBase =
    baselineValue !== null && displayValue !== null ? displayValue - baselineValue : null;
  const changePercentFromBase =
    changeFromBase !== null && baselineValue !== null
      ? safePercent(changeFromBase, baselineValue)
      : null;
  const isPositive = (changeFromBase ?? 0) >= 0;
  const themeColor = isPositive ? positiveColor : negativeColor;
  const activeSvgPoint =
    activeIndex !== null && activeIndex < svgPoints.length ? svgPoints[activeIndex] : null;

  const timeframeSelector = showTimeframeSelector ? (
    <View style={styles.timeframeRow}>
      {TIMEFRAMES.map((tf) => {
        const isSelected = selectedTf === tf;
        return (
          <TouchableOpacity
            key={tf}
            activeOpacity={0.75}
            onPress={() => onTimeframeChange?.(tf)}
            style={[styles.tfPill, isSelected && styles.tfPillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.tfPillText, isSelected && styles.tfPillTextActive]}>{tf}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ) : null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.topInfoRow}>
        <View style={styles.priceInfoCol}>
          <View style={styles.priceLine}>
            <Text style={styles.displayPriceText} numberOfLines={1} adjustsFontSizeToFit>
              {displayValue === null
                ? '—'
                : isPercentageReturn
                ? `${displayValue.toFixed(2)}%`
                : formatCurrency(displayValue, true)}
            </Text>
            {isRefreshing ? (
              <ActivityIndicator size="small" color={THEME.colors.textMuted} />
            ) : null}
          </View>

          {changeFromBase !== null ? (
            <View style={styles.changeBadgeRow}>
              <View
                style={[styles.changePill, { backgroundColor: isPositive ? '#E8FAF2' : '#FFEBEF' }]}
              >
                <Icon
                  name={isPositive ? 'arrow-up-right' : 'arrow-down-right'}
                  size={12}
                  color={themeColor}
                />
                <Text style={[styles.changePillText, { color: themeColor }]} numberOfLines={1}>
                  {isPositive ? '+' : ''}
                  {isPercentageReturn
                    ? `${changeFromBase.toFixed(2)}%`
                    : `${formatCurrency(changeFromBase, true)} (${formatPercentage(
                        changePercentFromBase,
                        false,
                        2
                      )})`}
                </Text>
              </View>
              <Text style={styles.timeframeIndicatorText} numberOfLines={1}>
                {activePoint ? activePoint.date : isMutualFund ? 'Annualised' : selectedTf}
              </Text>
            </View>
          ) : null}
        </View>

        {showCandleToggle ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleCandleMode}
            style={[styles.chartModeBtn, isCandleMode && styles.chartModeBtnActive]}
            accessibilityRole="button"
          >
            <Icon
              name={isCandleMode ? 'activity' : 'barchart'}
              size={14}
              color={isCandleMode ? positiveColor : THEME.colors.textSecondary}
            />
            <Text style={[styles.chartModeText, isCandleMode && styles.chartModeTextActive]}>
              {isCandleMode ? 'Candles' : 'Candles'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!hasSeries ? (
        <View style={{ minHeight: height * 0.6 }}>
          <EmptyState
            title="Chart data is not available for this time range."
            message="Pick another timeframe below."
            iconName="activity"
            compact
          />
        </View>
      ) : (
        <View style={[styles.svgWrapper, { height }]} {...panResponder.panHandlers}>
          {containerWidth > 0 ? (
            <Svg width={chartWidth} height={height}>
              <Defs>
                <LinearGradient id="growwChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={themeColor} stopOpacity="0.28" />
                  <Stop offset="50%" stopColor={themeColor} stopOpacity="0.08" />
                  <Stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {[0, 0.5, 1].map((fraction) => (
                <Line
                  key={fraction}
                  x1={0}
                  y1={paddingTop + chartHeight * fraction}
                  x2={chartWidth}
                  y2={paddingTop + chartHeight * fraction}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  opacity={0.6}
                />
              ))}

              {areaD ? <Path d={areaD} fill="url(#growwChartGradient)" /> : null}
              {pathD ? (
                <Path
                  d={pathD}
                  fill="none"
                  stroke={themeColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {activeSvgPoint ? (
                <>
                  <Line
                    x1={activeSvgPoint.x}
                    y1={0}
                    x2={activeSvgPoint.x}
                    y2={height}
                    stroke="#64748B"
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                  />
                  <Circle
                    cx={activeSvgPoint.x}
                    cy={activeSvgPoint.y}
                    r={9}
                    fill={themeColor}
                    opacity={0.25}
                  />
                  <Circle
                    cx={activeSvgPoint.x}
                    cy={activeSvgPoint.y}
                    r={5}
                    fill={themeColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </>
              ) : svgPoints.length > 0 ? (
                <>
                  <Circle
                    cx={svgPoints[svgPoints.length - 1].x}
                    cy={svgPoints[svgPoints.length - 1].y}
                    r={7}
                    fill={themeColor}
                    opacity={0.25}
                  />
                  <Circle
                    cx={svgPoints[svgPoints.length - 1].x}
                    cy={svgPoints[svgPoints.length - 1].y}
                    r={4.5}
                    fill={themeColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </Svg>
          ) : null}

          {activeSvgPoint ? (
            <View
              style={[
                styles.floatingTooltip,
                {
                  left: clamp(activeSvgPoint.x - 50, 8, Math.max(8, chartWidth - 108)),
                  top: clamp(activeSvgPoint.y - 42, 6, Math.max(6, height - 40)),
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.tooltipDateText}>{activeSvgPoint.raw.date}</Text>
              <Text style={styles.tooltipValText}>
                {isMutualFund ? 'NAV: ' : ''}
                {isPercentageReturn
                  ? `${activeSvgPoint.raw.value.toFixed(2)}%`
                  : formatCurrency(activeSvgPoint.raw.value, true)}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {timeframeSelector}
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
    gap: 8,
  },
  priceInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayPriceText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  changeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    gap: 4,
    flexShrink: 1,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  timeframeIndicatorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 1,
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
    flexShrink: 0,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tfPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
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
