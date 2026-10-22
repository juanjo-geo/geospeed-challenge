/**
 * Entrenamiento ampliado (Fase 4, docs/GeoSpeed_Plan_Competencia.md §3): qué practicar (región y nivel de las
 * ciudades), tamaño de la tanda (6 · 10 · 20) y reloj opcional. Sin vidas ni puntaje; no cuenta para la racha
 * ni el ranking. La última configuración se recuerda en este teléfono.
 */
import type { City, Difficulty, GameMode } from '@/data/cities';
import { getRandomItems, isCategory, type Category } from '@/lib/catalog';

export interface TrainingCfg { mode: GameMode; difficulty: Difficulty; size: number; clock: boolean; category: Category }

export const TRAINING_SIZES = [6, 10, 20] as const;
const KEY = 'geospeed_training_cfg';
const DEFAULT_CFG: TrainingCfg = { mode: 'world', difficulty: 'basic', size: 10, clock: false, category: 'cities' };

export function readTrainingCfg(): TrainingCfg {
  try {
    const c = { ...DEFAULT_CFG, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<TrainingCfg>) };
    if (!isCategory(c.category)) c.category = 'cities';
    return TRAINING_SIZES.includes(c.size as 6) ? c : { ...c, size: DEFAULT_CFG.size };
  } catch { return DEFAULT_CFG; }
}

export function saveTrainingCfg(cfg: TrainingCfg): void {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* sin espacio */ }
}

export const trainingCities = (cfg: TrainingCfg): City[] => getRandomItems(cfg.category, cfg.difficulty, cfg.size, cfg.mode);

/** Orden al azar (la ronda extra con las falladas no las repite en el mismo orden) */
export function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
