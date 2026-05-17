/**
 * GeoSpeed — Cosmetics & Battle Pass System
 *
 * Cosmetic categories:
 * - Pin Skins: Visual style of the click marker on the map
 * - Trail Effects: Animation style of the bezier arc between click and city
 * - Share Frames: Border/theme for the share card
 * - Map Themes: Color palette for the world map
 *
 * Battle Pass:
 * - 30 levels per season (monthly)
 * - Free track: basic cosmetics
 * - Premium track: exclusive cosmetics (requires Pro subscription)
 * - XP from games advances the pass
 */

// ─── Types ───────────────────────────────────────────────────────────

export type CosmeticCategory = 'pin' | 'trail' | 'frame' | 'mapTheme';

export interface Cosmetic {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  /** Visual config passed to renderers */
  config: Record<string, unknown>;
  /** How to unlock: 'default' (free), 'battlepass_free', 'battlepass_premium', 'store' */
  source: 'default' | 'battlepass_free' | 'battlepass_premium' | 'store';
  /** Store price in cents (only if source === 'store') */
  priceCents?: number;
}

export interface BattlePassLevel {
  level: number;
  xpRequired: number;
  freeReward?: string;    // Cosmetic ID
  premiumReward?: string; // Cosmetic ID (Pro only)
}

export interface BattlePassState {
  seasonId: string;       // e.g. '2026-05'
  currentXP: number;
  claimedFree: number[];  // levels claimed
  claimedPremium: number[];
}

export interface CosmeticState {
  unlockedIds: string[];
  equipped: Record<CosmeticCategory, string>; // category → cosmetic ID
}

// ─── Pin Skins ───────────────────────────────────────────────────────

export const PIN_SKINS: Cosmetic[] = [
  {
    id: 'pin_classic',
    category: 'pin',
    name: 'Clásico',
    description: 'El pin original de GeoSpeed',
    emoji: '📍',
    rarity: 'common',
    config: { fill: '#00D4AA', stroke: '#fff', glow: 'rgba(0,212,170,0.35)', size: 7 },
    source: 'default',
  },
  {
    id: 'pin_gold',
    category: 'pin',
    name: 'Oro Puro',
    description: 'Pin de oro brillante',
    emoji: '🥇',
    rarity: 'rare',
    config: { fill: '#f5c842', stroke: '#fff', glow: 'rgba(245,200,66,0.4)', size: 8 },
    source: 'battlepass_free',
  },
  {
    id: 'pin_fire',
    category: 'pin',
    name: 'Fuego',
    description: 'Pin ardiente con aura de fuego',
    emoji: '🔥',
    rarity: 'epic',
    config: { fill: '#ef4444', stroke: '#fbbf24', glow: 'rgba(239,68,68,0.5)', size: 8, pulse: true },
    source: 'battlepass_premium',
  },
  {
    id: 'pin_diamond',
    category: 'pin',
    name: 'Diamante',
    description: 'Brillo de diamante imposible de ignorar',
    emoji: '💎',
    rarity: 'legendary',
    config: { fill: '#a78bfa', stroke: '#e0e7ff', glow: 'rgba(167,139,250,0.5)', size: 9, sparkle: true },
    source: 'battlepass_premium',
  },
  {
    id: 'pin_neon',
    category: 'pin',
    name: 'Neón',
    description: 'Pin electrizante con resplandor neón',
    emoji: '⚡',
    rarity: 'rare',
    config: { fill: '#22d3ee', stroke: '#06b6d4', glow: 'rgba(34,211,238,0.5)', size: 8, pulse: true },
    source: 'battlepass_free',
  },
  {
    id: 'pin_ghost',
    category: 'pin',
    name: 'Fantasma',
    description: 'Pin translúcido y misterioso',
    emoji: '👻',
    rarity: 'epic',
    config: { fill: 'rgba(255,255,255,0.6)', stroke: 'rgba(255,255,255,0.9)', glow: 'rgba(255,255,255,0.3)', size: 8, pulse: true },
    source: 'store',
    priceCents: 199,
  },
];

// ─── Trail Effects ───────────────────────────────────────────────────

