export type MarketSessionStatus =
  | 'PRE_OPEN'
  | 'OPEN'
  | 'POST_CLOSE'
  | 'CLOSED'
  | 'HOLIDAY'
  | 'UNKNOWN';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface MarketStatusInfo {
  session: MarketSessionStatus;
  exchange: 'NSE' | 'BSE';
  currentTimeIST: string;
  isOpen: boolean;
  message: string;
  nextSessionTime: string;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  currentPrice: number;
  openPrice: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  lastTradedTime: string;
  dataFreshness: 'LIVE' | 'UPDATED_RECENTLY' | 'MARKET_CLOSED' | 'DELAYED';
  sparkline: number[];
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyFundamentals {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  marketCapCr: number;
  peRatio: number;
  sectorPE: number;
  pbRatio: number;
  eps: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
  riskRating: RiskLevel;
  educationalNotes: {
    peExplanation: string;
    debtExplanation: string;
    roeExplanation: string;
    riskTakeaway: string;
  };
}

export interface MutualFundData {
  id: string;
  name: string;
  amc: string;
  category: string;
  nav: number;
  navChange: number;
  navChangePercent: number;
  aumCr: number;
  expenseRatio: number;
  riskLevel: RiskLevel;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  minInvestment: number;
  topHoldings: { symbol: string; name: string; weightPercent: number }[];
  fundObjective: string;
  benchmark: string;
}

export interface SimulatedChargeBreakdown {
  brokerage: number;
  stt: number;
  exchangeTurnover: number;
  sebiTurnover: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
}

export interface SimulatedOrderRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  requestedPrice?: number;
  virtualCashAvailable: number;
}

export interface SimulatedOrderResult {
  orderId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  executionPrice: number;
  grossValue: number;
  charges: SimulatedChargeBreakdown;
  netTotalCost: number;
  remainingCash: number;
  status: 'EXECUTED' | 'REJECTED';
  timestamp: string;
  marketDataTimestamp: string;
  statusReason?: string;
}
