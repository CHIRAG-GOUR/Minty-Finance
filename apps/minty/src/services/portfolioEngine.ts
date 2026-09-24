import {
  StockHolding,
  MutualFundHolding,
  FixedDepositHolding,
  StockItem,
  MutualFundItem,
} from '../types';
import { findStock, instrumentKey } from './instrumentResolver';
import { isFiniteNumber, round, safePercent, toFiniteNumber } from '../utils/safeNumber';

export interface EnrichedStockHolding extends StockHolding {
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  returnPercent: number;
  dayPnL: number;
  weightPercent: number;
  /** False when the catalog has no live quote and cost basis was used instead. */
  hasLivePrice: boolean;
}

export interface EnrichedFundHolding extends MutualFundHolding {
  currentNav: number;
  currentValue: number;
  unrealizedPnL: number;
  returnPercent: number;
  weightPercent: number;
  hasLivePrice: boolean;
}

/** Single-position view used by the stock detail screen. */
export interface HoldingPosition {
  symbol: string | null;
  /** True only when a real position with a positive quantity exists. */
  isHeld: boolean;
  shares: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice: number | null;
  currentValue: number;
  unrealizedPnL: number;
  returnPercent: number;
  dayPnL: number;
  weightPercent: number;
  hasLivePrice: boolean;
}

export interface PortfolioAnalytics {
  totalPortfolioValue: number;
  totalInvestedAmount: number;
  totalUnrealizedPnL: number;
  totalReturnPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  availableCash: number;
  startingBalance: number;
  holdingsCount: number;
  allocation: {
    equitiesPercent: number;
    equitiesValue: number;
    fundsPercent: number;
    fundsValue: number;
    fdPercent: number;
    fdValue: number;
    cashPercent: number;
    cashValue: number;
  };
  enrichedStocks: EnrichedStockHolding[];
  enrichedFunds: EnrichedFundHolding[];
}

const EMPTY_POSITION: HoldingPosition = {
  symbol: null,
  isHeld: false,
  shares: 0,
  averageBuyPrice: 0,
  totalInvested: 0,
  currentPrice: null,
  currentValue: 0,
  unrealizedPnL: 0,
  returnPercent: 0,
  dayPnL: 0,
  weightPercent: 0,
  hasLivePrice: false,
};

