import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  UserProfile,
  UserRole,
  VirtualWallet,
  StockHolding,
  MutualFundHolding,
  FixedDepositHolding,
  Transaction,
  BudgetState,
  LessonModule,
  Badge,
  Challenge,
  ClassroomCohort,
  SystemMarketConfig,
  LeaderboardUser,
  TabType,
  StockItem,
  MutualFundItem,
  SharkTankStartup,
  MarketStatusInfo,
  SimulatedChargeBreakdown,
} from '../types';
import {
  MOCK_STOCKS,
  MOCK_MUTUAL_FUNDS,
  MOCK_SHARK_TANK_STARTUPS,
  MOCK_LEADERBOARD_USERS,
  INITIAL_VIRTUAL_BALANCE,
} from '../constants/mockData';
import { StorageService, AppSettings } from '../services/storage';
import {
  FirebaseService,
  DEMO_ACCOUNTS,
  INITIAL_COHORTS,
  INITIAL_MARKET_CONFIG,
} from '../services/firebaseService';
import { GamificationEngine } from '../services/gamificationEngine';
import { calculateFDMaturity } from '../utils/financialMath';
import { MarketDataService } from '../services/marketDataService';
import { VirtualOrderEngine } from '../services/virtualOrderEngine';
import { PortfolioEngine, PortfolioAnalytics } from '../services/portfolioEngine';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  isLoading: boolean;
  userProfile: UserProfile;
  wallet: VirtualWallet;
  stockHoldings: StockHolding[];
  fundHoldings: MutualFundHolding[];
  fdHoldings: FixedDepositHolding[];
  transactions: Transaction[];
  budget: BudgetState;
  lessons: LessonModule[];
  badges: Badge[];
  challenges: Challenge[];
  leaderboard: LeaderboardUser[];
  stockCatalog: StockItem[];
  fundCatalog: MutualFundItem[];
  sharkTankStartups: SharkTankStartup[];
  cohorts: ClassroomCohort[];
  marketConfig: SystemMarketConfig;
  settings: AppSettings;
  activeTab: TabType;
  toast: ToastData | null;
  activeModal: string | null;
  modalData: any;
  marketStatus: MarketStatusInfo;
  watchlist: string[];
  portfolioAnalytics: PortfolioAnalytics;

  // Actions
  setActiveTab: (tab: TabType) => void;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  switchUserRole: (role: UserRole) => Promise<void>;
  completeOnboarding: (name: string) => Promise<void>;
  buyStock: (symbol: string, shares: number) => Promise<boolean>;
  sellStock: (symbol: string, shares: number) => Promise<boolean>;
  calculateCharges: (amount: number, isBuy: boolean) => SimulatedChargeBreakdown;
  toggleWatchlist: (symbol: string) => Promise<void>;
  isWatchlisted: (symbol: string) => boolean;
  investFund: (fundId: string, amount: number) => Promise<boolean>;
  openFixedDeposit: (principal: number, durationMonths: number, rate: number) => Promise<boolean>;
  investInSharkTank: (startupId: string, amount: number, equity: number) => Promise<boolean>;
  approveStartup: (startupId: string) => Promise<void>;
  updateMarketConfig: (config: SystemMarketConfig) => Promise<void>;
  addNewStockToMarket: (stock: StockItem) => Promise<void>;
  assignTeacherChallenge: (cohortId: string, challenge: Omit<Challenge, 'id'>) => Promise<void>;
  updateBudgetIncome: (income: number) => Promise<void>;
  updateBudgetItem: (id: string, allocated: number, spent: number) => Promise<void>;
  completeLesson: (lessonId: string, score: number) => Promise<void>;
  claimChallengeReward: (challengeId: string) => Promise<void>;
  recordCompoundSimulation: () => Promise<void>;
  toggleSetting: (key: keyof AppSettings) => Promise<void>;
  resetSimulationData: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
}

const defaultProfile: UserProfile = DEMO_ACCOUNTS[0];

const defaultWallet: VirtualWallet = {
  cashBalance: INITIAL_VIRTUAL_BALANCE,
  totalDeposited: INITIAL_VIRTUAL_BALANCE,
  totalInvested: 0,
  totalSavings: 0,
  startingBalance: INITIAL_VIRTUAL_BALANCE,
};

