import {
  StockItem,
  StockHolding,
  VirtualWallet,
  Transaction,
  SimulatedChargeBreakdown,
} from '../types';

export interface OrderValidationResult {
  isValid: boolean;
  errorMessage?: string;
  grossValue: number;
  charges: SimulatedChargeBreakdown;
  netTotal: number;
}

export interface OrderExecutionResult {
  success: boolean;
  orderId: string;
  updatedWallet: VirtualWallet;
  updatedHoldings: StockHolding[];
  transaction: Transaction;
  charges: SimulatedChargeBreakdown;
  message: string;
}

export class VirtualOrderEngine {
  /**
   * Calculates realistic statutory simulated charges
   */
  static calculateCharges(grossValue: number, isBuy: boolean): SimulatedChargeBreakdown {
    const brokerage = 0.0;
    const stt = parseFloat((grossValue * 0.001).toFixed(2)); // 0.1% STT on equity delivery
    const exchangeTurnover = parseFloat((grossValue * 0.0000345).toFixed(2)); // 0.00345%
    const sebiTurnover = parseFloat((grossValue * 0.000001).toFixed(2));
    const stampDuty = isBuy ? parseFloat((grossValue * 0.00015).toFixed(2)) : 0.0; // 0.015%
    const gst = parseFloat(((exchangeTurnover + sebiTurnover) * 0.18).toFixed(2)); // 18% GST

    const totalCharges = parseFloat(
      (brokerage + stt + exchangeTurnover + sebiTurnover + stampDuty + gst).toFixed(2)
    );

    return {
      brokerage,
      stt,
      exchangeTurnover,
      sebiTurnover,
      stampDuty,
      gst,
      totalCharges,
    };
  }

  /**
   * Validates a virtual buy order against balance and share constraints
   */
  static validateBuy(
    stock: StockItem,
    shares: number,
    availableCash: number
  ): OrderValidationResult {
    if (!stock) {
      return {
        isValid: false,
        errorMessage: 'Invalid stock instrument selected.',
        grossValue: 0,
        charges: this.calculateCharges(0, true),
        netTotal: 0,
      };
    }

    if (!shares || shares <= 0 || !Number.isInteger(shares)) {
      return {
        isValid: false,
        errorMessage: 'Indian equities require whole-share quantities (e.g. 1, 5, 10 shares).',
        grossValue: 0,
        charges: this.calculateCharges(0, true),
        netTotal: 0,
      };
    }

    const grossValue = parseFloat((stock.currentPrice * shares).toFixed(2));
    const charges = this.calculateCharges(grossValue, true);
    const netTotal = parseFloat((grossValue + charges.totalCharges).toFixed(2));

    if (availableCash < netTotal) {
      return {
        isValid: false,
        errorMessage: `Insufficient virtual cash. Required ₹${netTotal.toLocaleString('en-IN')}, Available ₹${availableCash.toLocaleString('en-IN')}.`,
        grossValue,
        charges,
        netTotal,
      };
    }

    return {
      isValid: true,
      grossValue,
      charges,
      netTotal,
    };
  }

  /**
   * Validates a virtual sell order against current holding quantity
   */
  static validateSell(
    stock: StockItem,
    shares: number,
    holding?: StockHolding
  ): OrderValidationResult {
    if (!stock || !holding) {
      return {
        isValid: false,
        errorMessage: 'You do not own any shares of this company.',
        grossValue: 0,
        charges: this.calculateCharges(0, false),
        netTotal: 0,
      };
    }

    if (!shares || shares <= 0 || !Number.isInteger(shares)) {
      return {
        isValid: false,
        errorMessage: 'Specify a whole number of shares to sell.',
        grossValue: 0,
        charges: this.calculateCharges(0, false),
        netTotal: 0,
      };
    }

    if (holding.shares < shares) {
      return {
        isValid: false,
        errorMessage: `You only hold ${holding.shares} shares of ${stock.symbol}.`,
        grossValue: 0,
        charges: this.calculateCharges(0, false),
        netTotal: 0,
      };
    }

    const grossValue = parseFloat((stock.currentPrice * shares).toFixed(2));
    const charges = this.calculateCharges(grossValue, false);
    const netTotal = parseFloat((grossValue - charges.totalCharges).toFixed(2));

    return {
      isValid: true,
      grossValue,
      charges,
      netTotal,
    };
  }

