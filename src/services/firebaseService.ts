import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  UserRole,
  ClassroomCohort,
  SystemMarketConfig,
  SharkTankStartup,
  Challenge,
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

const FIREBASE_KEYS = {
  CURRENT_USER: '@minti_fb_auth_user',
  ALL_USERS: '@minti_fb_firestore_users',
  COHORTS: '@minti_fb_firestore_cohorts',
  MARKET_CONFIG: '@minti_fb_firestore_market_config',
  MARKET_STOCKS: '@minti_fb_firestore_stocks',
  MARKET_FUNDS: '@minti_fb_firestore_funds',
  STARTUPS: '@minti_fb_firestore_startups',
  CHALLENGES: '@minti_fb_firestore_challenges',
};

export interface AuthAccount extends UserProfile {
  passwordHash?: string;
}

export const DEMO_ACCOUNTS: AuthAccount[] = [
  {
    id: 'user_superadmin_main',
    email: 'pa1@skillizee.io',
    passwordHash: '787700',
    name: 'Chirag (Super Admin)',
    role: 'super_admin',
    avatarId: 'admin-1',
    schoolName: 'Skillizee Ideathon HQ',
    cohortClass: 'Executive Administrator',
    level: 7,
    levelTitle: 'Central Market Controller',
    currentXP: 25000,
    nextLevelXP: 30000,
    streakDays: 45,
    lastActiveDate: new Date().toISOString().split('T')[0],
    isOnboarded: true,
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'user_teacher_1',
    email: 'teacher@skillizee.io',
    passwordHash: 'teacher123',
    name: 'Faculty Mentor',
    role: 'teacher',
    avatarId: 'teacher-1',
    schoolName: 'Skillizee High School',
    cohortClass: 'Grade 9 Lead Mentor',
    level: 6,
    levelTitle: 'Wealth Planner',
    currentXP: 8500,
    nextLevelXP: 10000,
    streakDays: 18,
    lastActiveDate: new Date().toISOString().split('T')[0],
    isOnboarded: true,
    createdAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'user_student_1',
    email: 'student@skillizee.io',
    passwordHash: 'student123',
    name: 'Student Investor',
    role: 'student',
    avatarId: 'student-1',
    schoolName: 'Skillizee High School',
    cohortClass: 'Grade 9 - Batch Alpha',
    level: 3,
    levelTitle: 'Budget Builder',
    currentXP: 1450,
    nextLevelXP: 2200,
    streakDays: 4,
    lastActiveDate: new Date().toISOString().split('T')[0],
    isOnboarded: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
];

export const INITIAL_COHORTS: ClassroomCohort[] = [
  {
    id: 'cohort_grade9_alpha',
    name: 'Grade 9 - Batch Alpha',
    teacherId: 'user_teacher_1',
    teacherName: 'Faculty Mentor',
    totalStudents: 28,
    avgNetWorth: 14250,
    avgSavingsRate: 24.5,
    activeChallengeCount: 3,
    students: [
      { id: 's1', name: 'Student Alpha 1', level: 4, totalXP: 2850, netWorth: 16800, savingsRate: 32, riskScore: 'Balanced' },
      { id: 's2', name: 'Student Alpha 2', level: 3, totalXP: 1980, netWorth: 14500, savingsRate: 28, riskScore: 'Conservative' },
      { id: 's3', name: 'Student Investor (You)', level: 3, totalXP: 1450, netWorth: 13200, savingsRate: 22, riskScore: 'Balanced' },
      { id: 's4', name: 'Student Alpha 3', level: 3, totalXP: 1350, netWorth: 12900, savingsRate: 20, riskScore: 'Aggressive' },
      { id: 's5', name: 'Student Alpha 4', level: 2, totalXP: 950, netWorth: 11400, savingsRate: 18, riskScore: 'Conservative' },
    ],
  },
  {
    id: 'cohort_grade9_beta',
    name: 'Grade 9 - Batch Beta',
    teacherId: 'user_teacher_1',
    teacherName: 'Faculty Mentor',
    totalStudents: 25,
    avgNetWorth: 12800,
    avgSavingsRate: 19.8,
    activeChallengeCount: 2,
    students: [
      { id: 's6', name: 'Student Beta 1', level: 3, totalXP: 1650, netWorth: 13800, savingsRate: 25, riskScore: 'Balanced' },
      { id: 's7', name: 'Student Beta 2', level: 2, totalXP: 1100, netWorth: 12100, savingsRate: 19, riskScore: 'Conservative' },
      { id: 's8', name: 'Student Beta 3', level: 2, totalXP: 980, netWorth: 11200, savingsRate: 16, riskScore: 'Aggressive' },
    ],
  },
];

export const INITIAL_MARKET_CONFIG: SystemMarketConfig = {
  benchmarkInterestRate: 7.5,
  simulatedInflationRate: 5.8,
  marketStatus: 'open',
  totalMarketLiquidity: 48500000,
  totalVolumeTraded24h: 342000,
  activeUsersCount: 1420,
};

export const FirebaseService = {
  // Firebase Auth Services
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(FIREBASE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Firebase Auth fetch error', e);
    }
    // Default to Super Admin pa1@skillizee.io
    return DEMO_ACCOUNTS[0];
  },

  async signInWithEmailPassword(email: string, pass: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const matched = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.passwordHash === cleanPass
    );

    if (matched) {
      await AsyncStorage.setItem(FIREBASE_KEYS.CURRENT_USER, JSON.stringify(matched));
      return { success: true, user: matched };
    }

    return {
      success: false,
      error: 'Invalid credentials. For Super Admin use pa1@skillizee.io / 787700',
    };
  },

  async switchRole(role: UserRole): Promise<UserProfile> {
    const matched = DEMO_ACCOUNTS.find((a) => a.role === role) || DEMO_ACCOUNTS[0];
    await AsyncStorage.setItem(FIREBASE_KEYS.CURRENT_USER, JSON.stringify(matched));
    return matched;
  },

  async updateUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(FIREBASE_KEYS.CURRENT_USER, JSON.stringify(profile));
  },

  // Firestore Cohorts
  async getCohorts(): Promise<ClassroomCohort[]> {
    try {
      const data = await AsyncStorage.getItem(FIREBASE_KEYS.COHORTS);
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_COHORTS;
  },

  async saveCohorts(cohorts: ClassroomCohort[]): Promise<void> {
    await AsyncStorage.setItem(FIREBASE_KEYS.COHORTS, JSON.stringify(cohorts));
  },

  // Teacher Classroom API
  async assignTeacherChallenge(cohortId: string, challenge: Omit<Challenge, 'id'>): Promise<Challenge> {
    const newChallenge: Challenge = {
      ...challenge,
      id: `ch_teacher_${Date.now()}`,
      category: 'teacher_assigned',
    };

    const existingData = await AsyncStorage.getItem(FIREBASE_KEYS.CHALLENGES);
    const list: Challenge[] = existingData ? JSON.parse(existingData) : MOCK_CHALLENGES;
    const updated = [newChallenge, ...list];
    await AsyncStorage.setItem(FIREBASE_KEYS.CHALLENGES, JSON.stringify(updated));

    return newChallenge;
  },

  async approveSharkTankStartup(startupId: string): Promise<void> {
    const startups = await this.getStartups();
    const updated = startups.map((s) => (s.id === startupId ? { ...s, isApprovedByTeacher: true } : s));
    await AsyncStorage.setItem(FIREBASE_KEYS.STARTUPS, JSON.stringify(updated));
  },

  // Market Config API (Super Admin)
  async getMarketConfig(): Promise<SystemMarketConfig> {
    try {
      const data = await AsyncStorage.getItem(FIREBASE_KEYS.MARKET_CONFIG);
      if (data) return JSON.parse(data);
    } catch {}
    return INITIAL_MARKET_CONFIG;
  },

  async updateMarketConfig(config: SystemMarketConfig): Promise<void> {
    await AsyncStorage.setItem(FIREBASE_KEYS.MARKET_CONFIG, JSON.stringify(config));
  },

  async addNewStock(stock: StockItem): Promise<void> {
    const stocks = await this.getStocks();
    const updated = [stock, ...stocks];
    await AsyncStorage.setItem(FIREBASE_KEYS.MARKET_STOCKS, JSON.stringify(updated));
  },

  async getStocks(): Promise<StockItem[]> {
    try {
      const data = await AsyncStorage.getItem(FIREBASE_KEYS.MARKET_STOCKS);
      if (data) return JSON.parse(data);
    } catch {}
    return MOCK_STOCKS;
  },

  async getStartups(): Promise<SharkTankStartup[]> {
    try {
      const data = await AsyncStorage.getItem(FIREBASE_KEYS.STARTUPS);
      if (data) return JSON.parse(data);
    } catch {}
    return MOCK_SHARK_TANK_STARTUPS;
  },
};
