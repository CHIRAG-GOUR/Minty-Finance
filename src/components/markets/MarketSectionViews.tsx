import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { THEME } from '../../constants/theme';
import { Icon } from '../../constants/icons';
import { StockItem } from '../../types';
import {
  formatCompactNumber,
  formatCurrencyOrDash,
  formatPercentage,
  toWidthPercent,
} from '../../utils/formatters';
import { clamp, toFiniteNumber } from '../../utils/safeNumber';
import { MarketSectionState } from '../../hooks/useMarketSection';

export const POSITIVE = '#00A86B';
export const NEGATIVE = '#EB5757';

export function moveColor(change: unknown): string {
  return toFiniteNumber(change, 0) >= 0 ? POSITIVE : NEGATIVE;
}

// ---------------------------------------------------------------------------
// Section shell
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  onViewAll,
  viewAllLabel = 'View all',
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderText}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.sectionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {onViewAll ? (
      <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} accessibilityRole="button">
        <Text style={styles.viewAllText}>{viewAllLabel}</Text>
        <Icon name="chevron-right" size={12} color={THEME.colors.primaryDark} />
      </TouchableOpacity>
    ) : null}
  </View>
);

/** Skeleton rows so a loading section reads as intentional, not broken. */
export const SectionSkeleton: React.FC<{ rows?: number; height?: number }> = ({
  rows = 3,
  height = 52,
}) => (
  <View style={styles.skeletonWrap}>
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={[styles.skeletonRow, { height, opacity: 1 - i * 0.22 }]} />
    ))}
  </View>
);

/**
 * Renders the non-success states of a section uniformly: loading skeleton,
 * an honest "not available from this feed" note, an empty result, or a
 * retryable failure. Returns null when there is data to draw.
 */
export function SectionStateView<T>({
  state,
  skeletonRows = 3,
  emptyLabel = 'No data available right now.',
}: {
  state: MarketSectionState<T>;
  skeletonRows?: number;
  emptyLabel?: string;
}): React.ReactElement | null {
  if (state.phase === 'ok') return null;

  if (state.phase === 'loading') return <SectionSkeleton rows={skeletonRows} />;

  if (state.phase === 'unavailable') {
    return (
      <View style={styles.noticePanel}>
        <View style={styles.noticeIcon}>
          <Icon name="info" size={15} color={THEME.colors.secondaryDark} />
        </View>
        <View style={styles.noticeTextCol}>
          <Text style={styles.noticeTitle}>Not available yet</Text>
          <Text style={styles.noticeBody}>{state.reason ?? emptyLabel}</Text>
        </View>
      </View>
    );
  }

  if (state.phase === 'error') {
    return (
      <View style={styles.errorPanel}>
        <Text style={styles.errorText}>{state.reason ?? 'Unable to load this section.'}</Text>
        <TouchableOpacity onPress={state.retry} style={styles.retryBtn} accessibilityRole="button">
          <Icon name="refresh" size={12} color={THEME.colors.textInverse} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyText}>{emptyLabel}</Text>
    </View>
  );
}

/** Small tappable explainer used to keep the educational layer light. */
export const LearnChip: React.FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} style={styles.learnChip} accessibilityRole="button">
    <Icon name="lightbulb" size={11} color={THEME.colors.amberDark} />
    <Text style={styles.learnChipText} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Layout A — numbered ranked row (Top Movers)
// ---------------------------------------------------------------------------

