import { getPlayerStats, getGameHistory } from './gameUtils';
import { addLives } from './energySystem';

export interface PlayerLevel {
  level: number;
  title: string;
  emoji: string;
  xp: number;
  xpForNext: number;
  progress: number; // 0-100
}

export interface LevelReward {
  lives: number;
  description: string;
  unlock?: string;
}

const LEVELS: { minXp: number; title: string; emoji: string }[] = [
  { minXp: 0, title: 'Novato', emoji: '🌱' },
  { minXp: 500, title: 'Explorador', emoji: '🧭' },
  { minXp: 1500, title: 'Viajero', emoji: '✈️' },
  { minXp: 3500, title: 'Navegante', emoji: '🗺️' },
  { minXp: 7000, title: 'Geógrafo', emoji: '🌍' },
  { minXp: 12000, title: 'Cartógrafo', emoji: '📐' },
  { minXp: 20000, title: 'Maestro', emoji: '🎓' },
  { minXp: 35000, title: 'Leyenda', emoji: '👑' },
  { minXp: 60000, title: 'Oráculo', emoji: '🔮' },
  { minXp: 100000, title: 'Deidad Geo', emoji: '⚡' },
];

const LEVEL_REWARDS: Record<number, LevelReward> = {
  1: { lives: 0, description: 'Nivel inicial' },
  2: { lives: 2, description: 'Explorador desbloqueado', unlock: 'Europe mode' },
  3: { lives: 3, description: 'Viajero desbloqueado', unlock: 'Asia mode' },
  4: { lives: 3, description: 'Navegante desbloqueado' },
  5: { lives: 5, description: 'Geógrafo desbloqueado', unlock: 'Expert difficulty' },
  6: { lives: 5, description: 'Cartógrafo desbloqueado' },
  7: { lives: 5, description: 'Maestro desbloqueado' },
  8: { lives: 10, description: 'Leyenda desbloqueado' },
  9: { lives: 10, description: 'Oráculo desbloqueado' },
  10: { lives: 20, description: 'Deidad Geo desbloqueado' },
};

export function calculateXP(): number {
  const stats = getPlayerStats();
  const history = getGameHistory();
  // XP = total accumulated score from all games
  return history.reduce((sum, g) => sum + g.score, 0) || (stats.bestScore * stats.gamesPlayed * 0.3);
}

export function getPlayerLevel(): PlayerLevel {
  const xp = calculateXP();
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }

  const levelIndex = LEVELS.indexOf(currentLevel);
  const xpForNext = nextLevel ? nextLevel.minXp : currentLevel.minXp;
  const xpInLevel = xp - currentLevel.minXp;
  const xpNeeded = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const progress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  return {
    level: levelIndex + 1,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    xp,
    xpForNext,
    progress,
  };
}

export function checkLevelUp(previousXp: number, currentXp: number): { leveled: boolean; newLevel?: PlayerLevel; reward?: LevelReward } {
  const previousLevel = calculateLevel(previousXp);
  const currentLevel = calculateLevel(currentXp);

  if (currentLevel > previousLevel) {
    const newPlayerLevel = getPlayerLevelByNumber(currentLevel);
    const reward = LEVEL_REWARDS[currentLevel];
    return {
      leveled: true,
      newLevel: newPlayerLevel,
      reward,
    };
  }

  return { leveled: false };
}

function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return i + 1;
    }
  }
  return 1;
}

function getPlayerLevelByNumber(levelNumber: number): PlayerLevel {
  const xp = calculateXP();
  const currentLevel = LEVELS[levelNumber - 1] || LEVELS[0];
  const nextLevel = LEVELS[levelNumber] || null;

  const xpForNext = nextLevel ? nextLevel.minXp : currentLevel.minXp;
  const xpInLevel = xp - currentLevel.minXp;
  const xpNeeded = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const progress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  return {
    level: levelNumber,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    xp,
    xpForNext,
    progress,
  };
}

export function claimLevelReward(level: number): boolean {
  const claimedLevelsJson = localStorage.getItem('geospeed_claimed_levels');
  const claimedLevels: number[] = claimedLevelsJson ? JSON.parse(claimedLevelsJson) : [];

  if (claimedLevels.includes(level)) {
    return false;
  }

  const reward = LEVEL_REWARDS[level];
  if (reward && reward.lives > 0) {
    addLives(reward.lives);
  }

  claimedLevels.push(level);
  localStorage.setItem('geospeed_claimed_levels', JSON.stringify(claimedLevels));

  return true;
}

// --- Badges ---

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
}

export function getPlayerBadges(): Badge[] {
  const stats = getPlayerStats();
  const history = getGameHistory();

  const perfectRounds = history.some(g => g.avgDistance < 200);
  const played10 = stats.gamesPlayed >= 10;
  const played50 = stats.gamesPlayed >= 50;
  const scored5k = stats.bestScore >= 5000;
  const scored10k = stats.bestScore >= 10000;
  const playedDaily = !!localStorage.getItem(`geospeed_daily_${new Date().toISOString().split('T')[0]}`);
  const playedHard = history.some(g => g.difficulty === 'hard');
  const streak3 = history.length >= 3 && history.slice(0, 3).every(g => g.score > 0);

  return [
    { id: 'first', name: 'Primera partida', emoji: '🎮', description: 'Juega tu primera partida', unlocked: stats.gamesPlayed >= 1 },
    { id: 'ten', name: 'Veterano', emoji: '🎖️', description: 'Juega 10 partidas', unlocked: played10 },
    { id: 'fifty', name: 'Adicto', emoji: '💎', description: 'Juega 50 partidas', unlocked: played50 },
    { id: 'sniper', name: 'Francotirador', emoji: '🎯', description: 'Dist. promedio < 200 km', unlocked: perfectRounds },
    { id: 'score5k', name: 'Aspirante', emoji: '⭐', description: 'Supera 5,000 pts', unlocked: scored5k },
    { id: 'score10k', name: 'Élite', emoji: '🏆', description: 'Supera 10,000 pts', unlocked: scored10k },
    { id: 'daily', name: 'Puntual', emoji: '📅', description: 'Completa un Desafío Diario', unlocked: playedDaily },
    { id: 'hard', name: 'Valiente', emoji: '🔴', description: 'Juega en dificultad Experto', unlocked: playedHard },
    { id: 'streak', name: 'Consistente', emoji: '🔥', description: '3 partidas seguidas', unlocked: streak3 },
  ];
}