const defaultMarketStatus: MarketStatusInfo = {
  session: 'OPEN',
  exchange: 'NSE',
  currentTimeIST: '09:30 IST',
  isOpen: true,
  message: 'NSE/BSE Regular Market Session Active',
  nextSessionTime: 'Closes at 03:30 PM IST',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [wallet, setWallet] = useState<VirtualWallet>(defaultWallet);
  const [stockHoldings, setStockHoldings] = useState<StockHolding[]>([]);
  const [fundHoldings, setFundHoldings] = useState<MutualFundHolding[]>([]);
  const [fdHoldings, setFdHoldings] = useState<FixedDepositHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetState>({
    monthlyIncome: 50000,
    items: [],
    savingsTargetPercent: 20,
    targetSavingsAmount: 10000,
    actualSavingsAmount: 10000,
  });
  const [lessons, setLessons] = useState<LessonModule[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stockCatalog, setStockCatalog] = useState<StockItem[]>(MOCK_STOCKS);
  const [fundCatalog, setFundCatalog] = useState<MutualFundItem[]>(MOCK_MUTUAL_FUNDS);
  const [sharkTankStartups, setSharkTankStartups] = useState<SharkTankStartup[]>(MOCK_SHARK_TANK_STARTUPS);
  const [cohorts, setCohorts] = useState<ClassroomCohort[]>(INITIAL_COHORTS);
  const [marketConfig, setMarketConfig] = useState<SystemMarketConfig>(INITIAL_MARKET_CONFIG);
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo>(defaultMarketStatus);
  const [watchlist, setWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY']);
  const [settings, setSettings] = useState<AppSettings>({
    hapticsEnabled: true,
    soundEnabled: true,
    notificationsEnabled: true,
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const isMountedRef = useRef(true);

  // Load from local storage and initialize real-market services
  useEffect(() => {
    isMountedRef.current = true;
    async function loadData() {
      try {
        const storedProfile = await FirebaseService.getCurrentUser();
        const storedWallet = await StorageService.getWallet();
        const storedStocks = await StorageService.getStockHoldings();
        const storedFunds = await StorageService.getFundHoldings();
        const storedFDs = await StorageService.getFDHoldings();
        const storedTx = await StorageService.getTransactions();
        const storedBudget = await StorageService.getBudgetState();
        const storedLessons = await StorageService.getLessons();
        const storedBadges = await StorageService.getBadges();
        const storedChallenges = await StorageService.getChallenges();
        const storedSettings = await StorageService.getSettings();
        const storedWatchlist = await StorageService.getWatchlist();
        const fbCohorts = await FirebaseService.getCohorts();
        const fbMarketConfig = await FirebaseService.getMarketConfig();
        const fbStartups = await FirebaseService.getStartups();

        // Fetch initial market status and stocks from MarketDataService
        const liveStatus = await MarketDataService.getMarketStatus();
        const liveStocks = await MarketDataService.getStocks();
        const liveFunds = await MarketDataService.getMutualFunds();

        if (storedProfile && typeof storedProfile.name === 'string') {
          // Sanitize any legacy cached names from older local storage
          if (
            storedProfile.name.includes('Shaurya') ||
            storedProfile.name.includes('Prashant') ||
            storedProfile.name.includes('Neha') ||
            storedProfile.name.includes('Lavanya') ||
            storedProfile.name.includes('Abhyudh') ||
            storedProfile.name.includes('Abhimannyu') ||
            storedProfile.name.includes('Anujeet')
          ) {
            storedProfile.name =
              storedProfile.role === 'super_admin'
                ? 'Chirag (Super Admin)'
                : storedProfile.role === 'teacher'
                ? 'Faculty Mentor'
                : 'Student Investor';
          }
          const { updatedProfile } = GamificationEngine.checkStreak(storedProfile);
          setUserProfile(updatedProfile);
          await FirebaseService.updateUserProfile(updatedProfile);
        }

        setWallet(storedWallet);
        // Persisted collections come back as whatever JSON was on disk, possibly
        // written by an older build. Rows with no identity can never be priced,
        // sold or opened, so they are dropped rather than rendered.
        setStockHoldings(
          (Array.isArray(storedStocks) ? storedStocks : []).filter(
            (h) => h && typeof h.symbol === 'string' && h.symbol.trim() !== ''
          )
        );
        setFundHoldings(
          (Array.isArray(storedFunds) ? storedFunds : []).filter(
            (f) => f && typeof f.id === 'string' && f.id.trim() !== ''
          )
        );
        setFdHoldings(Array.isArray(storedFDs) ? storedFDs.filter(Boolean) : []);
        setTransactions(
          (Array.isArray(storedTx) ? storedTx : []).filter(
            (t) => t && typeof t.id === 'string' && typeof t.type === 'string'
          )
        );
        setBudget(storedBudget);
        setLessons(storedLessons);
        setBadges(storedBadges);
        setChallenges(storedChallenges);
        setSettings(storedSettings);
        setWatchlist(storedWatchlist);
        setCohorts(fbCohorts);
        setMarketConfig(fbMarketConfig);
        setMarketStatus(liveStatus);
        const mergedStartups = MOCK_SHARK_TANK_STARTUPS.map((mock) => {
          const cached = fbStartups?.find((s) => s.id === mock.id);
          return cached ? { ...mock, ...cached } : mock;
        });
        setSharkTankStartups(mergedStartups);
        if (liveStocks && liveStocks.length > 0) {
          setStockCatalog(liveStocks);
        }
        if (liveFunds && liveFunds.length > 0) {
          setFundCatalog(liveFunds);
        }
      } catch (err) {
        console.error('Error hydrating storage and market services', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Live market ticks.
  //
  // Android lifecycle aware: polling stops when the app leaves the foreground
  // and resumes with an immediate refresh when it comes back, so a backgrounded
  // app neither burns battery nor queues a backlog of stale responses. A single
  // in-flight guard means a slow response cannot stack duplicate requests.
  const tickInFlightRef = useRef(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const pollOnce = async () => {
      if (!isMountedRef.current || tickInFlightRef.current) return;
      tickInFlightRef.current = true;
      try {
        const [updatedStocks, updatedStatus] = await Promise.all([
          MarketDataService.getStocks(),
          MarketDataService.getMarketStatus(),
        ]);
        if (!isMountedRef.current) return;
        if (Array.isArray(updatedStocks) && updatedStocks.length > 0) {
          setStockCatalog(updatedStocks);
        }
        if (updatedStatus) {
          setMarketStatus(updatedStatus);
        }
      } catch {
        // A failed tick keeps the last good quotes; the banner already shows status.
      } finally {
        tickInFlightRef.current = false;
      }
    };

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(pollOnce, 3500);
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleAppStateChange = (next: AppStateStatus) => {
      if (next === 'active') {
        pollOnce();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (AppState.currentState === 'active') startPolling();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, title, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  const openModal = (modalName: string, data: any = null) => {
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const refreshMarketData = async () => {
    try {
      const [updatedStocks, updatedStatus] = await Promise.all([
        MarketDataService.getStocks(),
        MarketDataService.getMarketStatus(),
      ]);
      if (updatedStocks) setStockCatalog(updatedStocks);
      if (updatedStatus) setMarketStatus(updatedStatus);
      showToast('Market Refreshed', 'Live quotes and indices updated.', 'info');
    } catch {
      showToast('Network Alert', 'Market data temporarily using local feed.', 'warning');
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    const upper = symbol.toUpperCase();
    let updated: string[];
    if (watchlist.includes(upper)) {
      updated = watchlist.filter((s) => s !== upper);
      showToast('Watchlist Updated', `Removed ${upper} from your watchlist.`, 'info');
    } else {
      updated = [...watchlist, upper];
      showToast('Watchlist Added', `Added ${upper} to your live watchlist.`, 'success');
    }
    setWatchlist(updated);
    await StorageService.saveWatchlist(updated);
  };

  const isWatchlisted = (symbol: string): boolean => {
    return watchlist.includes(symbol.toUpperCase());
  };

  const calculateCharges = (amount: number, isBuy: boolean): SimulatedChargeBreakdown => {
    return VirtualOrderEngine.calculateCharges(amount, isBuy);
  };

  // 1-Tap RBAC Persona Switcher
  const switchUserRole = async (role: UserRole) => {
    const profile = await FirebaseService.switchRole(role);
    setUserProfile(profile);

    if (role === 'teacher') {
      setActiveTab('classroom');
    } else if (role === 'super_admin') {
      setActiveTab('admin_control');
    } else {
      setActiveTab('home');
    }

    const roleLabel =
      role === 'super_admin' ? 'Super Admin' : role === 'teacher' ? 'Teacher' : 'Student (Grade 9)';
    showToast('Persona Switched', `Active Role: ${roleLabel} (${profile.name})`, 'info');
  };

  const addXP = async (amount: number, reason: string) => {
    const res = GamificationEngine.addXP(userProfile, amount);
    setUserProfile(res.updatedProfile);
    await FirebaseService.updateUserProfile(res.updatedProfile);
    await StorageService.saveUserProfile(res.updatedProfile);

    if (res.leveledUp) {
      showToast('Level Up!', `You reached Level ${res.newLevel}: ${res.newLevelTitle}!`, 'success');
    } else {
      showToast(`+${amount} XP Earned`, reason, 'info');
    }

    checkAndUnlockBadges(res.updatedProfile);
  };

  const checkAndUnlockBadges = async (profile = userProfile) => {
    const completedCount = lessons.filter((l) => l.isCompleted).length;
    const { savingsRatePercent } = budget
      ? { savingsRatePercent: Math.round(((budget.monthlyIncome - budget.items.reduce((a, b) => a + b.spentAmount, 0)) / budget.monthlyIncome) * 100) }
      : { savingsRatePercent: 20 };

    const { updatedBadges, newlyUnlocked } = GamificationEngine.evaluateBadges(badges, {
      completedLessonsCount: completedCount,
      savedRatePercent: savingsRatePercent,
      stocksCount: stockHoldings.length,
      fundsCount: fundHoldings.length,
      fdsCount: fdHoldings.length,
      streakDays: profile.streakDays,
      usedCompoundCalc: true,
      sharkTankInvested: transactions.some((t) => t.type === 'shark_tank_invest'),
      userLevel: profile.level,
    });

    if (newlyUnlocked.length > 0) {
      setBadges(updatedBadges);
      await StorageService.saveBadges(updatedBadges);
      newlyUnlocked.forEach((b) => {
        showToast('Badge Unlocked!', `${b.title} - ${b.description}`, 'success');
      });
    }
  };

  const completeOnboarding = async (name: string) => {
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'Young Financer',
      isOnboarded: true,
      currentXP: 250,
    };
    setUserProfile(updated);
    await FirebaseService.updateUserProfile(updated);
    await StorageService.saveUserProfile(updated);
    showToast('Welcome to Minti Finance!', '₹1,00,000 virtual money credited for investment practice.', 'success');
  };

  const buyStock = async (symbol: string, shares: number): Promise<boolean> => {
    const stock = stockCatalog.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) {
      showToast('Stock Not Found', `Instrument ${symbol} is not listed.`, 'warning');
      return false;
    }

    try {
      const result = VirtualOrderEngine.executeBuy(
        userProfile.id,
        userProfile.name,
        stock,
        shares,
        wallet,
        stockHoldings
      );

      const newTxList = [result.transaction, ...transactions];

      setWallet(result.updatedWallet);
      setStockHoldings(result.updatedHoldings);
      setTransactions(newTxList);

      await StorageService.saveWallet(result.updatedWallet);
      await StorageService.saveStockHoldings(result.updatedHoldings);
      await StorageService.saveTransactions(newTxList);

      const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'invest_asset');
      setChallenges(updatedChallenges);
      await StorageService.saveChallenges(updatedChallenges);

      await addXP(60, `Invested in ${stock.name}`);
      showToast('Virtual Buy Executed', result.message, 'success');
      return true;
    } catch (err: any) {
      showToast('Order Rejected', err.message || 'Unable to execute simulated buy.', 'warning');
      return false;
    }
  };

  const sellStock = async (symbol: string, shares: number): Promise<boolean> => {
    const stock = stockCatalog.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!stock) {
      showToast('Stock Not Found', `Instrument ${symbol} is not listed.`, 'warning');
      return false;
    }

    try {
      const result = VirtualOrderEngine.executeSell(
        userProfile.id,
        userProfile.name,
        stock,
        shares,
        wallet,
        stockHoldings
      );

      const newTxList = [result.transaction, ...transactions];

      setWallet(result.updatedWallet);
      setStockHoldings(result.updatedHoldings);
      setTransactions(newTxList);

      await StorageService.saveWallet(result.updatedWallet);
      await StorageService.saveStockHoldings(result.updatedHoldings);
      await StorageService.saveTransactions(newTxList);

      showToast('Virtual Sell Complete', result.message, 'success');
      return true;
    } catch (err: any) {
      showToast('Sale Rejected', err.message || 'Unable to execute simulated sell.', 'warning');
      return false;
    }
  };

  const investFund = async (fundId: string, amount: number): Promise<boolean> => {
    const fund = fundCatalog.find((f) => f.id === fundId);
    if (!fund || amount < fund.minInvestment) {
      showToast('Minimum Investment', `Minimum simulated investment is ₹${fund?.minInvestment || 500}`, 'warning');
      return false;
    }

    if (wallet.cashBalance < amount) {
      showToast('Insufficient Balance', 'You do not have enough virtual cash.', 'warning');
      return false;
    }

    const units = parseFloat((amount / fund.nav).toFixed(3));
    const newCash = parseFloat((wallet.cashBalance - amount).toFixed(2));
    const newWallet: VirtualWallet = {
      ...wallet,
      cashBalance: newCash,
      totalInvested: parseFloat((wallet.totalInvested + amount).toFixed(2)),
    };

    let updatedFunds = [...fundHoldings];
    const existingIndex = updatedFunds.findIndex((f) => f.id === fundId);
    if (existingIndex >= 0) {
      const existing = updatedFunds[existingIndex];
      const newUnits = parseFloat((existing.units + units).toFixed(3));
      const newInvested = parseFloat((existing.totalInvested + amount).toFixed(2));
      updatedFunds[existingIndex] = {
        ...existing,
        units: newUnits,
        totalInvested: newInvested,
        averageNav: parseFloat((newInvested / newUnits).toFixed(2)),
      };
    } else {
      updatedFunds.push({
        id: fund.id,
        name: fund.name,
        units,
        averageNav: fund.nav,
        totalInvested: amount,
        category: fund.category,
      });
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      userId: userProfile.id,
      userName: userProfile.name,
      type: 'buy_fund',
      title: `Invested in ${fund.name}`,
      amount,
      timestamp: new Date().toISOString(),
      status: 'completed',
      orderId: `VFUND-${Date.now()}`,
      details: `Purchased ${units} virtual units of ${fund.name} at NAV ₹${fund.nav}`,
    };

    const newTxList = [newTx, ...transactions];

    setWallet(newWallet);
    setFundHoldings(updatedFunds);
    setTransactions(newTxList);

    await StorageService.saveWallet(newWallet);
    await StorageService.saveFundHoldings(updatedFunds);
    await StorageService.saveTransactions(newTxList);

    const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'invest_asset');
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);

    await addXP(75, `Diversified into ${fund.name}`);
    showToast('Fund SIP Simulated', `Allocated ₹${amount.toLocaleString('en-IN')} into ${fund.name}`, 'success');
    return true;
  };

  const openFixedDeposit = async (principal: number, durationMonths: number, rate: number): Promise<boolean> => {
    if (principal < 500) {
      showToast('Minimum Deposit', 'Minimum simulated Fixed Deposit is ₹500', 'warning');
      return false;
    }
    if (wallet.cashBalance < principal) {
      showToast('Insufficient Balance', 'Not enough virtual cash for this deposit.', 'warning');
      return false;
    }

    const { maturityAmount, earnedInterest } = calculateFDMaturity(principal, rate, durationMonths);
    const startDate = new Date().toISOString();
    const maturityDate = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

    const newFD: FixedDepositHolding = {
      id: `fd-${Date.now()}`,
      principal,
      durationMonths,
      interestRate: rate,
      startDate,
      maturityDate,
      maturityAmount,
      earnedInterest,
      isMatured: false,
    };

    const newCash = parseFloat((wallet.cashBalance - principal).toFixed(2));
    const newWallet: VirtualWallet = {
      ...wallet,
      cashBalance: newCash,
      totalSavings: parseFloat((wallet.totalSavings + principal).toFixed(2)),
    };

    const updatedFDs = [newFD, ...fdHoldings];
    const newTx: Transaction = {
      id: Date.now().toString(),
      userId: userProfile.id,
      userName: userProfile.name,
      type: 'open_fd',
      title: `Opened ${durationMonths}M Fixed Deposit @ ${rate}%`,
      amount: principal,
      timestamp: startDate,
      status: 'completed',
      orderId: `VFD-${Date.now()}`,
      details: `Locked virtual cash for ${durationMonths} months at ${rate}% annual return. Maturity amount: ₹${maturityAmount.toLocaleString('en-IN')}`,
    };

    const newTxList = [newTx, ...transactions];

    setWallet(newWallet);
    setFdHoldings(updatedFDs);
    setTransactions(newTxList);

    await StorageService.saveWallet(newWallet);
    await StorageService.saveFDHoldings(updatedFDs);
    await StorageService.saveTransactions(newTxList);

    await addXP(60, 'Opened a Virtual Fixed Deposit');
    showToast('Fixed Deposit Created', `Locked ₹${principal.toLocaleString('en-IN')} at ${rate}% annual interest.`, 'success');
    return true;
  };

  const investInSharkTank = async (startupId: string, amount: number, equity: number): Promise<boolean> => {
    const startup = sharkTankStartups.find((s) => s.id === startupId);
    if (!startup || amount <= 0) return false;

    if (wallet.cashBalance < amount) {
      showToast('Insufficient Balance', 'Not enough virtual cash for this deal.', 'warning');
      return false;
    }

    const newCash = parseFloat((wallet.cashBalance - amount).toFixed(2));
    const newWallet: VirtualWallet = {
      ...wallet,
      cashBalance: newCash,
      totalInvested: parseFloat((wallet.totalInvested + amount).toFixed(2)),
    };

    const newTx: Transaction = {
      id: Date.now().toString(),
      userId: userProfile.id,
      userName: userProfile.name,
      type: 'shark_tank_invest',
      title: `Shark Tank: Invested in ${startup.name} (${equity}% equity)`,
      amount,
      timestamp: new Date().toISOString(),
      status: 'completed',
      orderId: `VSHARK-${Date.now()}`,
      details: `Simulated angel investment of ₹${amount.toLocaleString('en-IN')} for ${equity}% equity stake.`,
    };

    const newTxList = [newTx, ...transactions];

    setWallet(newWallet);
    setTransactions(newTxList);

    await StorageService.saveWallet(newWallet);
    await StorageService.saveTransactions(newTxList);

    const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'shark_tank_deal');
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);

    await addXP(150, `Completed Shark Tank deal with ${startup.name}`);
    showToast('Deal Closed in the Tank!', `Invested ₹${amount.toLocaleString('en-IN')} for ${equity}% equity!`, 'success');
    return true;
  };

  const approveStartup = async (startupId: string) => {
    await FirebaseService.approveSharkTankStartup(startupId);
    setSharkTankStartups((prev) =>
      prev.map((s) => (s.id === startupId ? { ...s, isApprovedByTeacher: true } : s))
    );
    showToast('Proposal Approved', 'Startup listed for student cohort investment.', 'success');
  };

  const updateMarketConfig = async (config: SystemMarketConfig) => {
    setMarketConfig(config);
    await FirebaseService.updateMarketConfig(config);
  };

  const addNewStockToMarket = async (stock: StockItem) => {
    await FirebaseService.addNewStock(stock);
    setStockCatalog((prev) => [stock, ...prev]);
    showToast('Stock Listed', `${stock.symbol} is now active on the virtual exchange!`, 'success');
  };

  const assignTeacherChallenge = async (cohortId: string, challengeData: Omit<Challenge, 'id'>) => {
    const newCh = await FirebaseService.assignTeacherChallenge(cohortId, challengeData);
    setChallenges((prev) => [newCh, ...prev]);
  };

  const updateBudgetIncome = async (income: number) => {
    const updated: BudgetState = {
      ...budget,
      monthlyIncome: Math.max(1000, income),
    };
    setBudget(updated);
    await StorageService.saveBudgetState(updated);
  };

  const updateBudgetItem = async (id: string, allocated: number, spent: number) => {
    const updatedItems = budget.items.map((item) =>
      item.id === id ? { ...item, allocatedAmount: allocated, spentAmount: spent } : item
    );
    const updated: BudgetState = {
      ...budget,
      items: updatedItems,
    };
    setBudget(updated);
    await StorageService.saveBudgetState(updated);

    const totalSpent = updatedItems.reduce((acc, i) => acc + i.spentAmount, 0);
    const rate = Math.round(((updated.monthlyIncome - totalSpent) / updated.monthlyIncome) * 100);

    const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'adjust_budget', rate);
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);

    checkAndUnlockBadges();
  };

  const completeLesson = async (lessonId: string, score: number) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const updatedLessons = lessons.map((l) =>
      l.id === lessonId ? { ...l, isCompleted: true, score } : l
    );
    setLessons(updatedLessons);
    await StorageService.saveLessons(updatedLessons);

    const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'complete_lesson');
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);

    await addXP(lesson.xpReward, `Finished: ${lesson.title}`);
  };

  const claimChallengeReward = async (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch || !ch.isCompleted || ch.isClaimed) return;

    const updatedChallenges = challenges.map((c) =>
      c.id === challengeId ? { ...c, isClaimed: true } : c
    );
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);

    await addXP(ch.xpReward, `Completed Challenge: ${ch.title}`);
  };

  const recordCompoundSimulation = async () => {
    const { updatedChallenges } = GamificationEngine.updateChallengeProgress(challenges, 'run_compound_calc');
    setChallenges(updatedChallenges);
    await StorageService.saveChallenges(updatedChallenges);
    await addXP(25, 'Analyzed Compound Growth');
  };

  const toggleSetting = async (key: keyof AppSettings) => {
    const updated: AppSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  const resetSimulationData = async () => {
    await StorageService.resetAllData();
    setUserProfile({ ...defaultProfile, isOnboarded: true });
    setWallet(defaultWallet);
    setStockHoldings([]);
    setFundHoldings([]);
    setFdHoldings([]);
    setTransactions([]);
    setWatchlist(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY']);
    showToast('Simulation Reset', 'Your virtual sandbox has been reset to starting ₹1,00,000.', 'info');
  };

  // Real-time calculated portfolio analytics dynamically evaluated against live quotes
  // Memoized: the market ticks every 3.5s and this walks every holding, so an
  // unmemoized call would re-run the whole portfolio on every unrelated render.
  const portfolioAnalytics = useMemo(
    () =>
      PortfolioEngine.evaluatePortfolio(
        wallet.cashBalance,
        wallet.startingBalance || INITIAL_VIRTUAL_BALANCE,
        stockHoldings,
        fundHoldings,
        fdHoldings,
        stockCatalog,
        fundCatalog
      ),
    [
      wallet.cashBalance,
      wallet.startingBalance,
      stockHoldings,
      fundHoldings,
      fdHoldings,
      stockCatalog,
      fundCatalog,
    ]
  );

  const currentUserLeaderboardEntry: LeaderboardUser = {
    id: userProfile.id,
    rank: 4,
    name: `${userProfile.name} (You)`,
    schoolGrade: userProfile.cohortClass || 'Grade 9',
    level: userProfile.level,
    totalXP: userProfile.currentXP,
    badgesCount: badges.filter((b) => b.isUnlocked).length,
    roiPercent: portfolioAnalytics.totalReturnPercent,
    isCurrentUser: true,
  };

  const fullLeaderboard = [...MOCK_LEADERBOARD_USERS, currentUserLeaderboardEntry]
    .sort((a, b) => b.totalXP - a.totalXP)
    .map((user, idx) => ({ ...user, rank: idx + 1 }));

  return (
    <AppContext.Provider
      value={{
        isLoading,
        userProfile,
        wallet,
        stockHoldings,
        fundHoldings,
        fdHoldings,
        transactions,
        budget,
        lessons,
        badges,
        challenges,
        leaderboard: fullLeaderboard,
        stockCatalog,
        fundCatalog,
        sharkTankStartups,
        cohorts,
        marketConfig,
        settings,
        activeTab,
        toast,
        activeModal,
        modalData,
        marketStatus,
        watchlist,
        portfolioAnalytics,
        setActiveTab,
        openModal,
        closeModal,
        showToast,
        switchUserRole,
        completeOnboarding,
        buyStock,
        sellStock,
        calculateCharges,
        toggleWatchlist,
        isWatchlisted,
        investFund,
        openFixedDeposit,
        investInSharkTank,
        approveStartup,
        updateMarketConfig,
        addNewStockToMarket,
        assignTeacherChallenge,
        updateBudgetIncome,
        updateBudgetItem,
        completeLesson,
        claimChallengeReward,
        recordCompoundSimulation,
        toggleSetting,
        resetSimulationData,
        refreshMarketData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