export const RankedRow: React.FC<{
  rank: number;
  stock: StockItem;
  onPress: () => void;
  trailing?: ReactNode;
}> = ({ rank, stock, onPress, trailing }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={styles.rankedRow}
    accessibilityRole="button"
    accessibilityLabel={`${stock.name}, ${formatPercentage(stock.changePercent)}`}
  >
    <Text style={styles.rankNumber}>{rank}</Text>
    <View style={styles.rankedTextCol}>
      <Text style={styles.rankedSymbol} numberOfLines={1}>
        {stock.symbol}
      </Text>
      <Text style={styles.rankedName} numberOfLines={1}>
        {stock.name}
      </Text>
    </View>
    {trailing ?? (
      <View style={styles.rankedRight}>
        <Text style={styles.rankedPrice} numberOfLines={1}>
          {formatCurrencyOrDash(stock.currentPrice, true)}
        </Text>
        <Text
          style={[styles.rankedChange, { color: moveColor(stock.changePercent) }]}
          numberOfLines={1}
        >
          {formatPercentage(stock.changePercent, true, 2)}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Layout B — metric bar row (Volume Shockers)
// ---------------------------------------------------------------------------

export const MetricBarRow: React.FC<{
  stock: StockItem;
  /** 0-1 fill fraction. */
  fill: number;
  headline: string;
  caption: string;
  onPress: () => void;
}> = ({ stock, fill, headline, caption, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={styles.barRow}
    accessibilityRole="button"
  >
    <View style={styles.barRowTop}>
      <View style={styles.barRowTextCol}>
        <Text style={styles.rankedSymbol} numberOfLines={1}>
          {stock.symbol}
        </Text>
        <Text style={styles.rankedName} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <View style={styles.barRowRight}>
        <Text style={styles.barHeadline}>{headline}</Text>
        <Text
          style={[styles.rankedChange, { color: moveColor(stock.changePercent) }]}
          numberOfLines={1}
        >
          {formatPercentage(stock.changePercent, true, 2)}
        </Text>
      </View>
    </View>
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: toWidthPercent(clamp(fill, 0, 1) * 100), backgroundColor: THEME.colors.amber },
        ]}
      />
    </View>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Layout C — compact rail tile (Top Intraday)
// ---------------------------------------------------------------------------

export const RailTile: React.FC<{
  stock: StockItem;
  metricLabel: string;
  metricValue: string;
  onPress: () => void;
}> = ({ stock, metricLabel, metricValue, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={styles.railTile}
    accessibilityRole="button"
  >
    <Text style={styles.railSymbol} numberOfLines={1}>
      {stock.symbol}
    </Text>
    <Text style={styles.railName} numberOfLines={1}>
      {stock.name}
    </Text>
    <Text style={styles.railPrice} numberOfLines={1}>
      {formatCurrencyOrDash(stock.currentPrice, true)}
    </Text>
    <View style={[styles.railPill, { backgroundColor: `${moveColor(stock.changePercent)}1A` }]}>
      <Text style={[styles.railPillText, { color: moveColor(stock.changePercent) }]}>
        {formatPercentage(stock.changePercent, true, 2)}
      </Text>
    </View>
    <View style={styles.railMetricRow}>
      <Text style={styles.railMetricLabel} numberOfLines={1}>
        {metricLabel}
      </Text>
      <Text style={styles.railMetricValue} numberOfLines={1}>
        {metricValue}
      </Text>
    </View>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Layout D — heatmap cell (Sectors)
// ---------------------------------------------------------------------------

/** Colour intensity scales with the size of the move, capped at ±3%. */
export function heatColor(changePercent: number): string {
  const magnitude = clamp(Math.abs(changePercent) / 3, 0.12, 1);
  const alpha = Math.round(magnitude * 255)
    .toString(16)
    .padStart(2, '0');
  return `${changePercent >= 0 ? POSITIVE : NEGATIVE}${alpha}`;
}

export const HeatCell: React.FC<{
  label: string;
  changePercent: number;
  advancing: number;
  declining: number;
  onPress: () => void;
}> = ({ label, changePercent, advancing, declining, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.heatCell, { backgroundColor: heatColor(changePercent) }]}
    accessibilityRole="button"
    accessibilityLabel={`${label}, ${formatPercentage(changePercent)}, ${advancing} advancing, ${declining} declining`}
  >
    <Text style={styles.heatLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.heatChange} numberOfLines={1}>
      {formatPercentage(changePercent, true, 2)}
    </Text>
    <Text style={styles.heatBreadth} numberOfLines={1}>
      {advancing} up · {declining} down
    </Text>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Layout E — breadth panel (Market snapshot)
// ---------------------------------------------------------------------------

export const BreadthPanel: React.FC<{
  advancing: number;
  declining: number;
  unchanged: number;
  totalVolume: number;
}> = ({ advancing, declining, unchanged, totalVolume }) => {
  const total = Math.max(1, advancing + declining + unchanged);
  return (
    <View style={styles.breadthPanel}>
      <View style={styles.breadthTop}>
        <View>
          <Text style={styles.breadthLabel}>Market breadth</Text>
          <Text style={styles.breadthHeadline}>
            {advancing} advancing · {declining} declining
          </Text>
        </View>
        <View style={styles.breadthVolumeCol}>
          <Text style={styles.breadthLabel}>Volume traded</Text>
          <Text style={styles.breadthVolume}>{formatCompactNumber(totalVolume)}</Text>
        </View>
      </View>

      <View style={styles.breadthBar}>
        <View
          style={[
            styles.breadthSegment,
            { width: toWidthPercent((advancing / total) * 100), backgroundColor: POSITIVE },
          ]}
        />
        <View
          style={[
            styles.breadthSegment,
            { width: toWidthPercent((unchanged / total) * 100), backgroundColor: THEME.colors.cardBorder },
          ]}
        />
        <View
          style={[
            styles.breadthSegment,
            { width: toWidthPercent((declining / total) * 100), backgroundColor: NEGATIVE },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  sectionHeaderText: { flex: 1, minWidth: 0 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0, paddingVertical: 2 },
  viewAllText: { fontSize: 12, fontWeight: '800', color: THEME.colors.primaryDark },

  skeletonWrap: { gap: 8 },
  skeletonRow: {
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.backgroundSecondary,
  },

  noticePanel: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: THEME.colors.secondarySurface,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: '#BEE3F8',
    padding: 12,
  },
  noticeIcon: { marginTop: 1, flexShrink: 0 },
  noticeTextCol: { flex: 1, minWidth: 0, gap: 2 },
  noticeTitle: { fontSize: 12, fontWeight: '800', color: THEME.colors.secondaryDark },
  noticeBody: { fontSize: 11, lineHeight: 16, color: THEME.colors.textSecondary },

  errorPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: THEME.colors.coralSurface,
    borderRadius: THEME.radii.lg,
    padding: 12,
  },
  errorText: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: '600', color: THEME.colors.coral },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.obsidian,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.radii.pill,
    flexShrink: 0,
  },
  retryText: { fontSize: 11, fontWeight: '800', color: THEME.colors.textInverse },

  emptyPanel: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderRadius: THEME.radii.lg,
    padding: 14,
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, fontWeight: '600', color: THEME.colors.textMuted, textAlign: 'center' },

  learnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.amberSurface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.radii.pill,
    maxWidth: '100%',
  },
  learnChipText: { fontSize: 10, fontWeight: '800', color: THEME.colors.amberDark, flexShrink: 1 },

  rankedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorderSubtle,
  },
  rankNumber: {
    width: 20,
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.textMuted,
    flexShrink: 0,
  },
  rankedTextCol: { flex: 1, minWidth: 0 },
  rankedSymbol: { fontSize: 13, fontWeight: '800', color: THEME.colors.textPrimary },
  rankedName: { fontSize: 11, color: THEME.colors.textMuted, marginTop: 1 },
  rankedRight: { alignItems: 'flex-end', flexShrink: 0, maxWidth: '40%' },
  rankedPrice: { fontSize: 13, fontWeight: '800', color: THEME.colors.textPrimary },
  rankedChange: { fontSize: 11, fontWeight: '800', marginTop: 1 },

  barRow: { paddingVertical: 10, gap: 7 },
  barRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barRowTextCol: { flex: 1, minWidth: 0 },
  barRowRight: { alignItems: 'flex-end', flexShrink: 0 },
  barHeadline: { fontSize: 13, fontWeight: '900', color: THEME.colors.amberDark },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.backgroundSecondary,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },

  railTile: {
    width: 150,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    gap: 3,
  },
  railSymbol: { fontSize: 13, fontWeight: '900', color: THEME.colors.textPrimary },
  railName: { fontSize: 10, color: THEME.colors.textMuted },
  railPrice: { fontSize: 15, fontWeight: '900', color: THEME.colors.textPrimary, marginTop: 4 },
  railPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: THEME.radii.pill,
    marginTop: 2,
  },
  railPillText: { fontSize: 11, fontWeight: '800' },
  railMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorderSubtle,
  },
  railMetricLabel: { fontSize: 10, color: THEME.colors.textMuted, flexShrink: 1 },
  railMetricValue: { fontSize: 11, fontWeight: '800', color: THEME.colors.textPrimary },

  heatCell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    borderRadius: THEME.radii.md,
    padding: 10,
    gap: 2,
  },
  heatLabel: { fontSize: 11, fontWeight: '800', color: THEME.colors.textPrimary },
  heatChange: { fontSize: 14, fontWeight: '900', color: THEME.colors.textPrimary },
  heatBreadth: { fontSize: 9, fontWeight: '600', color: THEME.colors.textSecondary },

  breadthPanel: {
    backgroundColor: THEME.colors.obsidian,
    borderRadius: THEME.radii.xl,
    padding: 16,
    gap: 12,
  },
  breadthTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  breadthLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.3 },
  breadthHeadline: { fontSize: 15, fontWeight: '900', color: '#FFFFFF', marginTop: 3 },
  breadthVolumeCol: { alignItems: 'flex-end', flexShrink: 0 },
  breadthVolume: { fontSize: 15, fontWeight: '900', color: THEME.colors.accentYellow, marginTop: 3 },
  breadthBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  breadthSegment: { height: '100%' },
});
