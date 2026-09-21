import { StockHolding, MutualFundHolding, FixedDepositHolding, StockItem, MutualFundItem } from '../types';

export interface CompoundGrowthPoint {
  year: number;
  totalDeposits: number;
  futureValue: number;
  interestEarned: number;
}

export interface CompoundGrowthResult {
  finalValue: number;
  totalInvested: number;
  totalInterest: number;
  yearlyBreakdown: CompoundGrowthPoint[];
  ruleOf72Years: number;
}

/**
 * Calculates compound growth for an initial amount with regular monthly contributions.
 * Formula:
 * FV = P * (1 + r/n)^(n*t) + PMT * [ ((1 + r/n)^(n*t) - 1) / (r/n) ]
 */
export function calculateCompoundGrowth(
  initialAmount: number,
  monthlyContribution: number,
  annualInterestRatePercent: number,
  durationYears: number
): CompoundGrowthResult {
  const r = annualInterestRatePercent / 100;
  const n = 12; // monthly compounding
  const monthlyRate = r / n;
  const totalMonths = durationYears * 12;

  const yearlyBreakdown: CompoundGrowthPoint[] = [];

  for (let y = 1; y <= durationYears; y++) {
    const months = y * 12;
    const compoundInitial = initialAmount * Math.pow(1 + monthlyRate, months);
    let compoundMonthly = 0;
    if (monthlyRate > 0) {
      compoundMonthly = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      compoundMonthly = monthlyContribution * months;
    }
    const fv = compoundInitial + compoundMonthly;
    const deposits = initialAmount + monthlyContribution * months;
    const interest = Math.max(0, fv - deposits);

    yearlyBreakdown.push({
      year: y,
      totalDeposits: Math.round(deposits),
      futureValue: Math.round(fv),
      interestEarned: Math.round(interest),
    });
  }

  const finalBreakdown = yearlyBreakdown[yearlyBreakdown.length - 1] || {
    futureValue: initialAmount,
    totalDeposits: initialAmount,
    interestEarned: 0,
    year: durationYears,
  };

  const ruleOf72Years = annualInterestRatePercent > 0 ? parseFloat((72 / annualInterestRatePercent).toFixed(1)) : 0;

  return {
    finalValue: finalBreakdown.futureValue,
    totalInvested: finalBreakdown.totalDeposits,
    totalInterest: finalBreakdown.interestEarned,
    yearlyBreakdown,
    ruleOf72Years,
  };
}

/**
 * Calculates simple interest.
 * SI = (P * R * T) / 100
 */
export function calculateSimpleInterest(principal: number, annualRatePercent: number, durationMonths: number): number {
  const timeYears = durationMonths / 12;
  return Math.round((principal * annualRatePercent * timeYears) / 100);
}

/**
 * Calculates fixed deposit maturity with quarterly compounding (standard banking practice).
 * A = P * (1 + r/4)^(4*t)
 */
export function calculateFDMaturity(principal: number, annualRatePercent: number, durationMonths: number): {
  maturityAmount: number;
  earnedInterest: number;
} {
  const r = annualRatePercent / 100;
  const t = durationMonths / 12;
  const n = 4; // quarterly compounding
  const maturityAmount = Math.round(principal * Math.pow(1 + r / n, n * t));
  const earnedInterest = maturityAmount - principal;

  return {
    maturityAmount,
    earnedInterest: Math.max(0, earnedInterest),
  };
}

/**
 * Computes the total portfolio valuation and profit/loss.
 */
