import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SystemMarketConfig,
  SharkTankStartup,
  StockItem,
  MutualFundItem,
  Transaction,
} from '../types';
import {
  MOCK_STOCKS,
  MOCK_MUTUAL_FUNDS,
  MOCK_SHARK_TANK_STARTUPS,
  MOCK_CHALLENGES,
} from '../constants/mockData';

/**
 * Local store for simulation-wide content (market config, the Shark Tank
 * roster, the teachable stock list). This is device-local sandbox state, not
 * user identity — real accounts live in Firebase Auth + Firestore.
 */
const SIM_KEYS = {
  MARKET_CONFIG: '@minti_fb_firestore_market_config',
  MARKET_STOCKS: '@minti_fb_firestore_stocks',
  MARKET_FUNDS: '@minti_fb_firestore_funds',
  STARTUPS: '@minti_fb_firestore_startups',
  CHALLENGES: '@minti_fb_firestore_challenges',
};

export const INITIAL_MARKET_CONFIG: SystemMarketConfig = {
  benchmarkInterestRate: 7.5,
  simulatedInflationRate: 5.8,
  marketStatus: 'open',
  totalMarketLiquidity: 48500000,
  totalVolumeTraded24h: 342000,
  activeUsersCount: 1420,
};

export const SimulationStore = {
  // Firebase Auth Services




  // Firestore Cohorts


  // Teacher Classroom API

  async markPitchVerified(startupId: string): Promise<void> {
    const startups = await this.getStartups();
    const updated = startups.map((s) => (s.id === startupId ? { ...s, isVerifiedPitch: true } : s));
    await AsyncStorage.setItem(SIM_KEYS.STARTUPS, JSON.stringify(updated));
  },

  // Market Config API (Super Admin)
  async getMarketConfig(): Promise<SystemMarketConfig> {
    try {
      const data = await AsyncStorage.getItem(SIM_KEYS.MARKET_CONFIG);
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_MARKET_CONFIG;
  },

  async updateMarketConfig(config: SystemMarketConfig): Promise<void> {
    await AsyncStorage.setItem(SIM_KEYS.MARKET_CONFIG, JSON.stringify(config));
  },

  async addNewStock(stock: StockItem): Promise<void> {
    const stocks = await this.getStocks();
    const updated = [stock, ...stocks];
    await AsyncStorage.setItem(SIM_KEYS.MARKET_STOCKS, JSON.stringify(updated));
  },

  async getStocks(): Promise<StockItem[]> {
    try {
      const data = await AsyncStorage.getItem(SIM_KEYS.MARKET_STOCKS);
      if (data) return JSON.parse(data);
    } catch {}
    return MOCK_STOCKS;
  },

  async getStartups(): Promise<SharkTankStartup[]> {
    try {
      const data = await AsyncStorage.getItem(SIM_KEYS.STARTUPS);
      if (data) return JSON.parse(data);
    } catch {}
    return MOCK_SHARK_TANK_STARTUPS;
  },
};
