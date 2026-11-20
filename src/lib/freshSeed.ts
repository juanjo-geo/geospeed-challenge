/**
 * Semilla "fresca" para una partida nueva: entre varias semillas al azar, la que repite menos lugares de las últimas
 * partidas del mismo mapa (región × nivel × categoría). La partida sigue siendo determinista por su semilla, así que
 * "Reta a un amigo" (que comparte la semilla) le da al amigo las mismas ciudades.
 *
 * Por qué: el nivel Rookie del mundo tiene 47 ciudades y una partida usa 13; elegidas al azar, dos partidas seguidas
 * compartían 3 o 4 ciudades y los testers lo notaban. Con esto, mientras el mapa tenga lugares sin ver, no se repiten.
 * En mapas de 20 lugares (Turista, continentes) alguna repetición es inevitable, pero salen primero las menos recientes.
 */
import type { Difficulty, GameMode } from '@/data/cities';
import { getRandomItems, type Category } from './catalog';

const KEY = 'geospeed_recent_items';
/** Lugares recordados por mapa: unas 4 partidas */
const KEEP = 52;
/** Semillas que se prueban como máximo y tiempo máximo de búsqueda (cada intento es un barajado del mapa: unos µs) */
const TRIES = 3000;
const BUDGET_MS = 80;

type Recent = Record<string, string[]>;

function read(): Recent {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Recent; } catch { return {}; }
}
function write(r: Recent) {
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* sin almacenamiento */ }
}

const mapKey = (category: Category, difficulty: Difficulty, mode: GameMode) => `${mode}|${difficulty}|${category}`;
const idOf = (c: { id?: string; name: string }) => c.id ?? c.name;
const randomSeed = () => Math.floor(Math.random() * 1_000_000);

/**
 * Costo de una lista: repetir un lugar de la última partida (los primeros `lastGame` de recent) cuesta 1.000; los de
 * partidas anteriores pesan más cuanto más recientes. recent[0] es el más reciente.
 */
export function overlapCost(ids: string[], recent: string[], lastGame = 13): number {
  const pos = new Map(recent.map((id, i) => [id, i] as const));
  let cost = 0;
  for (const id of ids) {
    const p = pos.get(id);
    if (p !== undefined) cost += p < lastGame ? 1000 : recent.length - p;
  }
  return cost;
}

/** budgetMs: solo para las pruebas (sin límite de tiempo el resultado no depende de la carga de la máquina) */
export function freshSeed(category: Category, difficulty: Difficulty, mode: GameMode, count = 13, budgetMs = BUDGET_MS): number {
  const key = mapKey(category, difficulty, mode);
  const all = read();
  const recent = all[key] ?? [];
  let best = randomSeed();
  let bestIds: string[] = [];
  let bestCost = Infinity;
  const t0 = performance.now();
  try {
    for (let i = 0; i < TRIES && performance.now() - t0 < budgetMs; i++) {
      const seed = i === 0 ? best : randomSeed();
      const ids = getRandomItems(category, difficulty, count, mode, seed).map(idOf);
      if (!ids.length) return seed; // catálogo aún sin descargar: semilla al azar, como antes
      const cost = recent.length ? overlapCost(ids, recent, count) : 0;
      if (cost < bestCost) { best = seed; bestIds = ids; bestCost = cost; }
      if (cost === 0) break;
    }
  } catch {
    return best;
  }
  all[key] = [...bestIds, ...recent.filter((id) => !bestIds.includes(id))].slice(0, KEEP);
  write(all);
  return best;
}
