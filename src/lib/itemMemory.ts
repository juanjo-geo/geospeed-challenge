/**
 * Memoria de lugares (Fase 4, docs/GeoSpeed_Plan_Competencia.md §3 y §10): lo que el juego recuerda de cada
 * ciudad del catálogo para cada jugador. La escribe el servidor al guardar cualquier partida con ciudades
 * (save_game_result → user_item_memory, cajas 1–5 con intervalos 1 · 2 · 4 · 7 · 15 días); aquí se lee
 * (RPC my_memory) y se arma:
 *  - el "Repaso del día": lo que toca hoy, máximo 10;
 *  - el porcentaje dominado por región del entrenamiento y la pantalla "Tu memoria".
 * Dominado = superó sus 5 repasos, o 3 aciertos seguidos sin haberlo fallado nunca (lo decide el servidor).
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCitiesByMode, placeIdOf, type City, type GameMode } from '@/data/cities';
import { catalogItem } from '@/lib/catalog';

export interface MemoryItem {
  item_id: string;
  box: number;
  next_review_on: string | null;
  fails: number;
  successes: number;
  streak: number;
  mastered: boolean;
  dominated: boolean;
  due: boolean;
}

export const REVIEW_MAX = 10;
export const TRAINING_REGIONS: GameMode[] = ['world', 'europe', 'asia', 'americas', 'africa', 'colombia'];
export const MEMORY_EVENT = 'geospeed:memory';
const CACHE_KEY = 'geospeed_memory_cache';

export function getCachedMemory(): MemoryItem[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') as MemoryItem[]; } catch { return []; }
}

/** Lee la memoria del servidor (sin sesión no crea una: devuelve la caché). Avisa con MEMORY_EVENT. */
export async function fetchMyMemory(): Promise<MemoryItem[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return getCachedMemory();
    const { data, error } = await supabase.rpc('my_memory');
    if (error || !data) return getCachedMemory();
    const items = data as unknown as MemoryItem[];
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch { /* sin espacio */ }
    window.dispatchEvent(new CustomEvent(MEMORY_EVENT, { detail: items }));
    return items;
  } catch {
    return getCachedMemory();
  }
}

// ── Catálogo: ciudad por id (una ciudad puede estar en el mundo y en su región) ──
let byId: Map<string, City> | null = null;
export function cityById(id: string): City | undefined {
  if (!byId) {
    byId = new Map();
    for (const mode of TRAINING_REGIONS) for (const c of getCitiesByMode(mode)) if (!byId.has(placeIdOf(c))) byId.set(placeIdOf(c), c);
  }
  // Banderas, lugares, monumentos y el pack Colombia (Fase 6–7): `flag:XX`, `feat:…`, `mon:…`, `co:…`, `div:co-…`
  return byId.get(id) ?? catalogItem(id);
}

/** Lo que toca repasar hoy (las cajas más bajas y lo más atrasado primero), como ciudades del catálogo */
export function reviewCities(items: MemoryItem[], max = REVIEW_MAX): City[] {
  return items
    .filter((m) => m.due)
    .sort((a, b) => a.box - b.box || (a.next_review_on ?? '').localeCompare(b.next_review_on ?? ''))
    .map((m) => cityById(m.item_id))
    .filter((c): c is City => !!c && isReviewable(c))
    .slice(0, max);
}

/** El repaso se juega en el mapa del mundo: los ítems de un pack (municipios, departamentos, lugares solo del pack)
 *  se repasan entrenando en ese pack, así que no van al repaso del día ni se pueden "practicar" desde la ficha */
export const isReviewable = (c: Pick<City, 'id' | 'packOnly' | 'kind'>): boolean =>
  !!c.id && !c.packOnly && !c.id.startsWith('co:') && c.kind !== 'division';

/**
 * "Practicar este lugar" (ficha, Fase 8): lo manda al repaso de hoy. Crea la sesión de invitado si hace falta.
 * 'ok' | 'offline' (sin sesión posible o sin red).
 */
export async function practicePlace(id: string): Promise<'ok' | 'offline'> {
  try {
    const { ensureGuestSession } = await import('@/lib/identity');
    if ((await ensureGuestSession({ force: true })) === 'unavailable') return 'offline';
    const { data, error } = await supabase.rpc('memory_practice', { p_item: id });
    if (error || data !== true) return 'offline';
    await refreshMemory(true);
    return 'ok';
  } catch {
    return 'offline';
  }
}

export const dueCount = (items: MemoryItem[]) => Math.min(REVIEW_MAX, reviewCities(items).length);

export interface RegionMastery { mode: GameMode; dominated: number; total: number; pct: number }

/** Porcentaje dominado de una región: ciudades dominadas sobre todas las del catálogo de esa región */
export function regionMastery(items: MemoryItem[], mode: GameMode): RegionMastery {
  const ids = new Set(getCitiesByMode(mode).map(placeIdOf));
  const dominated = items.filter((m) => m.dominated && ids.has(m.item_id)).length;
  return { mode, dominated, total: ids.size, pct: ids.size ? Math.round((dominated / ids.size) * 100) : 0 };
}

export interface MemorySummary { toLearn: number; reviewing: number; dominated: number; due: number }

/** Por aprender (falladas en cajas 1–2) · en repaso (cajas 3–5) · dominadas */
export function memorySummary(items: MemoryItem[]): MemorySummary {
  let toLearn = 0, reviewing = 0, dominated = 0;
  for (const m of items) {
    if (m.dominated) dominated++;
    else if (m.fails > 0 && m.box <= 2) toLearn++;
    else if (m.fails > 0) reviewing++;
  }
  return { toLearn, reviewing, dominated, due: dueCount(items) };
}

/** Próximo día con repasos (para "vuelve el …" cuando hoy no hay) */
export function nextReviewDay(items: MemoryItem[]): string | null {
  const days = items.filter((m) => !m.due && m.fails > 0 && !m.mastered && m.next_review_on).map((m) => m.next_review_on as string).sort();
  return days[0] ?? null;
}

let lastFetch = 0;
/** Pide la memoria al servidor como mucho una vez por minuto (o ya, con force: tras guardar un entrenamiento) */
export function refreshMemory(force = false): Promise<MemoryItem[]> {
  if (!force && Date.now() - lastFetch < 60_000) return Promise.resolve(getCachedMemory());
  lastFetch = Date.now();
  return fetchMyMemory();
}

/** La memoria para una pantalla: la de la caché al instante y la del servidor cuando llega */
export function useMemory(): MemoryItem[] {
  const [items, setItems] = useState<MemoryItem[]>(getCachedMemory);
  useEffect(() => {
    const on = (e: Event) => setItems((e as CustomEvent<MemoryItem[]>).detail);
    window.addEventListener(MEMORY_EVENT, on);
    refreshMemory();
    return () => window.removeEventListener(MEMORY_EVENT, on);
  }, []);
  return items;
}
