import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  VirtualWallet,
  StockHolding,
  MutualFundHolding,
  FixedDepositHolding,
  Transaction,
  BudgetState,
  LessonModule,
  Badge,
  Challenge,
} from '../types';
import {
  INITIAL_VIRTUAL_BALANCE,
  DEFAULT_BUDGET_ITEMS,
  MOCK_LESSONS,
  MOCK_BADGES,
  MOCK_CHALLENGES,
} from '../constants/mockData';

const STORAGE_KEYS = {
  PROFILE: '@minti_user_profile',
  WALLET: '@minti_virtual_wallet',
  STOCKS: '@minti_stock_holdings',
  FUNDS: '@minti_fund_holdings',
  FDS: '@minti_fd_holdings',
  TRANSACTIONS: '@minti_transactions',
  BUDGET: '@minti_budget_state',
  LESSONS: '@minti_lessons_progress',
  BADGES: '@minti_badges',
  CHALLENGES: '@minti_challenges',
  SETTINGS: '@minti_settings',
  WATCHLIST: '@minti_watchlist',
};

export interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export const StorageService = {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return null;
      const parsed: UserProfile = JSON.parse(data);
      if (
        parsed.name.includes('Shaurya') ||
        parsed.name.includes('Prashant') ||
        parsed.name.includes('Neha') ||
        parsed.name.includes('Lavanya') ||
        parsed.name.includes('Abhyudh') ||
        parsed.name.includes('Abhimannyu') ||
        parsed.name.includes('Anujeet')
      ) {
        parsed.name =
          parsed.role === 'super_admin'
            ? 'Chirag (Super Admin)'
            : parsed.role === 'teacher'
            ? 'Faculty Mentor'
            : 'Student Investor';
      }
      return parsed;
    } catch (e) {
      console.error('Failed to get user profile', e);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  async getWallet(): Promise<VirtualWallet> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLET);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to get wallet', e);
    }
    return {
      cashBalance: INITIAL_VIRTUAL_BALANCE,
      totalDeposited: INITIAL_VIRTUAL_BALANCE,
      totalInvested: 0,
      totalSavings: 0,
      startingBalance: INITIAL_VIRTUAL_BALANCE,
    };
  },

  async saveWallet(wallet: VirtualWallet): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
    } catch (e) {
      console.error('Failed to save wallet', e);
    }
  },

  async getStockHoldings(): Promise<StockHolding[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STOCKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveStockHoldings(holdings: StockHolding[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save stock holdings', e);
    }
  },

  async getFundHoldings(): Promise<MutualFundHolding[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FUNDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveFundHoldings(holdings: MutualFundHolding[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save fund holdings', e);
    }
  },

  async getFDHoldings(): Promise<FixedDepositHolding[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveFDHoldings(holdings: FixedDepositHolding[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FDS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save FD holdings', e);
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  },

  async getBudgetState(): Promise<BudgetState> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      monthlyIncome: 10000,
      items: DEFAULT_BUDGET_ITEMS,
      savingsTargetPercent: 20,
      targetSavingsAmount: 2000,
      actualSavingsAmount: 2200,
    };
  },

  async saveBudgetState(budget: BudgetState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    } catch (e) {
      console.error('Failed to save budget state', e);
    }
  },

  async getLessons(): Promise<LessonModule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LESSONS);
      return data ? JSON.parse(data) : MOCK_LESSONS;
    } catch {
      return MOCK_LESSONS;
    }
  },

  async saveLessons(lessons: LessonModule[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
    } catch (e) {
      console.error('Failed to save lessons', e);
    }
  },

  async getBadges(): Promise<Badge[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BADGES);
      return data ? JSON.parse(data) : MOCK_BADGES;
    } catch {
      return MOCK_BADGES;
    }
  },

  async saveBadges(badges: Badge[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    } catch (e) {
      console.error('Failed to save badges', e);
    }
  },

  async getChallenges(): Promise<Challenge[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : MOCK_CHALLENGES;
    } catch {
      return MOCK_CHALLENGES;
    }
  },

  async saveChallenges(challenges: Challenge[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    } catch (e) {
      console.error('Failed to save challenges', e);
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      hapticsEnabled: true,
      soundEnabled: true,
      notificationsEnabled: true,
    };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  async getWatchlist(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    } catch {
      return ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    }
  },

  async saveWatchlist(watchlist: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist', e);
    }
  },

  async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (e) {
      console.error('Failed to reset all data', e);
    }
  },
};