  /**
   * Executes a virtual buy order
   */
  static executeBuy(
    userId: string,
    userName: string,
    stock: StockItem,
    shares: number,
    wallet: VirtualWallet,
    currentHoldings: StockHolding[]
  ): OrderExecutionResult {
    const validation = this.validateBuy(stock, shares, wallet.cashBalance);
    const orderId = `VORD-BUY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Order validation failed.');
    }

    const newCash = parseFloat((wallet.cashBalance - validation.netTotal).toFixed(2));
    const newWallet: VirtualWallet = {
      ...wallet,
      cashBalance: newCash,
      totalInvested: parseFloat((wallet.totalInvested + validation.netTotal).toFixed(2)),
    };

    let updatedHoldings = [...currentHoldings];
    const existingIndex = updatedHoldings.findIndex(
      (h) => h.symbol.toUpperCase() === stock.symbol.toUpperCase()
    );

    if (existingIndex >= 0) {
      const existing = updatedHoldings[existingIndex];
      const newShares = existing.shares + shares;
      const newInvested = parseFloat((existing.totalInvested + validation.netTotal).toFixed(2));
      const avgPrice = parseFloat((newInvested / newShares).toFixed(2));

      updatedHoldings[existingIndex] = {
        ...existing,
        shares: newShares,
        totalInvested: newInvested,
        averageBuyPrice: avgPrice,
      };
    } else {
      updatedHoldings.push({
        symbol: stock.symbol,
        name: stock.name,
        shares,
        averageBuyPrice: stock.currentPrice,
        totalInvested: validation.netTotal,
        category: stock.sector,
      });
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      userId,
      userName,
      type: 'buy_stock',
      title: `Bought ${shares} shares of ${stock.symbol}`,
      amount: validation.netTotal,
      timestamp: new Date().toISOString(),
      status: 'completed',
      orderId,
      symbol: stock.symbol,
      shares,
      executionPrice: stock.currentPrice,
      simulatedCharges: validation.charges,
      details: `Simulated order executed at live LTP ₹${stock.currentPrice.toLocaleString('en-IN')}. Statutory charges: ₹${validation.charges.totalCharges.toFixed(2)}`,
    };

    return {
      success: true,
      orderId,
      updatedWallet: newWallet,
      updatedHoldings,
      transaction: tx,
      charges: validation.charges,
      message: `Purchased ${shares} shares of ${stock.symbol} for ₹${validation.netTotal.toLocaleString('en-IN')}`,
    };
  }

  /**
   * Executes a virtual sell order
   */
  static executeSell(
    userId: string,
    userName: string,
    stock: StockItem,
    shares: number,
    wallet: VirtualWallet,
    currentHoldings: StockHolding[]
  ): OrderExecutionResult {
    const holdingIndex = currentHoldings.findIndex(
      (h) => h.symbol.toUpperCase() === stock.symbol.toUpperCase()
    );
    const holding = holdingIndex >= 0 ? currentHoldings[holdingIndex] : undefined;
    const validation = this.validateSell(stock, shares, holding);
    const orderId = `VORD-SELL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    if (!validation.isValid || !holding) {
      throw new Error(validation.errorMessage || 'Order validation failed.');
    }

    const netProceeds = validation.netTotal;
    const costBasisSold = (shares / holding.shares) * holding.totalInvested;
    const realizedPnL = parseFloat((netProceeds - costBasisSold).toFixed(2));

    const newCash = parseFloat((wallet.cashBalance + netProceeds).toFixed(2));
    const newWallet: VirtualWallet = {
      ...wallet,
      cashBalance: newCash,
      totalInvested: parseFloat(Math.max(0, wallet.totalInvested - costBasisSold).toFixed(2)),
    };

    let updatedHoldings = [...currentHoldings];
    if (holding.shares === shares) {
      updatedHoldings.splice(holdingIndex, 1);
    } else {
      const remainingShares = holding.shares - shares;
      const remainingInvested = parseFloat((holding.totalInvested - costBasisSold).toFixed(2));
      updatedHoldings[holdingIndex] = {
        ...holding,
        shares: remainingShares,
        totalInvested: remainingInvested,
      };
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      userId,
      userName,
      type: 'sell_stock',
      title: `Sold ${shares} shares of ${stock.symbol}`,
      amount: netProceeds,
      timestamp: new Date().toISOString(),
      status: 'completed',
      orderId,
      symbol: stock.symbol,
      shares,
      executionPrice: stock.currentPrice,
      simulatedCharges: validation.charges,
      details: `Sold at live LTP ₹${stock.currentPrice.toLocaleString('en-IN')}. Realized P&L: ${realizedPnL >= 0 ? '+' : ''}₹${realizedPnL.toLocaleString('en-IN')}`,
    };

    return {
      success: true,
      orderId,
      updatedWallet: newWallet,
      updatedHoldings,
      transaction: tx,
      charges: validation.charges,
      message: `Sold ${shares} shares of ${stock.symbol}. Received ₹${netProceeds.toLocaleString('en-IN')} virtual cash.`,
    };
  }
}