export const TRAIL_EFFECTS: Cosmetic[] = [
  {
    id: 'trail_classic',
    category: 'trail',
    name: 'Clásico',
    description: 'El arco naranja original',
    emoji: '〰️',
    rarity: 'common',
    config: { color: '240,160,48', width: 2, style: 'solid' },
    source: 'default',
  },
  {
    id: 'trail_rainbow',
    category: 'trail',
    name: 'Arcoíris',
    description: 'Un arco de todos los colores',
    emoji: '🌈',
    rarity: 'rare',
    config: { colors: ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'], width: 3, style: 'rainbow' },
    source: 'battlepass_free',
  },
  {
    id: 'trail_lightning',
    category: 'trail',
    name: 'Rayo',
    description: 'Descarga eléctrica entre los puntos',
    emoji: '⚡',
    rarity: 'epic',
    config: { color: '34,211,238', width: 2, style: 'lightning', glow: true },
    source: 'battlepass_premium',
  },
  {
    id: 'trail_fire',
    category: 'trail',
    name: 'Llama',
    description: 'Estela de fuego ardiente',
    emoji: '🔥',
    rarity: 'epic',
    config: { color: '239,68,68', width: 3, style: 'fire', particles: true },
    source: 'battlepass_premium',
  },
  {
    id: 'trail_gold',
    category: 'trail',
    name: 'Dorado',
    description: 'Estela dorada brillante',
    emoji: '✨',
    rarity: 'rare',
    config: { color: '245,200,66', width: 2.5, style: 'solid', glow: true },
    source: 'battlepass_free',
  },
];

// ─── Share Card Frames ───────────────────────────────────────────────

export const SHARE_FRAMES: Cosmetic[] = [
  {
    id: 'frame_classic',
    category: 'frame',
    name: 'Clásico',
    description: 'El marco por defecto',
    emoji: '🖼️',
    rarity: 'common',
    config: { border: 'none', bg: 'default' },
    source: 'default',
  },
  {
    id: 'frame_gold',
    category: 'frame',
    name: 'Marco Dorado',
    description: 'Borde dorado premium',
    emoji: '🏆',
    rarity: 'rare',
    config: { border: '#f5c842', width: 4, bg: 'gold' },
    source: 'battlepass_free',
  },
  {
    id: 'frame_neon',
    category: 'frame',
    name: 'Neón',
    description: 'Borde neón brillante',
    emoji: '💜',
    rarity: 'epic',
    config: { border: '#a78bfa', width: 3, glow: true, bg: 'neon' },
    source: 'battlepass_premium',
  },
  {
    id: 'frame_fire',
    category: 'frame',
    name: 'Inferno',
    description: 'Borde de fuego animado',
    emoji: '🔥',
    rarity: 'legendary',
    config: { border: '#ef4444', width: 4, glow: true, bg: 'fire' },
    source: 'store',
    priceCents: 299,
  },
];

// ─── Map Themes ──────────────────────────────────────────────────────

export const MAP_THEMES: Cosmetic[] = [
  {
    id: 'map_neon',
    category: 'mapTheme',
    name: 'Neon Velocity',
    description: 'El tema original de GeoSpeed',
    emoji: '🌃',
    rarity: 'common',
    config: { id: 'neon' },
    source: 'default',
  },
  {
    id: 'map_vintage',
    category: 'mapTheme',
    name: 'Atlas Vintage',
    description: 'Mapa clásico con tonos tierra',
    emoji: '🗺️',
    rarity: 'rare',
    config: { id: 'dark' },
    source: 'battlepass_free',
  },
  {
    id: 'map_ice',
    category: 'mapTheme',
    name: 'Glaciar',
    description: 'Mundo congelado en tonos azules',
    emoji: '🧊',
    rarity: 'epic',
    config: {
      id: 'ice',
      ocean: ['#0a1628', '#0c1a30', '#081420'],
      land: ['#1e3a5f', '#2a4a6f', '#163050', '#1a4060'],
      border: 'rgba(100,200,255,0.4)',
      grid: 'rgba(100,200,255,0.06)',
    },
    source: 'battlepass_premium',
  },
  {
    id: 'map_sunset',
    category: 'mapTheme',
    name: 'Atardecer',
    description: 'Cielos púrpura y tierras cálidas',
    emoji: '🌅',
    rarity: 'legendary',
    config: {
      id: 'sunset',
      ocean: ['#1a0a2e', '#2a1040', '#140828'],
      land: ['#d45020', '#c87828', '#b03828', '#e06830'],
      border: 'rgba(255,180,100,0.4)',
      grid: 'rgba(255,150,50,0.06)',
    },
    source: 'store',
    priceCents: 399,
  },
];

// ─── All Cosmetics ───────────────────────────────────────────────────

export const ALL_COSMETICS: Cosmetic[] = [
  ...PIN_SKINS,
  ...TRAIL_EFFECTS,
  ...SHARE_FRAMES,
  ...MAP_THEMES,
];

export function getCosmeticById(id: string): Cosmetic | undefined {
  return ALL_COSMETICS.find(c => c.id === id);
}

// ─── Battle Pass Configuration ───────────────────────────────────────

function getCurrentSeasonId(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// XP per level: starts at 500, increases by 100 per level
function xpForLevel(level: number): number {
  return 500 + (level - 1) * 100;
}

export const BATTLE_PASS_LEVELS: BattlePassLevel[] = [
  { level: 1,  xpRequired: xpForLevel(1),  freeReward: 'pin_gold' },
  { level: 2,  xpRequired: xpForLevel(2),  premiumReward: 'trail_gold' },
  { level: 3,  xpRequired: xpForLevel(3),  freeReward: 'frame_gold' },
  { level: 4,  xpRequired: xpForLevel(4),  premiumReward: 'pin_neon' },
  { level: 5,  xpRequired: xpForLevel(5),  freeReward: 'trail_rainbow' },
  { level: 6,  xpRequired: xpForLevel(6),  premiumReward: 'map_vintage' },
  { level: 7,  xpRequired: xpForLevel(7) },
  { level: 8,  xpRequired: xpForLevel(8),  freeReward: 'map_vintage' },
  { level: 9,  xpRequired: xpForLevel(9),  premiumReward: 'trail_lightning' },
  { level: 10, xpRequired: xpForLevel(10), freeReward: undefined, premiumReward: 'pin_fire' },
  { level: 11, xpRequired: xpForLevel(11) },
  { level: 12, xpRequired: xpForLevel(12), freeReward: 'trail_gold' },
  { level: 13, xpRequired: xpForLevel(13), premiumReward: 'frame_neon' },
  { level: 14, xpRequired: xpForLevel(14) },
  { level: 15, xpRequired: xpForLevel(15), freeReward: 'pin_neon', premiumReward: 'map_ice' },
  { level: 16, xpRequired: xpForLevel(16) },
  { level: 17, xpRequired: xpForLevel(17), premiumReward: 'trail_fire' },
  { level: 18, xpRequired: xpForLevel(18) },
  { level: 19, xpRequired: xpForLevel(19) },
  { level: 20, xpRequired: xpForLevel(20), freeReward: 'frame_gold', premiumReward: 'pin_diamond' },
];

// ─── Storage ─────────────────────────────────────────────────────────

const COSMETIC_KEY = 'geospeed_cosmetics';
const BATTLEPASS_KEY = 'geospeed_battlepass';

const DEFAULT_EQUIPPED: Record<CosmeticCategory, string> = {
  pin: 'pin_classic',
  trail: 'trail_classic',
  frame: 'frame_classic',
  mapTheme: 'map_neon',
};

export function getCosmeticState(): CosmeticState {
  try {
    const raw = localStorage.getItem(COSMETIC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    unlockedIds: ['pin_classic', 'trail_classic', 'frame_classic', 'map_neon'],
    equipped: { ...DEFAULT_EQUIPPED },
  };
}

function saveCosmeticState(state: CosmeticState) {
  localStorage.setItem(COSMETIC_KEY, JSON.stringify(state));
}

export function getBattlePassState(): BattlePassState {
  try {
    const raw = localStorage.getItem(BATTLEPASS_KEY);
    if (raw) {
      const state = JSON.parse(raw) as BattlePassState;
      // Reset if season changed
      if (state.seasonId !== getCurrentSeasonId()) {
        return newBattlePassState();
      }
      return state;
    }
  } catch {}
  return newBattlePassState();
}

function newBattlePassState(): BattlePassState {
  return {
    seasonId: getCurrentSeasonId(),
    currentXP: 0,
    claimedFree: [],
    claimedPremium: [],
  };
}

function saveBattlePassState(state: BattlePassState) {
  localStorage.setItem(BATTLEPASS_KEY, JSON.stringify(state));
}

// ─── Actions ─────────────────────────────────────────────────────────

/** Get the current battle pass level based on accumulated XP */
export function getBattlePassLevel(state?: BattlePassState): { level: number; xpInLevel: number; xpForNext: number; totalXP: number } {
  const bp = state || getBattlePassState();
  let remainingXP = bp.currentXP;
  let level = 0;

  for (const lvl of BATTLE_PASS_LEVELS) {
    if (remainingXP >= lvl.xpRequired) {
      remainingXP -= lvl.xpRequired;
      level = lvl.level;
    } else {
      return {
        level,
        xpInLevel: remainingXP,
        xpForNext: lvl.xpRequired,
        totalXP: bp.currentXP,
      };
    }
  }

  return {
    level: BATTLE_PASS_LEVELS.length,
    xpInLevel: 0,
    xpForNext: 0,
    totalXP: bp.currentXP,
  };
}

/** Add XP to battle pass (called after each game) */
export function addBattlePassXP(xp: number): { newLevel: boolean; unlockedCosmetics: string[] } {
  const bp = getBattlePassState();
  const oldLevel = getBattlePassLevel(bp).level;

  bp.currentXP += xp;
  saveBattlePassState(bp);

  const newLevelNum = getBattlePassLevel(bp).level;
  const unlockedCosmetics: string[] = [];

  // Auto-claim free rewards for newly reached levels
  if (newLevelNum > oldLevel) {
    const cosmState = getCosmeticState();
    for (let l = oldLevel + 1; l <= newLevelNum; l++) {
      const lvlConfig = BATTLE_PASS_LEVELS.find(bl => bl.level === l);
      if (lvlConfig?.freeReward && !cosmState.unlockedIds.includes(lvlConfig.freeReward)) {
        cosmState.unlockedIds.push(lvlConfig.freeReward);
        unlockedCosmetics.push(lvlConfig.freeReward);
        if (!bp.claimedFree.includes(l)) bp.claimedFree.push(l);
      }
    }
    saveCosmeticState(cosmState);
    saveBattlePassState(bp);
  }

  return { newLevel: newLevelNum > oldLevel, unlockedCosmetics };
}

/** Claim a premium reward (requires Pro status) */
export function claimPremiumReward(level: number): string | null {
  const bp = getBattlePassState();
  const currentLevel = getBattlePassLevel(bp).level;

  if (level > currentLevel) return null;
  if (bp.claimedPremium.includes(level)) return null;

  const lvlConfig = BATTLE_PASS_LEVELS.find(bl => bl.level === level);
  if (!lvlConfig?.premiumReward) return null;

  const cosmState = getCosmeticState();
  if (!cosmState.unlockedIds.includes(lvlConfig.premiumReward)) {
    cosmState.unlockedIds.push(lvlConfig.premiumReward);
    saveCosmeticState(cosmState);
  }
  bp.claimedPremium.push(level);
  saveBattlePassState(bp);

  return lvlConfig.premiumReward;
}

/** Purchase a store cosmetic */
export function purchaseCosmetic(cosmeticId: string): boolean {
  const cosmetic = getCosmeticById(cosmeticId);
  if (!cosmetic || cosmetic.source !== 'store') return false;

  const state = getCosmeticState();
  if (state.unlockedIds.includes(cosmeticId)) return false; // already owned

  state.unlockedIds.push(cosmeticId);
  saveCosmeticState(state);
  return true;
}

/** Equip a cosmetic */
export function equipCosmetic(cosmeticId: string): boolean {
  const cosmetic = getCosmeticById(cosmeticId);
  if (!cosmetic) return false;

  const state = getCosmeticState();
  if (!state.unlockedIds.includes(cosmeticId)) return false; // not unlocked

  state.equipped[cosmetic.category] = cosmeticId;
  saveCosmeticState(state);
  return true;
}

/** Get the currently equipped cosmetic for a category */
export function getEquipped(category: CosmeticCategory): Cosmetic {
  const state = getCosmeticState();
  const id = state.equipped[category] || DEFAULT_EQUIPPED[category];
  return getCosmeticById(id) || getCosmeticById(DEFAULT_EQUIPPED[category])!;
}

/** Check if a cosmetic is unlocked */
export function isUnlocked(cosmeticId: string): boolean {
  const state = getCosmeticState();
  return state.unlockedIds.includes(cosmeticId);
}

// ─── Rarity colors ───────────────────────────────────────────────────
export const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a78bfa',
  legendary: '#f5c842',
};

export const RARITY_LABELS: Record<string, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};
