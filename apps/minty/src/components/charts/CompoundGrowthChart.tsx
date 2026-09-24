import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { THEME } from '../../constants/theme';
import { CompoundGrowthPoint } from '../../utils/financialMath';
import { formatCompactCurrency } from '../../utils/formatters';

interface CompoundGrowthChartProps {
  data: CompoundGrowthPoint[];
  height?: number;
}

export const CompoundGrowthChart: React.FC<CompoundGrowthChartProps> = ({
  data,
  height = 180,
}) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.futureValue), 1000);
  const chartWidth = 320;
  const paddingVertical = 16;
  const chartHeight = height - paddingVertical * 2;
  const stepX = chartWidth / (data.length - 1 || 1);

  // Future Value points (green exponential)
  const fvPoints = data.map((d, index) => ({
    x: index * stepX,
    y: paddingVertical + chartHeight - (d.futureValue / maxVal) * chartHeight,
  }));

  // Deposit points (blue linear)
  const depositPoints = data.map((d, index) => ({
    x: index * stepX,
    y: paddingVertical + chartHeight - (d.totalDeposits / maxVal) * chartHeight,
  }));

  const fvPathD = fvPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const depositPathD = depositPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const fvAreaD = `${fvPathD} L ${fvPoints[fvPoints.length - 1].x} ${height} L ${fvPoints[0].x} ${height} Z`;

  const lastFV = fvPoints[fvPoints.length - 1];
  const lastDeposit = depositPoints[depositPoints.length - 1];

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.primary }]} />
          <Text style={styles.legendText}>Total Wealth (Compounded)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.secondary }]} />
          <Text style={styles.legendText}>Total Deposits</Text>
        </View>
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
        <Defs>
          <LinearGradient id="fvGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={THEME.colors.primary} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={THEME.colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
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

        {/* Compound Wealth Fill Area */}
        <Path d={fvAreaD} fill="url(#fvGradient)" />

        {/* Deposit line (Secondary blue) */}
        <Path
          d={depositPathD}
          fill="none"
          stroke={THEME.colors.secondary}
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />

        {/* Compound Wealth line (Primary green) */}
        <Path
          d={fvPathD}
          fill="none"
          stroke={THEME.colors.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots on end values */}
        <Circle cx={lastDeposit.x} cy={lastDeposit.y} r="4" fill={THEME.colors.secondary} />
        <Circle
          cx={lastFV.x}
          cy={lastFV.y}
          r="5"
          fill={THEME.colors.primary}
          stroke={THEME.colors.card}
          strokeWidth="2"
        />
      </Svg>

      {/* Year labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.yearLabel}>Yr 1</Text>
        <Text style={styles.yearLabel}>
          Yr {Math.round(data.length / 2)}
        </Text>
        <Text style={[styles.yearLabel, { fontWeight: '700', color: THEME.colors.primary }]}>
          Yr {data[data.length - 1]?.year || data.length} ({formatCompactCurrency(data[data.length - 1]?.futureValue || 0)})
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  yearLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
});
