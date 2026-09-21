import {
  StockHolding,
  MutualFundHolding,
  FixedDepositHolding,
  StockItem,
  MutualFundItem,
} from '../types';

export interface EnrichedStockHolding extends StockHolding {
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  returnPercent: number;
  dayPnL: number;
  weightPercent: number;
}

export interface EnrichedFundHolding extends MutualFundHolding {
  currentNav: number;
  currentValue: number;
  unrealizedPnL: number;
  returnPercent: number;
  weightPercent: number;
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

export class PortfolioEngine {
  static evaluatePortfolio(
    cashBalance: number,
    startingBalance: number,
    stockHoldings: StockHolding[],
    fundHoldings: MutualFundHolding[],
    fdHoldings: FixedDepositHolding[],
    stockCatalog: StockItem[],
    fundCatalog: MutualFundItem[]
  ): PortfolioAnalytics {
    let totalStocksValue = 0;
    let totalStocksInvested = 0;
    let totalStocksDayPnL = 0;

    const enrichedStocks: EnrichedStockHolding[] = stockHoldings.map((holding) => {
      const stock = stockCatalog.find(
        (s) => s.symbol.toUpperCase() === holding.symbol.toUpperCase()
      );
      const currentPrice = stock ? stock.currentPrice : holding.averageBuyPrice;
      const prevClose = stock ? stock.previousClose : currentPrice;
      const currentValue = parseFloat((holding.shares * currentPrice).toFixed(2));
      const unrealizedPnL = parseFloat((currentValue - holding.totalInvested).toFixed(2));
      const returnPercent =
        holding.totalInvested > 0
          ? parseFloat(((unrealizedPnL / holding.totalInvested) * 100).toFixed(2))
          : 0;
      const dayPnL = parseFloat((holding.shares * (currentPrice - prevClose)).toFixed(2));

      totalStocksValue += currentValue;
      totalStocksInvested += holding.totalInvested;
      totalStocksDayPnL += dayPnL;

      return {
        ...holding,
        currentPrice,
        currentValue,
        unrealizedPnL,
        returnPercent,
        dayPnL,
        weightPercent: 0, // calculated below once total value is known
      };
    });

    let totalFundsValue = 0;
    let totalFundsInvested = 0;

    const enrichedFunds: EnrichedFundHolding[] = fundHoldings.map((holding) => {
      const fund = fundCatalog.find((f) => f.id === holding.id || f.name === holding.name);
      const currentNav = fund ? fund.nav : holding.averageNav;
      const currentValue = parseFloat((holding.units * currentNav).toFixed(2));
      const unrealizedPnL = parseFloat((currentValue - holding.totalInvested).toFixed(2));
      const returnPercent =
        holding.totalInvested > 0
          ? parseFloat(((unrealizedPnL / holding.totalInvested) * 100).toFixed(2))
          : 0;

      totalFundsValue += currentValue;
      totalFundsInvested += holding.totalInvested;

      return {
        ...holding,
        currentNav,
        currentValue,
        unrealizedPnL,
        returnPercent,
        weightPercent: 0,
      };
    });

    const totalFDValue = fdHoldings.reduce((sum, fd) => sum + fd.principal + fd.earnedInterest, 0);
    const totalFDInvested = fdHoldings.reduce((sum, fd) => sum + fd.principal, 0);

    const totalInvestedAmount = parseFloat(
      (totalStocksInvested + totalFundsInvested + totalFDInvested).toFixed(2)
    );
    const totalPortfolioValue = parseFloat(
      (cashBalance + totalStocksValue + totalFundsValue + totalFDValue).toFixed(2)
    );

    const totalUnrealizedPnL = parseFloat(
      (totalStocksValue + totalFundsValue + totalFDValue - totalInvestedAmount).toFixed(2)
    );

    const totalReturnPercent =
      totalInvestedAmount > 0
        ? parseFloat(((totalUnrealizedPnL / totalInvestedAmount) * 100).toFixed(2))
        : 0;

    const todayPnL = parseFloat(totalStocksDayPnL.toFixed(2));
    const todayPnLPercent =
      totalPortfolioValue > 0
        ? parseFloat(((todayPnL / (totalPortfolioValue - todayPnL)) * 100).toFixed(2))
        : 0;

    // Compute weights
    if (totalPortfolioValue > 0) {
      enrichedStocks.forEach((s) => {
        s.weightPercent = parseFloat(((s.currentValue / totalPortfolioValue) * 100).toFixed(1));
      });
      enrichedFunds.forEach((f) => {
        f.weightPercent = parseFloat(((f.currentValue / totalPortfolioValue) * 100).toFixed(1));
      });
    }

    const allocation = {
      equitiesPercent:
        totalPortfolioValue > 0
          ? parseFloat(((totalStocksValue / totalPortfolioValue) * 100).toFixed(1))
          : 0,
      equitiesValue: totalStocksValue,
      fundsPercent:
        totalPortfolioValue > 0
          ? parseFloat(((totalFundsValue / totalPortfolioValue) * 100).toFixed(1))
          : 0,
      fundsValue: totalFundsValue,
      fdPercent:
        totalPortfolioValue > 0
          ? parseFloat(((totalFDValue / totalPortfolioValue) * 100).toFixed(1))
          : 0,
      fdValue: totalFDValue,
      cashPercent:
        totalPortfolioValue > 0
          ? parseFloat(((cashBalance / totalPortfolioValue) * 100).toFixed(1))
          : 0,
      cashValue: cashBalance,
    };

    return {
      totalPortfolioValue,
      totalInvestedAmount,
      totalUnrealizedPnL,
      totalReturnPercent,
      todayPnL,
      todayPnLPercent,
      availableCash: cashBalance,
      startingBalance,
      holdingsCount: stockHoldings.length + fundHoldings.length + fdHoldings.length,
      allocation,
      enrichedStocks,
      enrichedFunds,
    };
  }
}
