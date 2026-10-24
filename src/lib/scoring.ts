/**
 * Puntaje v2 — "Temporada 1" (Fase 1 del plan de competencia, 2026-10-20; docs/GeoSpeed_Plan_Competencia.md).
 *
 *   Puntos de la ronda = Cercanía × Rapidez × Combo × Dificultad
 *
 * - Cercanía (0–1.000): 1.000 a menos de 25 km; luego 1.000 × e^(−km / escala). Escala según el mapa:
 *   mundo 1.500 km, región/continente 600 km (país 150 km, para los packs).
 * - Rapidez: la MISMA curva de antes (JuanJo: la velocidad no pierde peso): ×2,2 al instante, −0,13 por
 *   segundo, mínimo ×0,4 (1 s ×2,07 · 5 s ×1,55 · 10 s ×0,90 · 14 s ×0,40).
 * - Combo por aciertos buenos seguidos (cercanía ≥ 800): 2–3 ×1,2 · 4–5 ×1,5 · 6–7 ×2,0 · 8+ ×2,5.
 *   Un acierto regular (400–799) mantiene el combo sin subirlo; solo un fallo (< 400) lo rompe.
 * - Dificultad: Turista ×1,0 · Rookie ×1,1 · Crack ×1,25 · Leyenda ×1,5 (el Mundial no la usa, como antes).
 *
 * EL SERVIDOR RECALCULA cada partida con la función SQL `score_round_v2` (migración scoring_v2): todo se
 * calcula en enteros (tiempo en décimas, rapidez en milésimas, combo en décimas, dificultad en centésimas)
 * para que el teléfono y el servidor lleguen exactamente al mismo número. Si se cambia algo aquí, cambiarlo
 * también en la función SQL.
 */
import type { GameMode } from '@/data/cities';

export const SCORING_VERSION = 2;
/** Inicio de la Temporada 1 (para el ranking de iniciales de la tabla antigua `leaderboard`) */
export const SEASON_1_START = '2026-10-21T00:00:00Z';

/** A menos de esto la cercanía es perfecta (1.000) */
export const PERFECT_KM = 25;
/** Escala de la cercanía (km) */
export const SCALE_KM = { world: 1500, region: 600, country: 150 } as const;

/** Escala de la cercanía por modo; el servidor usa la misma tabla (mode_scale_km en la migración del pack Colombia) */
export function scaleForMode(mode: GameMode | 'mundial' | string): number {
  if (mode === 'world' || mode === 'mundial') return SCALE_KM.world;
  if (mode === 'colombia') return SCALE_KM.country;
  return SCALE_KM.region;
}

/** Cercanía entera 0–1.000 */
export function closeness(km: number, scaleKm: number): number {
  if (!(km >= 0)) return 0;
  if (km < PERFECT_KM) return 1000;
  return Math.round(1000 * Math.exp(-km / scaleKm));
}

/** Segundos → décimas enteras (así se guarda y se puntúa el tiempo) */
export const toTenths = (seconds: number) => Math.max(0, Math.round(seconds * 10));

/** Rapidez en milésimas (400–2.200) para un tiempo en décimas de segundo */
export function speedMilli(tenths: number): number {
  return Math.max(400, Math.min(2200, 2200 - 13 * tenths));
}
/** Rapidez como número (×2,07…) */
export const speedMultiplier = (seconds: number) => speedMilli(toTenths(seconds)) / 1000;

export type Quality = 'good' | 'regular' | 'miss';
export const GOOD_MIN = 800;
export const REGULAR_MIN = 400;
export function qualityOf(closenessPts: number): Quality {
  return closenessPts >= GOOD_MIN ? 'good' : closenessPts >= REGULAR_MIN ? 'regular' : 'miss';
}

/** Niveles de combo: desde cuántos aciertos buenos seguidos, multiplicador en décimas y texto */
export const COMBO_LEVELS = [
  { min: 0, tenths: 10, key: null },
  { min: 2, tenths: 12, key: 'combo_rhythm' },
  { min: 4, tenths: 15, key: 'combo_unstoppable' },
  { min: 6, tenths: 20, key: 'combo_turbo' },
  { min: 8, tenths: 25, key: 'combo_onFire' },
] as const;
export type ComboLevel = 0 | 1 | 2 | 3 | 4;

export function comboLevelOf(count: number): ComboLevel {
  let lvl = 0;
  COMBO_LEVELS.forEach((l, i) => { if (count >= l.min) lvl = i; });
  return lvl as ComboLevel;
}

/** Aciertos buenos seguidos después de esta ronda */
export function nextComboCount(prev: number, q: Quality): number {
  return q === 'good' ? prev + 1 : q === 'regular' ? prev : 0;
}

/** Multiplicador por dificultad en centésimas: Turista ×1,0 · Rookie ×1,1 · Crack ×1,25 · Leyenda ×1,5 */
export const DIFFICULTY_HUNDREDTHS: Record<string, number> = { basic: 100, easy: 110, medium: 125, hard: 150 };
export const difficultyHundredths = (difficulty: string | null | undefined, apply = true) =>
  apply ? DIFFICULTY_HUNDREDTHS[difficulty ?? ''] ?? 100 : 100;

export interface RoundScore {
  /** Cercanía 0–1.000 (en el Mundial, los puntos de la banda) */
  closeness: number;
  /** Rapidez (×0,4–×2,2) */
  speed: number;
  quality: Quality;
  /** Aciertos buenos seguidos tras esta ronda */
  combo: number;
  comboLevel: ComboLevel;
  /** Multiplicador de combo aplicado (×1,0–×2,5) */
  comboMult: number;
  /** Multiplicador de dificultad aplicado */
  diffMult: number;
  /** Combo que venía y se rompió con esta ronda (para el sonido y el temblor) */
  broke: boolean;
  points: number;
}

/**
 * Puntúa una ronda. `closenessPts` ya calculada (ciudades: closeness(km, escala); Mundial: puntos de banda).
 * Entero exacto: round(cercanía × rapidez‰ × combo‰₀ × dificultad% / 10⁶), mitad hacia arriba (como SQL).
 */
export function scoreRound(closenessPts: number, seconds: number, prevCombo: number, diffHundredths = 100): RoundScore {
  const q = qualityOf(closenessPts);
  const combo = nextComboCount(prevCombo, q);
  const level = comboLevelOf(combo);
  const comboTenths = COMBO_LEVELS[level].tenths;
  const sMilli = speedMilli(toTenths(seconds));
  const raw = closenessPts * sMilli * comboTenths * diffHundredths; // ≤ 1.000 × 2.200 × 25 × 150
  return {
    closeness: closenessPts,
    speed: sMilli / 1000,
    quality: q,
    combo,
    comboLevel: level,
    comboMult: comboTenths / 10,
    diffMult: diffHundredths / 100,
    broke: q === 'miss' && prevCombo >= COMBO_LEVELS[1].min,
    points: Math.floor(raw / 1_000_000 + 0.5),
  };
}
