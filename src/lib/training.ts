/**
 * Entrenamiento ampliado (Fase 4, docs/GeoSpeed_Plan_Competencia.md §3): qué practicar (región y nivel de las
 * ciudades), tamaño de la tanda (6 · 10 · 20) y reloj opcional. Sin vidas ni puntaje; no cuenta para la racha
 * ni el ranking. La última configuración se recuerda en este teléfono.
 */
import type { City, Difficulty, GameMode } from '@/data/cities';
import { isPackMode } from '@/data/cities';
import { catalogPool, getRandomItems, isCategory, type Category } from '@/lib/catalog';
import { getCachedMemory } from '@/lib/itemMemory';

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

/**
 * Tanda de entrenamiento. En un pack (Colombia, packs Pro) el repaso del día no puede jugarse (va en el mapa del
 * mundo), así que lo que toca repasar de ese pack entra primero aquí: "las que fallaste vuelven" se cumple entrenando
 * el pack. Fuera de los packs, la tanda es al azar como siempre (esas falladas sí van al Repaso del día).
 */
export function trainingCities(cfg: TrainingCfg, memory = getCachedMemory()): City[] {
  const fresh = getRandomItems(cfg.category, cfg.difficulty, cfg.size, cfg.mode);
  if (!isPackMode(cfg.mode)) return fresh;
  const pool = new Map(catalogPool(cfg.category, cfg.mode).map((c) => [c.id ?? c.name, c]));
  const due = memory
    .filter((m) => m.due && pool.has(m.item_id))
    .sort((a, b) => a.box - b.box || (a.next_review_on ?? '').localeCompare(b.next_review_on ?? ''))
    .slice(0, Math.ceil(cfg.size / 2)) // mitad repaso como máximo: la tanda sigue trayendo lugares nuevos
    .map((m) => pool.get(m.item_id)!);
  if (!due.length) return fresh;
  const ids = new Set(due.map((c) => c.id ?? c.name));
  return shuffled([...due, ...fresh.filter((c) => !ids.has(c.id ?? c.name))].slice(0, cfg.size));
}

/** Orden al azar (la ronda extra con las falladas no las repite en el mismo orden) */
export function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
