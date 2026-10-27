/**
 * Progresión ampliada (Fase 9, docs/GeoSpeed_Plan_Competencia.md): medallas por mapa, logros de largo plazo y la
 * vitrina (título y marco activos). Todo lo calcula el servidor (RPC my_progression, migración
 * 20261102120000_progression.sql) con las partidas guardadas; aquí se lee, se guarda en caché y se arma la UI.
 *  · Medalla de un mapa (región × dificultad × categoría) = la mejor partida de 13 en Clásico, Diario o Retos:
 *    🥉 terminar las 13 · 🥈 9+ aciertos buenos · 🥇 12+ (bueno = cercanía ≥ 800, el que sube el combo).
 *  · Logros con tres niveles; los altos dan títulos y marcos (solo cosméticos). Los umbrales son los mismos de
 *    _achievement_defs() en el servidor: si se cambian, cambiar los dos.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { REGION_MODES, PACK_MODES, type Difficulty, type GameMode } from '@/data/cities';
import { categoriesForMode, type Category } from '@/lib/catalog';
import { markBadgesSeen } from '@/lib/dailyChallenge';

export type MedalLevel = 0 | 1 | 2 | 3;
export interface MapMedal { mode: string; difficulty: Difficulty; category: Category; medal: MedalLevel; hits: number }
export interface ProgressionStats {
  games: number; perfects: number; fast: number; combo: number; golds: number; regions: number; categories: number;
  dominated: number; flags: number; challenges: number; sprint: number; mundial: number; daily: number;
}
export interface EarnedBadge { id: string; at: string; seen: boolean }
export interface Progression { medals: MapMedal[]; stats: ProgressionStats; badges: EarnedBadge[] }

export const MEDAL_RULE = { rounds: 13, silverHits: 9, goldHits: 12 };
export const MEDAL_EMOJI: Record<1 | 2 | 3, string> = { 1: '🥉', 2: '🥈', 3: '🥇' };
export const MEDAL_KEY: Record<1 | 2 | 3, string> = { 1: 'medal_bronze', 2: 'medal_silver', 3: 'medal_gold' };
export const DIFFICULTIES: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];
/** Mapas con medalla: las 5 regiones, Colombia y los packs Pro, cada uno con sus categorías */
export const MEDAL_REGIONS: GameMode[] = [...REGION_MODES, ...PACK_MODES];
export const medalMaps = (): { mode: GameMode; category: Category }[] =>
  MEDAL_REGIONS.flatMap((mode) => categoriesForMode(mode).map((category) => ({ mode, category })));
export const totalMedalSlots = () => medalMaps().length * DIFFICULTIES.length;
export const medalKey = (mode: string, difficulty: string, category: string) => `${mode}|${difficulty}|${category}`;

