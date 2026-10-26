/**
 * Favoritos (Fase 10, spec §5): estrella en una configuración del Clásico (región · dificultad · categoría), un modo
 * (diario, Caos, Mundial, entrenamiento…) o un quiz (propio o compartido). Hasta 20, ordenados por uso reciente, en la
 * sección "Favoritos" del Inicio. Los guarda el servidor (my_favorites, favorite_toggle, favorite_touch); aquí hay una
 * caché para mostrarlos al instante.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isMockQuizzes, mockFavorites } from '@/lib/quizzesMock';

export type FavType = 'classic' | 'mode' | 'quiz';
export interface Favorite { type: FavType; id: string; used: string }
export const FAV_MAX = 20;
/** Modos que se pueden marcar (MoreModes, diario) */
export type FavMode = 'daily' | 'caos' | 'impossible' | 'mundial' | 'training' | 'memory' | 'sprint' | 'quizzes';

const CACHE_KEY = 'geospeed_favorites';
export const FAVORITES_EVENT = 'geospeed:favorites';
export const classicFavId = (mode: string, difficulty: string, category: string) => `${mode}|${difficulty}|${category}`;

export function getCachedFavorites(): Favorite[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') as Favorite[]; } catch { return []; }
}
function setCache(list: Favorite[]) {
  const sorted = [...list].sort((a, b) => b.used.localeCompare(a.used)).slice(0, FAV_MAX);
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(sorted)); } catch { /* sin espacio */ }
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: sorted }));
}

export async function fetchFavorites(): Promise<Favorite[]> {
  if (isMockQuizzes()) { setCache(mockFavorites.list()); return getCachedFavorites(); }
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return getCachedFavorites();
    const { data, error } = await supabase.rpc('my_favorites');
    if (error || !data) return getCachedFavorites();
    setCache(data as unknown as Favorite[]);
    return getCachedFavorites();
  } catch {
    return getCachedFavorites();
  }
}

export const isFavorite = (list: Favorite[], type: FavType, id: string) => list.some((f) => f.type === type && f.id === id);

/** Marca o desmarca. 'limit' = ya hay 20; 'offline' = sin sesión posible o sin red */
export async function toggleFavorite(type: FavType, id: string): Promise<{ on: boolean } | { error: 'limit' | 'offline' }> {
  const list = getCachedFavorites();
  const was = isFavorite(list, type, id);
  if (!was && list.length >= FAV_MAX) return { error: 'limit' };
  if (isMockQuizzes()) {
    const on = mockFavorites.toggle(type, id);
    setCache(mockFavorites.list());
    return { on };
  }
  try {
    const { ensureGuestSession } = await import('@/lib/identity');
    if ((await ensureGuestSession({ force: true })) === 'unavailable') return { error: 'offline' };
    const { data, error } = await supabase.rpc('favorite_toggle', { p_type: type, p_id: id });
    if (error) return { error: error.message?.includes('fav_limit') ? 'limit' : 'offline' };
    const on = data === true;
    setCache(on ? [{ type, id, used: new Date().toISOString() }, ...list] : list.filter((f) => !(f.type === type && f.id === id)));
    return { on };
  } catch {
    return { error: 'offline' };
  }
}

/** Usar un favorito lo sube al principio (también si se abre por su camino normal) */
export function touchFavorite(type: FavType, id: string): void {
  const list = getCachedFavorites();
  if (!isFavorite(list, type, id)) return;
  setCache(list.map((f) => (f.type === type && f.id === id ? { ...f, used: new Date().toISOString() } : f)));
  if (isMockQuizzes()) { mockFavorites.touch(type, id); return; }
  void supabase.rpc('favorite_touch', { p_type: type, p_id: id }).then(() => {}, () => {});
}

// Nombre de los quizzes marcados (el favorito guarda solo el código): se recuerda al verlos
const NAMES_KEY = 'geospeed_quiz_names';
export function rememberQuizName(code: string, name: string): void {
  try {
    const m = JSON.parse(localStorage.getItem(NAMES_KEY) || '{}') as Record<string, string>;
    if (m[code] === name) return;
    m[code] = name;
    localStorage.setItem(NAMES_KEY, JSON.stringify(m));
  } catch { /* sin almacenamiento */ }
}
export function quizNameOf(code: string): string | null {
  try { return (JSON.parse(localStorage.getItem(NAMES_KEY) || '{}') as Record<string, string>)[code] ?? null; } catch { return null; }
}

export function useFavorites(): Favorite[] {
  const [list, setList] = useState<Favorite[]>(getCachedFavorites);
  useEffect(() => {
    const on = (e: Event) => setList((e as CustomEvent<Favorite[]>).detail);
    window.addEventListener(FAVORITES_EVENT, on);
    fetchFavorites();
    return () => window.removeEventListener(FAVORITES_EVENT, on);
  }, []);
  return list;
}