export function calculatePortfolioValue(
  cashBalance: number,
  stockHoldings: StockHolding[],
  fundHoldings: MutualFundHolding[],
  fdHoldings: FixedDepositHolding[],
  stockCatalog: StockItem[],
  fundCatalog: MutualFundItem[]
): {
  totalPortfolioValue: number;
  totalInvestedCapital: number;
  totalProfitLossAmount: number;
  totalProfitLossPercent: number;
  stockValue: number;
  fundValue: number;
  fdValue: number;
  cashValue: number;
} {
  // Stock current values
  let stockValue = 0;
  let stockInvested = 0;
  stockHoldings.forEach((h) => {
    const stock = stockCatalog.find((s) => s.symbol === h.symbol);
    const currentPrice = stock ? stock.currentPrice : h.averageBuyPrice;
    stockValue += h.shares * currentPrice;
    stockInvested += h.totalInvested;
  });

  // Mutual Fund current values
  let fundValue = 0;
  let fundInvested = 0;
  fundHoldings.forEach((h) => {
    const fund = fundCatalog.find((f) => f.id === h.id);
    const currentNav = fund ? fund.nav : h.averageNav;
    fundValue += h.units * currentNav;
    fundInvested += h.totalInvested;
  });

  // Fixed Deposits
  let fdValue = 0;
  let fdInvested = 0;
  fdHoldings.forEach((fd) => {
    fdInvested += fd.principal;
    fdValue += fd.maturityAmount;
  });

  const totalInvestedCapital = stockInvested + fundInvested + fdInvested;
  const totalInvestedAssetsValue = stockValue + fundValue + fdValue;
  const totalPortfolioValue = Math.round(cashBalance + totalInvestedAssetsValue);

  const totalProfitLossAmount = Math.round(totalInvestedAssetsValue - totalInvestedCapital);
  const totalProfitLossPercent =
    totalInvestedCapital > 0
      ? parseFloat(((totalProfitLossAmount / totalInvestedCapital) * 100).toFixed(2))
      : 0;

  return {
    totalPortfolioValue,
    totalInvestedCapital: Math.round(totalInvestedCapital),
    totalProfitLossAmount,
    totalProfitLossPercent,
    stockValue: Math.round(stockValue),
    fundValue: Math.round(fundValue),
    fdValue: Math.round(fdValue),
    cashValue: Math.round(cashBalance),
  };
}

/**
 * Calculates profit/loss for a single asset holding.
 */
export function calculateProfitLoss(currentValue: number, investedAmount: number): {
  profitLossAmount: number;
  profitLossPercent: number;
  isPositive: boolean;
} {
  const profitLossAmount = currentValue - investedAmount;
  const profitLossPercent = investedAmount > 0 ? (profitLossAmount / investedAmount) * 100 : 0;
  return {
    profitLossAmount: Math.round(profitLossAmount * 100) / 100,
    profitLossPercent: Math.round(profitLossPercent * 100) / 100,
    isPositive: profitLossAmount >= 0,
  };
}

/**
 * Calculates student's savings rate percentage based on income and expenses.
 */
export function calculateSavingsRate(monthlyIncome: number, totalExpenses: number): {
  savingsAmount: number;
  savingsRatePercent: number;
  status: 'excellent' | 'good' | 'moderate' | 'low';
} {
  if (monthlyIncome <= 0) {
    return { savingsAmount: 0, savingsRatePercent: 0, status: 'low' };
  }
  const savingsAmount = Math.max(0, monthlyIncome - totalExpenses);
  const savingsRatePercent = Math.round((savingsAmount / monthlyIncome) * 100);

  let status: 'excellent' | 'good' | 'moderate' | 'low' = 'low';
  if (savingsRatePercent >= 30) status = 'excellent';
  else if (savingsRatePercent >= 20) status = 'good';
  else if (savingsRatePercent >= 10) status = 'moderate';

  return {
    savingsAmount,
    savingsRatePercent,
    status,
  };
}

/**
 * Calculates level and progress from total XP.
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Money Starter', minXP: 0, maxXP: 500 },
  { level: 2, title: 'Smart Saver', minXP: 500, maxXP: 1200 },
  { level: 3, title: 'Budget Builder', minXP: 1200, maxXP: 2200 },
  { level: 4, title: 'Investment Explorer', minXP: 2200, maxXP: 3500 },
  { level: 5, title: 'Finance Strategist', minXP: 3500, maxXP: 5000 },
  { level: 6, title: 'Wealth Planner', minXP: 5000, maxXP: 10000 },
];

export function calculateLevelInfo(totalXP: number): {
  level: number;
  title: string;
  currentLevelXP: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
} {
  let matched = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) {
    if (totalXP >= t.minXP) {
      matched = t;
    }
  }

  const isMaxLevel = matched.level === LEVEL_THRESHOLDS.length;
  const levelSpan = matched.maxXP - matched.minXP;
  const currentLevelXP = Math.max(0, totalXP - matched.minXP);
  const xpNeededForNextLevel = isMaxLevel ? 0 : matched.maxXP - totalXP;
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((currentLevelXP / levelSpan) * 100));

  return {
    level: matched.level,
    title: matched.title,
    currentLevelXP,
    xpNeededForNextLevel,
    progressPercent,
  };
}
