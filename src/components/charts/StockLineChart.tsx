import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

interface StockLineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showLabels?: boolean;
}

export const StockLineChart: React.FC<StockLineChartProps> = ({
  data,
  color = THEME.colors.primary,
  height = 140,
  showLabels = true,
}) => {
  if (!data || data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingVertical = 12;
  const chartHeight = height - paddingVertical * 2;
  const chartWidth = 320; // internal coordinate system

  const stepX = chartWidth / (data.length - 1);

  // Generate SVG path coordinates
  const points = data.map((val, index) => {
    const x = index * stepX;
    const y = paddingVertical + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid horizontal dashed lines */}
        <Line
          x1="0"
          y1={paddingVertical}
          x2={chartWidth}
          y2={paddingVertical}
          stroke={THEME.colors.cardBorderSubtle}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <Line
          x1="0"
          y1={paddingVertical + chartHeight / 2}
          x2={chartWidth}
          y2={paddingVertical + chartHeight / 2}
          stroke={THEME.colors.cardBorderSubtle}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
        <Line
          x1="0"
          y1={paddingVertical + chartHeight}
          x2={chartWidth}
          y2={paddingVertical + chartHeight}
          stroke={THEME.colors.cardBorderSubtle}
          strokeDasharray="4 4"
          strokeWidth="1"
        />

        {/* Gradient fill area */}
        <Path d={areaD} fill="url(#chartGradient)" />

        {/* Crisp Stroke line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Final current point dot */}
        <Circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={color} stroke={THEME.colors.card} strokeWidth="2" />
      </Svg>

      {showLabels ? (
        <View style={styles.labelsRow}>
          <Text style={styles.labelText}>Low: {formatCurrency(min, true)}</Text>
          <Text style={[styles.labelText, { color: color, fontWeight: '700' }]}>
            Current: {formatCurrency(data[data.length - 1], true)}
          </Text>
          <Text style={styles.labelText}>High: {formatCurrency(max, true)}</Text>
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
  },
  labelText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
});
