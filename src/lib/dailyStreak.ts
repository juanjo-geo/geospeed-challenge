import { addLives } from './energySystem';

const STORAGE_KEY = 'geospeed_daily_streak';

/**
 * Represents a streak reward at a milestone
 */
export interface StreakReward {
  day: number;
  lives: number;
  badge?: string;
}

/**
 * Current state of the daily streak
 */
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string; // YYYY-MM-DD
  rewardsClaimed: string[]; // array of dates (YYYY-MM-DD)
}

/**
 * Result of checking the streak
 */
export interface StreakCheckResult {
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
  reward: StreakReward | null;
}

/**
 * Rewards for streak milestones — generous to drive retention
 * Every day gives at least 1 life; milestones give bonuses
 */
const STREAK_REWARDS: StreakReward[] = [
  { day: 1, lives: 1 },  // Always reward coming back
  { day: 2, lives: 1 },
  { day: 3, lives: 2, badge: '3 días 🔥' },
  { day: 5, lives: 3, badge: 'Explorador Constante' },
  { day: 7, lives: 5, badge: 'Racha Semanal ⚡' },
  { day: 14, lives: 5, badge: 'Maratonista 💎' },
  { day: 21, lives: 5, badge: 'Imparable 👑' },
  { day: 30, lives: 10, badge: 'Deidad de la Racha 🏆' },
];

/**
 * Get the current date as YYYY-MM-DD
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get the date one day ago as YYYY-MM-DD
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Load current state from localStorage
 */
function getStateFromStorage(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastPlayDate: '',
        rewardsClaimed: [],
      };
    }
    return JSON.parse(raw) as StreakState;
  } catch (error) {
    console.error('Error loading streak state:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: '',
      rewardsClaimed: [],
    };
  }
}

/**
 * Save state to localStorage
 */
function saveStateToStorage(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving streak state:', error);
  }
}

/**
 * Get the reward for a specific streak day.
 * Every day gives at least 1 life. Milestones give bonus lives + badges.
 */
function getRewardForDay(day: number): StreakReward {
  // Check for exact milestone match first
  const exact = STREAK_REWARDS.find(r => r.day === day);
  if (exact) return exact;

  // After day 30, every 7 days is a mini-milestone with 5 lives
  if (day > 30 && day % 7 === 0) {
    return { day, lives: 5, badge: `Semana ${Math.floor(day / 7)}` };
  }

  // Default: 1 life per day (always rewarding)
  return { day, lives: 1 };
}

/**
 * Check the daily streak and update if needed
 * - If lastPlayDate is today: return current state (already checked in)
 * - If lastPlayDate is yesterday: increment streak, update lastPlayDate
 * - Otherwise: reset streak to 1, update lastPlayDate
 * Returns { currentStreak, longestStreak, isNewDay, reward }
 */
export function checkStreak(): StreakCheckResult {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const state = getStateFromStorage();

  let isNewDay = false;
  let reward: StreakReward | null = null;

  if (state.lastPlayDate === today) {
    // Already checked in today
    isNewDay = false;
  } else if (state.lastPlayDate === yesterday) {
    // Consecutive day - increment streak
    state.currentStreak += 1;
    state.lastPlayDate = today;
    isNewDay = true;

    // Update longest streak if needed
    if (state.currentStreak > state.longestStreak) {
      state.longestStreak = state.currentStreak;
    }

    // Get the reward for this day (always returns something)
    reward = getRewardForDay(state.currentStreak);
  } else {
    // Streak broken or first time - reset to 1
    state.currentStreak = 1;
    state.lastPlayDate = today;
    isNewDay = true;

    // First day reward
    reward = getRewardForDay(1);
  }

  saveStateToStorage(state);

  return {
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    isNewDay,
    reward,
  };
}

/**
 * Get the current streak state without modifying it
 */
export function getStreakState(): StreakState {
  return getStateFromStorage();
}

/**
 * Claim the daily reward for today
 * Applies the lives reward and marks the date as claimed
 * Returns the reward that was claimed, or null if already claimed
 */
export function claimDailyReward(): StreakReward | null {
  const today = getTodayDate();
  const state = getStateFromStorage();

  // Check if already claimed today
  if (state.rewardsClaimed.includes(today)) {
    return null;
  }

  // Get the reward for current streak
  const reward = getRewardForDay(state.currentStreak);

  if (reward) {
    // Apply the lives reward
    if (reward.lives > 0) {
      addLives(reward.lives);
    }

    // Mark as claimed
    state.rewardsClaimed.push(today);
    saveStateToStorage(state);
  }

  return reward;
}

/**
 * Check if the player's streak is at risk (didn't play yesterday and has a streak > 2).
 * Returns the streak count if at risk, null otherwise.
 */
export function getStreakAtRisk(): { days: number; canProtect: boolean } | null {
  const state = getStateFromStorage();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Streak is at risk if: last play was yesterday (still safe) AND streak >= 3
  // OR: last play was 2 days ago (about to break) AND streak >= 3
  if (state.currentStreak >= 3 && state.lastPlayDate === yesterday) {
    // Still safe for today, but show reminder
    return null;
  }

  // If they haven't played today and streak would be lost
  if (state.currentStreak >= 3 && state.lastPlayDate !== today && state.lastPlayDate !== yesterday) {
    return { days: state.currentStreak, canProtect: !isStreakProtected() };
  }

  return null;
}

/**
 * Protect the current streak (simulates a $0.99 purchase).
 * Extends lastPlayDate to today so the streak doesn't break.
 */
export function protectStreak(): boolean {
  const state = getStateFromStorage();
  if (state.currentStreak < 2) return false;

  const today = getTodayDate();
  state.lastPlayDate = today;

  // Mark protection used
  try {
    localStorage.setItem('geospeed_streak_protected', today);
  } catch { /* ignore */ }

  saveStateToStorage(state);
  return true;
}

/**
 * Check if streak was already protected today
 */
function isStreakProtected(): boolean {
  try {
    return localStorage.getItem('geospeed_streak_protected') === getTodayDate();
  } catch {
    return false;
  }
}

/**
 * Reset the streak (for testing or logout)
 */
export function resetStreak(): void {
  const initialState: StreakState = {
    currentStreak: 0,
    longestStreak: 0,
    lastPlayDate: '',
    rewardsClaimed: [],
  };
  saveStateToStorage(initialState);
}
