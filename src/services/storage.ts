import AsyncStorage from '@react-native-async-storage/async-storage';
import {
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

const BASE_KEYS = {
  PROFILE: 'user_profile',
  WALLET: 'virtual_wallet',
  STOCKS: 'stock_holdings',
  FUNDS: 'fund_holdings',
  FDS: 'fd_holdings',
  TRANSACTIONS: 'transactions',
  BUDGET: 'budget_state',
  LESSONS: 'lessons_progress',
  BADGES: 'badges',
  CHALLENGES: 'challenges',
  SETTINGS: 'settings',
  WATCHLIST: 'watchlist',
} as const;

/**
 * Every key is namespaced by Firebase UID, so a portfolio belongs to an
 * account rather than to the device. Two users sharing a phone keep separate
 * holdings, and renaming yourself cannot move your positions.
 *
 * Null scope (signed out) falls back to a parking namespace that the app never
 * shows; it exists only so a stray write before sign-in cannot land in, or
 * overwrite, a real user's data.
 */
let activeScope: string | null = null;

export function setStorageScope(uid: string | null): void {
  activeScope = uid && uid.trim() !== '' ? uid.trim() : null;
}

export function getStorageScope(): string | null {
  return activeScope;
}

function scopedKey(base: string): string {
  return `@minty_u_${activeScope ?? 'anonymous'}_${base}`;
}

const STORAGE_KEYS = new Proxy({} as Record<keyof typeof BASE_KEYS, string>, {
  get: (_target, prop: string) => scopedKey(BASE_KEYS[prop as keyof typeof BASE_KEYS] ?? prop),
});

export interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

// The user profile itself lives in Firestore under users/{uid} and is handled
// by UserProfileService. Only simulation data is kept here.
export const StorageService = {
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

  /** Clears this user's simulation data. Never touches another UID's namespace. */
  async resetAllData(): Promise<void> {
    try {
      const keys = Object.keys(BASE_KEYS).map((k) => scopedKey(BASE_KEYS[k as keyof typeof BASE_KEYS]));
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error('Failed to reset all data', e);
    }
  },
};
