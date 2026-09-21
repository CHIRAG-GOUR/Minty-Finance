import { UserProfile, Badge, Challenge } from '../types';
import { calculateLevelInfo } from '../utils/financialMath';

export interface XPEventResult {
  updatedProfile: UserProfile;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  newLevelTitle: string;
  xpGained: number;
}

export const GamificationEngine = {
  addXP(profile: UserProfile, xpGained: number): XPEventResult {
    const newTotalXP = profile.currentXP + xpGained;
    const levelInfo = calculateLevelInfo(newTotalXP);
    const leveledUp = levelInfo.level > profile.level;

    const updatedProfile: UserProfile = {
      ...profile,
      currentXP: newTotalXP,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevelXP: levelInfo.xpNeededForNextLevel + newTotalXP,
    };

    return {
      updatedProfile,
      leveledUp,
      previousLevel: profile.level,
      newLevel: levelInfo.level,
      newLevelTitle: levelInfo.title,
      xpGained,
    };
  },

  checkStreak(profile: UserProfile): { updatedProfile: UserProfile; streakIncreased: boolean } {
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate === today) {
      return { updatedProfile: profile, streakIncreased: false };
    }

    const lastDate = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
    const currentDate = new Date(today);

    let newStreak = 1;
    if (lastDate) {
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = profile.streakDays + 1;
      } else if (diffDays === 0) {
        newStreak = profile.streakDays;
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      streakDays: newStreak,
      lastActiveDate: today,
    };

    return { updatedProfile, streakIncreased: newStreak > profile.streakDays };
  },

  evaluateBadges(
    currentBadges: Badge[],
    criteria: {
      completedLessonsCount: number;
      savedRatePercent: number;
      stocksCount: number;
      fundsCount: number;
      fdsCount: number;
      streakDays: number;
      usedCompoundCalc: boolean;
      sharkTankInvested: boolean;
      userLevel: number;
    }
  ): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
    const newlyUnlocked: Badge[] = [];
    const today = new Date().toISOString().split('T')[0];

    const updatedBadges = currentBadges.map((badge) => {
      if (badge.isUnlocked) return badge;

      let isNowUnlocked = false;
      let progress = badge.progress;

      switch (badge.id) {
        case 'badge-1': // First Step
          isNowUnlocked = true;
          progress = 1;
          break;
        case 'badge-2': // Smart Saver
          if (criteria.savedRatePercent >= 20) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-3': // Market Explorer
          if (criteria.stocksCount > 0 || criteria.fundsCount > 0) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-4': // Compound Master
          if (criteria.usedCompoundCalc) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-5': // Budget Architect
          if (criteria.savedRatePercent > 0) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-6': // Scholar of Finance
          progress = Math.min(badge.maxProgress, criteria.completedLessonsCount);
          if (criteria.completedLessonsCount >= 5) {
            isNowUnlocked = true;
          }
          break;
        case 'badge-7': // Shark Tank Angel
          if (criteria.sharkTankInvested) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-8': // FD Fortifier
          if (criteria.fdsCount > 0) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
        case 'badge-9': // Streak Titan
          progress = Math.min(badge.maxProgress, criteria.streakDays);
          if (criteria.streakDays >= 7) {
            isNowUnlocked = true;
          }
          break;
        case 'badge-10': // Diversification Pro
          const assetsCount = (criteria.stocksCount > 0 ? 1 : 0) +
            (criteria.fundsCount > 0 ? 1 : 0) +
            (criteria.fdsCount > 0 ? 1 : 0) + 1; // cash
          progress = Math.min(badge.maxProgress, assetsCount);
          if (assetsCount >= 4) {
            isNowUnlocked = true;
          }
          break;
        case 'badge-12': // Wealth Strategist
          if (criteria.userLevel >= 5) {
            isNowUnlocked = true;
            progress = 1;
          }
          break;
      }

      if (isNowUnlocked && !badge.isUnlocked) {
        const unlockedBadge: Badge = {
          ...badge,
          isUnlocked: true,
          unlockedAt: today,
          progress: badge.maxProgress,
        };
        newlyUnlocked.push(unlockedBadge);
        return unlockedBadge;
      }

      return { ...badge, progress };
    });

    return { updatedBadges, newlyUnlocked };
  },

  updateChallengeProgress(
    challenges: Challenge[],
    actionType: 'complete_lesson' | 'run_compound_calc' | 'invest_asset' | 'adjust_budget' | 'shark_tank_deal',
    value: number = 1
  ): { updatedChallenges: Challenge[]; completedChallenges: Challenge[] } {
    const completedChallenges: Challenge[] = [];

    const updatedChallenges = challenges.map((ch) => {
      if (ch.isCompleted) return ch;

      let newProgress = ch.progress;
      if (ch.id === 'ch-daily-1' && actionType === 'complete_lesson') {
        newProgress = Math.min(ch.target, ch.progress + value);
      } else if (ch.id === 'ch-daily-2' && actionType === 'run_compound_calc') {
        newProgress = Math.min(ch.target, ch.progress + value);
      } else if (ch.id === 'ch-weekly-1' && actionType === 'invest_asset') {
        newProgress = Math.min(ch.target, ch.progress + value);
      } else if (ch.id === 'ch-weekly-2' && actionType === 'adjust_budget') {
        newProgress = Math.min(ch.target, value);
      } else if (ch.id === 'ch-monthly-1' && actionType === 'shark_tank_deal') {
        newProgress = Math.min(ch.target, ch.progress + value);
      }

      const isCompleted = newProgress >= ch.target;
      if (isCompleted && !ch.isCompleted) {
        const finishedCh: Challenge = { ...ch, progress: newProgress, isCompleted: true };
        completedChallenges.push(finishedCh);
        return finishedCh;
      }

      return { ...ch, progress: newProgress };
    });

    return { updatedChallenges, completedChallenges };
  },
};
