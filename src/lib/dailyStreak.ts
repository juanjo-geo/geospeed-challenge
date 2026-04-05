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
 * Rewards for streak milestones
 */
const STREAK_REWARDS: StreakReward[] = [
  { day: 1, lives: 0 }, // Welcome back
  { day: 3, lives: 1 },
  { day: 5, lives: 2 },
  { day: 7, lives: 3, badge: 'Semanal' },
  { day: 14, lives: 5 },
  { day: 30, lives: 10, badge: 'Mensual' },
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
 * Get the reward for a specific streak day
 * Returns the reward for the milestone reached, or null if no reward
 */
function getRewardForDay(day: number): StreakReward | null {
  // Find the highest milestone reward that the current streak qualifies for
  let qualifyingReward: StreakReward | null = null;

  for (const reward of STREAK_REWARDS) {
    if (day >= reward.day) {
      qualifyingReward = reward;
    }
  }

  return qualifyingReward;
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

    // Get the reward for this day
    reward = getRewardForDay(state.currentStreak);
  } else {
    // Streak broken or first time - reset to 1
    state.currentStreak = 1;
    state.lastPlayDate = today;
    isNewDay = true;

    // First day always has the day 1 reward
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
