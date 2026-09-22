import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { finiteSeries, maxOf, minOf } from '../../utils/safeNumber';

interface StockLineChartProps {
  data: readonly number[] | null | undefined;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

/**
 * Compact sparkline. Uses a fixed internal coordinate system scaled to the
 * available width by `viewBox`, so it adapts to any card width.
 */
export const StockLineChart: React.FC<StockLineChartProps> = ({
  data,
  color = THEME.colors.primary,
  height = 140,
  showLabels = true,
}) => {
  // Non-finite entries are dropped: one NaN turns the whole path string into
  // "M NaN NaN ..." and the line silently disappears.
  const series = useMemo(() => finiteSeries(data), [data]);

  const geometry = useMemo(() => {
    if (series.length < 2) return null;

    const min = minOf(series, 0);
    const max = maxOf(series, 1);
    const spread = max - min;
    const range = spread > 0 ? spread : Math.max(1, Math.abs(max) * 0.01);

    const paddingVertical = 12;
    const chartHeight = Math.max(20, height - paddingVertical * 2);
    const chartWidth = 320; // internal coordinate system, scaled by viewBox
    const stepX = chartWidth / (series.length - 1);

    const points = series.map((val, index) => ({
      x: index * stepX,
      y: paddingVertical + chartHeight - ((val - min) / range) * chartHeight,
    }));

    const pathD = points
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');

    return {
      min,
      max,
      paddingVertical,
      chartHeight,
      chartWidth,
      points,
      pathD,
      areaD: `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(
        1
      )} ${height} Z`,
      lastPoint: points[points.length - 1],
    };
  }, [series, height]);

  // Too little data to draw a line: render nothing rather than a broken axis.
  if (!geometry) return null;

  const { min, max, paddingVertical, chartHeight, chartWidth, pathD, areaD, lastPoint } = geometry;
  const gradientId = `sparkGradient-${color.replace('#', '')}`;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {[0, 0.5, 1].map((fraction) => (
          <Line
            key={fraction}
            x1={0}
            y1={paddingVertical + chartHeight * fraction}
            x2={chartWidth}
            y2={paddingVertical + chartHeight * fraction}
            stroke={THEME.colors.cardBorderSubtle}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        <Path d={areaD} fill={`url(#${gradientId})`} />
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={4}
          fill={color}
          stroke={THEME.colors.card}
          strokeWidth={2}
        />
      </Svg>

      {showLabels ? (
        <View style={styles.labelsRow}>
          <Text style={styles.labelText} numberOfLines={1}>
            Low: {formatCurrency(min, true)}
          </Text>
          <Text style={[styles.labelText, styles.labelCurrent, { color }]} numberOfLines={1}>
            Current: {formatCurrency(series[series.length - 1], true)}
          </Text>
          <Text style={styles.labelText} numberOfLines={1}>
            High: {formatCurrency(max, true)}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
    gap: 6,
  },
  labelText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  labelCurrent: {
    fontWeight: '700',
  },
});