// ── Logros ──────────────────────────────────────────────────────────────────
type Reward = { title?: string; frame?: string };
export interface AchievementDef {
  id: keyof ProgressionStats;
  emoji: string;
  tiers: [number, number, number];
  rewards?: Partial<Record<1 | 2 | 3, Reward>>;
  /** Insignia de cada nivel (la racha del diario usa las insignias de la Fase 2) */
  badge?: (tier: 1 | 2 | 3) => string;
}
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'games', emoji: '🎮', tiers: [10, 100, 1000], rewards: { 2: { title: 'veterano' }, 3: { title: 'incansable' } } },
  { id: 'perfects', emoji: '🎯', tiers: [10, 100, 1000], rewards: { 2: { title: 'francotirador' }, 3: { frame: 'sniper' } } },
  { id: 'fast', emoji: '⚡', tiers: [25, 250, 1000], rewards: { 2: { title: 'rayo' } } },
  { id: 'combo', emoji: '🔥', tiers: [6, 8, 13], rewards: { 3: { frame: 'flame' } } },
  { id: 'golds', emoji: '🥇', tiers: [5, 25, 100], rewards: { 1: { title: 'medallista' }, 2: { title: 'cartografo', frame: 'medal' }, 3: { title: 'sabio' } } },
  { id: 'regions', emoji: '🗺️', tiers: [3, 5, 10], rewards: { 3: { title: 'trotamundos', frame: 'globe' } } },
  { id: 'categories', emoji: '🧩', tiers: [2, 3, 5] },
  { id: 'dominated', emoji: '🧠', tiers: [25, 100, 500], rewards: { 3: { title: 'memoria' } } },
  { id: 'flags', emoji: '🚩', tiers: [25, 100, 166], rewards: { 3: { title: 'abanderado' } } },
  { id: 'challenges', emoji: '🤝', tiers: [5, 25, 100], rewards: { 2: { title: 'retador' } } },
  { id: 'sprint', emoji: '🏁', tiers: [1300, 1500, 1700], rewards: { 2: { frame: 'sprint' }, 3: { title: 'elite' } } },
  { id: 'mundial', emoji: '⚽', tiers: [25, 100, 500], rewards: { 2: { title: 'ojeador' } } },
  { id: 'daily', emoji: '📅', tiers: [7, 30, 100], rewards: { 1: { frame: 'bronze' }, 3: { title: 'viajero', frame: 'silver' } }, badge: (n) => ['streak_7', 'streak_30', 'streak_100'][n - 1] },
];
export const achievementBadge = (a: AchievementDef, tier: 1 | 2 | 3) => (a.badge ? a.badge(tier) : `ach_${a.id}_${tier}`);
/** Nivel alcanzado (0–3) por la cifra actual */
export const achievementTier = (a: AchievementDef, value: number): 0 | 1 | 2 | 3 =>
  (value >= a.tiers[2] ? 3 : value >= a.tiers[1] ? 2 : value >= a.tiers[0] ? 1 : 0);
export const achievementOfBadge = (badgeId: string): { def: AchievementDef; tier: 1 | 2 | 3 } | null => {
  for (const def of ACHIEVEMENTS) for (const tier of [1, 2, 3] as const) if (achievementBadge(def, tier) === badgeId) return { def, tier };
  return null;
};

// ── Títulos y marcos (los mismos de _cosmetic_badge en el servidor) ─────────
export const TITLES: { id: string; badge: string }[] = [
  { id: 'medallista', badge: 'ach_golds_1' }, { id: 'veterano', badge: 'ach_games_2' }, { id: 'francotirador', badge: 'ach_perfects_2' },
  { id: 'rayo', badge: 'ach_fast_2' }, { id: 'retador', badge: 'ach_challenges_2' }, { id: 'ojeador', badge: 'ach_mundial_2' },
  { id: 'cartografo', badge: 'ach_golds_2' }, { id: 'viajero', badge: 'streak_100' }, { id: 'trotamundos', badge: 'ach_regions_3' },
  { id: 'memoria', badge: 'ach_dominated_3' }, { id: 'abanderado', badge: 'ach_flags_3' }, { id: 'elite', badge: 'ach_sprint_3' },
  { id: 'incansable', badge: 'ach_games_3' }, { id: 'sabio', badge: 'ach_golds_3' }, { id: 'leyenda', badge: 'streak_365' },
  // Conquista el mapa (C6): campeón de una temporada de su grupo
  { id: 'conquistador', badge: 'conq_champion' },
];
export const FRAMES: { id: string; badge: string }[] = [
  { id: 'bronze', badge: 'streak_7' }, { id: 'medal', badge: 'ach_golds_2' }, { id: 'sprint', badge: 'ach_sprint_2' },
  { id: 'silver', badge: 'streak_100' }, { id: 'flame', badge: 'ach_combo_3' }, { id: 'globe', badge: 'ach_regions_3' },
  { id: 'sniper', badge: 'ach_perfects_3' }, { id: 'gold', badge: 'streak_365' },
];
/** Qué pide un título o marco (para el candado): el logro y nivel, o la racha del diario */
export const cosmeticRequirement = (badge: string) => achievementOfBadge(badge)
  ?? (badge.startsWith('streak_') ? { streakDays: Number(badge.slice(7)) } : badge === 'conq_champion' ? { conquest: true as const } : null);

// ── Lectura y caché ─────────────────────────────────────────────────────────
const CACHE_KEY = 'geospeed_progression';
export const PROGRESSION_EVENT = 'geospeed:progression';