function asArray<T>(value: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Portfolio maths lives here and nowhere else, so every screen reports the same
 * numbers. Every input is coerced: holdings come out of AsyncStorage and quotes
 * come off the network, so either can be partial, stale or malformed.
 */
export class PortfolioEngine {
  /**
   * Values a single holding against a live quote.
   * Returns a zeroed, `isHeld: false` position for a missing, zero-quantity or
   * malformed holding, so callers never have to null-check before rendering.
   */
  static calculateHolding(
    holding: StockHolding | null | undefined,
    stock: StockItem | null | undefined,
    totalPortfolioValue?: number
  ): HoldingPosition {
    const symbol = instrumentKey(holding) ?? instrumentKey(stock);

    const shares = toFiniteNumber(holding?.shares, 0);
    const averageBuyPrice = toFiniteNumber(holding?.averageBuyPrice, 0);
    // Trust a stored invested amount, but reconstruct it if it is missing.
    const storedInvested = toFiniteNumber(holding?.totalInvested, NaN);
    const totalInvested = Number.isFinite(storedInvested)
      ? storedInvested
      : round(shares * averageBuyPrice, 2);

    if (!holding || shares <= 0) {
      return { ...EMPTY_POSITION, symbol, currentPrice: this.livePrice(stock) };
    }

    const livePrice = this.livePrice(stock);
    const hasLivePrice = livePrice !== null;
    // With no quote, hold the position at cost rather than inventing a price.
    const effectivePrice = hasLivePrice ? livePrice : averageBuyPrice;

    const previousClose = isFiniteNumber(stock?.previousClose) && (stock?.previousClose ?? 0) > 0
      ? (stock as StockItem).previousClose
      : effectivePrice;

    const currentValue = round(shares * effectivePrice, 2);
    const unrealizedPnL = round(currentValue - totalInvested, 2);
    const returnPercent = totalInvested > 0 ? round(safePercent(unrealizedPnL, totalInvested), 2) : 0;
    const dayPnL = hasLivePrice ? round(shares * (effectivePrice - previousClose), 2) : 0;
    const weightPercent =
      isFiniteNumber(totalPortfolioValue) && totalPortfolioValue > 0
        ? round(safePercent(currentValue, totalPortfolioValue), 1)
        : round(toFiniteNumber(holding.weightPercent, 0), 1);

    return {
      symbol,
      isHeld: true,
      shares,
      averageBuyPrice,
      totalInvested,
      currentPrice: livePrice,
      currentValue,
      unrealizedPnL,
      returnPercent,
      dayPnL,
      weightPercent,
      hasLivePrice,
    };
  }

  /** Unrealized profit or loss for a position, in rupees. */
  static calculateUnrealizedPnL(
    holding: StockHolding | null | undefined,
    stock: StockItem | null | undefined
  ): number {
    return this.calculateHolding(holding, stock).unrealizedPnL;
  }

  /** Return on a position as a percentage of the amount invested. */
  static calculateReturn(
    holding: StockHolding | null | undefined,
    stock: StockItem | null | undefined
  ): number {
    return this.calculateHolding(holding, stock).returnPercent;
  }

  /** A usable last-traded price, or null when the instrument is unpriced. */
  private static livePrice(stock: StockItem | null | undefined): number | null {
    if (!stock) return null;
    const p = stock.currentPrice;
    return isFiniteNumber(p) && p > 0 ? p : null;
  }

  static evaluatePortfolio(
    cashBalance: number,
    startingBalance: number,
    stockHoldings: readonly StockHolding[] | null | undefined,
    fundHoldings: readonly MutualFundHolding[] | null | undefined,
    fdHoldings: readonly FixedDepositHolding[] | null | undefined,
    stockCatalog: readonly StockItem[] | null | undefined,
    fundCatalog: readonly MutualFundItem[] | null | undefined
  ): PortfolioAnalytics {
    const cash = toFiniteNumber(cashBalance, 0);
    const opening = toFiniteNumber(startingBalance, cash);

    let totalStocksValue = 0;
    let totalStocksInvested = 0;
    let totalStocksDayPnL = 0;

    const enrichedStocks: EnrichedStockHolding[] = [];
    for (const holding of asArray(stockHoldings)) {
      // A holding with no identity cannot be priced, sold or navigated to.
      if (!holding || !instrumentKey(holding)) continue;

      const stock = findStock(stockCatalog, holding);
      const position = this.calculateHolding(holding, stock);
      if (!position.isHeld) continue;

      totalStocksValue += position.currentValue;
      totalStocksInvested += position.totalInvested;
      totalStocksDayPnL += position.dayPnL;

      enrichedStocks.push({
        ...holding,
        symbol: position.symbol ?? holding.symbol,
        name: holding.name || position.symbol || 'Unknown',
        shares: position.shares,
        averageBuyPrice: position.averageBuyPrice,
        totalInvested: position.totalInvested,
        category: holding.category || 'Equity',
        currentPrice: position.currentPrice ?? position.averageBuyPrice,
        currentValue: position.currentValue,
        unrealizedPnL: position.unrealizedPnL,
        returnPercent: position.returnPercent,
        dayPnL: position.dayPnL,
        weightPercent: 0, // filled in once the portfolio total is known
        hasLivePrice: position.hasLivePrice,
      });
    }

    let totalFundsValue = 0;
    let totalFundsInvested = 0;

    const enrichedFunds: EnrichedFundHolding[] = [];
    for (const holding of asArray(fundHoldings)) {
      if (!holding || typeof holding.id !== 'string') continue;

      const fund = asArray(fundCatalog).find(
        (f) => f && (f.id === holding.id || f.name === holding.name)
      );
      const liveNav = fund && isFiniteNumber(fund.nav) && fund.nav > 0 ? fund.nav : null;
      const averageNav = toFiniteNumber(holding.averageNav, 0);
      const currentNav = liveNav ?? averageNav;

      const units = toFiniteNumber(holding.units, 0);
      if (units <= 0) continue;

      const storedInvested = toFiniteNumber(holding.totalInvested, NaN);
      const totalInvested = Number.isFinite(storedInvested)
        ? storedInvested
        : round(units * averageNav, 2);

      const currentValue = round(units * currentNav, 2);
      const unrealizedPnL = round(currentValue - totalInvested, 2);
      const returnPercent =
        totalInvested > 0 ? round(safePercent(unrealizedPnL, totalInvested), 2) : 0;

      totalFundsValue += currentValue;
      totalFundsInvested += totalInvested;

      enrichedFunds.push({
        ...holding,
        units,
        averageNav,
        totalInvested,
        currentNav,
        currentValue,
        unrealizedPnL,
        returnPercent,
        weightPercent: 0,
        hasLivePrice: liveNav !== null,
      });
    }

    let totalFDValue = 0;
    let totalFDInvested = 0;
    for (const fd of asArray(fdHoldings)) {
      if (!fd) continue;
      const principal = toFiniteNumber(fd.principal, 0);
      const earned = toFiniteNumber(fd.earnedInterest, 0);
      totalFDInvested += principal;
      totalFDValue += principal + earned;
    }

    const totalInvestedAmount = round(
      totalStocksInvested + totalFundsInvested + totalFDInvested,
      2
    );
    const totalAssetsValue = totalStocksValue + totalFundsValue + totalFDValue;
    const totalPortfolioValue = round(cash + totalAssetsValue, 2);
    const totalUnrealizedPnL = round(totalAssetsValue - totalInvestedAmount, 2);
    const totalReturnPercent =
      totalInvestedAmount > 0 ? round(safePercent(totalUnrealizedPnL, totalInvestedAmount), 2) : 0;

    const todayPnL = round(totalStocksDayPnL, 2);
    const openingValue = totalPortfolioValue - todayPnL;
    const todayPnLPercent = openingValue > 0 ? round(safePercent(todayPnL, openingValue), 2) : 0;

    if (totalPortfolioValue > 0) {
      for (const s of enrichedStocks) {
        s.weightPercent = round(safePercent(s.currentValue, totalPortfolioValue), 1);
      }
      for (const f of enrichedFunds) {
        f.weightPercent = round(safePercent(f.currentValue, totalPortfolioValue), 1);
      }
    }

    const pct = (part: number) =>
      totalPortfolioValue > 0 ? round(safePercent(part, totalPortfolioValue), 1) : 0;

    return {
      totalPortfolioValue,
      totalInvestedAmount,
      totalUnrealizedPnL,
      totalReturnPercent,
      todayPnL,
      todayPnLPercent,
      availableCash: cash,
      startingBalance: opening,
      holdingsCount: enrichedStocks.length + enrichedFunds.length + asArray(fdHoldings).length,
      allocation: {
        equitiesPercent: pct(totalStocksValue),
        equitiesValue: round(totalStocksValue, 2),
        fundsPercent: pct(totalFundsValue),
        fundsValue: round(totalFundsValue, 2),
        fdPercent: pct(totalFDValue),
        fdValue: round(totalFDValue, 2),
        cashPercent: pct(cash),
        cashValue: cash,
      },
      enrichedStocks,
      enrichedFunds,
    };
  }
}
