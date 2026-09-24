export type TabType =
  | 'home'
  | 'invest'
  | 'markets'
  | 'shark_tank'
  | 'portfolio'
  | 'profile'
  | 'rewards';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type MarketSessionStatus =
  | 'PRE_OPEN'
  | 'OPEN'
  | 'POST_CLOSE'
  | 'CLOSED'
  | 'HOLIDAY'
  | 'UNKNOWN';

export type DataFreshness =
  | 'LIVE'
  | 'UPDATED_RECENTLY'
  | 'MARKET_CLOSED'
  | 'DELAYED';

export interface MarketStatusInfo {
  session: MarketSessionStatus;
  exchange: 'NSE' | 'BSE';
  currentTimeIST: string;
  isOpen: boolean;
  message: string;
  nextSessionTime: string;
}

/**
 * The one account model. Identity is the Firebase UID and nothing else — not
 * the phone number, not the display name, and there are no roles or
 * permissions. Renaming yourself must never produce a different account.
 */
export interface UserProfile {
  /** Firebase Authentication UID. The authoritative identity everywhere. */
  uid: string;
  phoneNumber: string;
  displayName: string;
  /** Contact email captured at sign-up. Sign-in is always phone + OTP. */
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;

  // Progress the simulation keeps against this UID.
  level: number;
  levelTitle: string;
  currentXP: number;
  nextLevelXP: number;
  streakDays: number;
  lastActiveDate: string;
}

export interface VirtualWallet {
  cashBalance: number;
  totalDeposited: number;
  totalInvested: number;
  totalSavings: number;
  startingBalance: number;
}

export interface StockHolding {
  symbol: string;
  name: string;
  shares: number;
  averageBuyPrice: number;
  totalInvested: number;
  category: string;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  returnPercent?: number;
  dayPnL?: number;
  weightPercent?: number;
}

export interface MutualFundHolding {
  id: string;
  name: string;
  units: number;
  averageNav: number;
  totalInvested: number;
  category: string;
  currentNav?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  returnPercent?: number;
}

export interface FixedDepositHolding {
  id: string;
  principal: number;
  durationMonths: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  earnedInterest: number;
  isMatured: boolean;
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

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type:
    | 'buy_stock'
    | 'sell_stock'
    | 'buy_fund'
    | 'sell_fund'
    | 'open_fd'
    | 'fd_maturity'
    | 'budget_save'
    | 'reward_xp'
    | 'shark_tank_invest'
    | 'teacher_grant';
  title: string;
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending';
  details?: string;
  orderId?: string;
  symbol?: string;
  shares?: number;
  executionPrice?: number;
  simulatedCharges?: SimulatedChargeBreakdown;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EducationalMetricNote {
  title: string;
  whatItMeans: string;
  whyItMatters: string;
  cautionPoint: string;
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

export interface StockItem {
  id: string;
  symbol: string;
  name: string;
  exchange?: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' | 'Global' | string;
  sector: string;
  currentPrice: number;
  openPrice?: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose: number;
  change?: number;
  changePercent: number;
  volume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  risk: RiskLevel;
  description: string;
  marketCap: string;
  peRatio: number;
  eps?: number;
  roe?: number;
  debtToEquity?: number;
  dividendYield: number;
  logoUrl?: string;
  dataFreshness?: DataFreshness;
  lastTradedTime?: string;
  sparkline: number[];
  historical1D: number[];
  historical1W: number[];
  historical1M: number[];
  historical1Y: number[];
  historical5Y?: number[];
  fundamentals?: CompanyFundamentals;
}

export interface MutualFundItem {
  id: string;
  name: string;
  amc?: string;
  category: string;
  logoUrl?: string;
  nav: number;
  navChange?: number;
  navChangePercent?: number;
  aumCr?: number;
  oneYearReturn: number;
  threeYearReturn: number;
  fiveYearReturn?: number;
  risk: RiskLevel;
  minInvestment: number;
  expenseRatio: number;
  description: string;
  holdingsTop: string[];
  topHoldings?: { symbol: string; name: string; weightPercent: number }[];
  fundObjective?: string;
  benchmark?: string;
}

export interface SharkTankStartup {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  founder: string;
  founderAge: number;
  cohort: string;
  problem: string;
  solution: string;
  askAmount: number;
  askEquityPercent: number;
  valuation: number;
  monthlyRevenue: number;
  growthRate: number;
  pitchStory: string;
  educationalTakeaway: string;
  isVerifiedPitch: boolean;
  totalRaisedVirtual: number;
  investorCount: number;
}

export interface BudgetItem {
  id: string;
  categoryId: 'food' | 'transport' | 'entertainment' | 'education' | 'shopping' | 'other';
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  color: string;
}

export interface BudgetState {
  monthlyIncome: number;
  items: BudgetItem[];
  savingsTargetPercent: number;
  targetSavingsAmount: number;
  actualSavingsAmount: number;
}

export interface LessonSection {
  heading: string;
  body: string;
  keyTakeaway: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LessonModule {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  xpReward: number;
  isCompleted: boolean;
  score?: number;
  summaryPoints: string[];
  fullContent: LessonSection[];
  quiz: QuizQuestion[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'learning' | 'saving' | 'investing' | 'streak' | 'shark_tank';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpValue: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'teacher_assigned';
  creatorName?: string;
  cohortClass?: string;
  xpReward: number;
  progress: number;
  target: number;
  unit: string;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: string;
}

export interface ClassroomCohort {
  id: string;
  name: string; // e.g., "Grade 9 - Batch Alpha"
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  avgNetWorth: number;
  avgSavingsRate: number;
  activeChallengeCount: number;
  students: {
    id: string;
    name: string;
    level: number;
    totalXP: number;
    netWorth: number;
    savingsRate: number;
    riskScore: 'Conservative' | 'Balanced' | 'Aggressive';
  }[];
}

export interface SystemMarketConfig {
  benchmarkInterestRate: number; // e.g. 7.5%
  simulatedInflationRate: number; // e.g. 5.8%
  marketStatus: 'open' | 'closed';
  totalMarketLiquidity: number;
  totalVolumeTraded24h: number;
  activeUsersCount: number;
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  schoolGrade: string;
  level: number;
  totalXP: number;
  badgesCount: number;
  roiPercent: number;
  isCurrentUser?: boolean;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}