export function getCachedProgression(): Progression | null {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? (JSON.parse(raw) as Progression) : null; } catch { return null; }
}

/** Pide la progresión al servidor (sin sesión no crea una: devuelve la caché). Avisa con PROGRESSION_EVENT. */
export async function fetchProgression(): Promise<Progression | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return getCachedProgression();
    const { data, error } = await supabase.rpc('my_progression');
    if (error || !data) return getCachedProgression();
    const p = data as unknown as Progression;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(p)); } catch { /* sin espacio */ }
    window.dispatchEvent(new CustomEvent(PROGRESSION_EVENT, { detail: p }));
    return p;
  } catch {
    return getCachedProgression();
  }
}

let lastFetch = 0;
/** Como mucho una vez cada 30 s (o ya, con force: al terminar una partida) */
export function refreshProgression(force = false): Promise<Progression | null> {
  if (!force && Date.now() - lastFetch < 30_000) return Promise.resolve(getCachedProgression());
  lastFetch = Date.now();
  return fetchProgression();
}

/** La progresión para una pantalla: la de la caché al instante y la del servidor cuando llega */
export function useProgression(): Progression | null {
  const [p, setP] = useState<Progression | null>(getCachedProgression);
  useEffect(() => {
    const on = (e: Event) => setP((e as CustomEvent<Progression>).detail);
    window.addEventListener(PROGRESSION_EVENT, on);
    refreshProgression();
    return () => window.removeEventListener(PROGRESSION_EVENT, on);
  }, []);
  return p;
}

export const medalMap = (p: Progression | null): Map<string, MapMedal> =>
  new Map((p?.medals ?? []).map((m) => [medalKey(m.mode, m.difficulty, m.category), m]));
export function medalCounts(p: Progression | null): { gold: number; silver: number; bronze: number } {
  const c = { gold: 0, silver: 0, bronze: 0 };
  for (const m of p?.medals ?? []) { if (m.medal === 3) c.gold++; else if (m.medal === 2) c.silver++; else if (m.medal === 1) c.bronze++; }
  return c;
}
export const earnedSet = (p: Progression | null) => new Set((p?.badges ?? []).map((b) => b.id));

// ── Lo nuevo al terminar una partida ────────────────────────────────────────
export type Unlock =
  | { kind: 'medal'; mode: string; difficulty: Difficulty; category: Category; medal: 1 | 2 | 3; hits: number }
  | { kind: 'achievement'; badge: string; def: AchievementDef; tier: 1 | 2 | 3 };

/**
 * Medallas que mejoraron y logros sin ver. La primera lectura de un jugador veterano (sin caché) no anuncia sus
 * medallas viejas; sí las de alguien que recién empieza (≤ 3 partidas).
 */
export function diffUnlocks(prev: Progression | null, next: Progression): Unlock[] {
  const out: Unlock[] = [];
  const before = medalMap(prev);
  if (prev || next.stats.games <= 3) {
    for (const m of next.medals) {
      const old = before.get(medalKey(m.mode, m.difficulty, m.category))?.medal ?? 0;
      if (m.medal > old && m.medal > 0) out.push({ kind: 'medal', mode: m.mode, difficulty: m.difficulty, category: m.category, medal: m.medal as 1 | 2 | 3, hits: m.hits });
    }
  }
  for (const b of next.badges) {
    if (b.seen || !b.id.startsWith('ach_')) continue;
    const a = achievementOfBadge(b.id);
    if (a) out.push({ kind: 'achievement', badge: b.id, def: a.def, tier: a.tier });
  }
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'medal' ? -1 : 1));
}

/** Marca como vistos los logros ya mostrados (las insignias de la racha las maneja el diario) */
export function markAchievementsSeen(p: Progression | null): void {
  const ids = (p?.badges ?? []).filter((b) => !b.seen && b.id.startsWith('ach_')).map((b) => b.id);
  if (!ids.length) return;
  markBadgesSeen(ids);
  if (p) {
    const upd = { ...p, badges: p.badges.map((b) => (ids.includes(b.id) ? { ...b, seen: true } : b)) };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(upd)); } catch { /* sin espacio */ }
  }
}
