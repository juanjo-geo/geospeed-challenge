/**
 * F5 · Historial unificado.
 *  - Con sesión: `game_results` del servidor (paginado por cursor) + `game_rounds` para el detalle.
 *  - Sin sesión (invitado sin anónimo activo): cola offline `geospeed_pending_results` (trae rondas)
 *    + historial local heredado `geospeed_history` (sin rondas → sin "Ver detalle").
 * Las dos fuentes exponen la misma forma para que la pantalla no distinga.
 */
import { supabase } from '@/integrations/supabase/client';
import { kindFromPlaceId } from '@/lib/catalog';
import { fetchMyHistory, fetchMyResultRounds, readPendingResults, type SaveRoundInput, type GameType, type EndReason } from '@/lib/gameResults';
import { getGameHistory } from '@/lib/gameUtils';
import type { RoundResult } from '@/components/game/GameScreen';
import type { Difficulty } from '@/data/cities';

export interface HistoryItem {
  id: string;
  gameType: GameType;
  mode: string;
  difficulty: string;
  /** Fase 6: qué se ubicó (cities · flags) */
  category: string;
  score: number;
  roundsPlayed: number;
  roundsTotal: number;
  avgDistanceKm: number | null;
  endReason: EndReason;
  createdAt: string;
  source: 'server' | 'local';
  /** Rondas ya disponibles (cola offline); en servidor se piden al abrir el detalle */
  rounds?: SaveRoundInput[] | null;
  /** false = partida heredada sin detalle por ciudad */
  hasDetail: boolean;
}

export interface HistoryFilters { mode?: string; difficulty?: string; category?: string }
export const HISTORY_PAGE = 20;

export async function hasSession(): Promise<boolean> {
  try { const { data } = await supabase.auth.getSession(); return !!data.session; } catch { return false; }
}

function localItems(): HistoryItem[] {
  const pending: HistoryItem[] = readPendingResults().map((p, i) => {
    const rounds = (p.rounds as SaveRoundInput[] | undefined) ?? [];
    return {
      id: String(p.client_id ?? `pending-${i}`), gameType: (p.game_type as GameType) ?? 'classic', mode: String(p.mode ?? 'world'), category: String(p.category ?? 'cities'),
      difficulty: String(p.difficulty ?? 'basic'), score: Number(p.score ?? 0), roundsPlayed: Number(p.rounds_played ?? rounds.length),
      roundsTotal: Number(p.rounds_total ?? rounds.length), avgDistanceKm: p.avg_distance_km == null ? null : Number(p.avg_distance_km),
      endReason: (p.end_reason as EndReason) ?? 'complete', createdAt: String(p.created_at ?? new Date(0).toISOString()),
      source: 'local', rounds, hasDetail: rounds.length > 0,
    };
  });
  const legacy: HistoryItem[] = getGameHistory().map((h, i) => ({
    id: `legacy-${i}-${h.date}`, gameType: h.mode === 'mundial' ? 'mundial' : h.type === 'timeattack' ? 'timeattack' : h.type === 'daily' ? 'daily' : 'classic',
    mode: h.mode, category: 'cities', difficulty: h.difficulty, score: h.score, roundsPlayed: h.rounds, roundsTotal: h.type === 'timeattack' ? h.rounds : 13,
    avgDistanceKm: h.avgDistance || null, endReason: 'complete', createdAt: h.date, source: 'local', rounds: null, hasDetail: false,
  }));
  // Una partida puede estar en las dos listas (misma fecha ±2 s): nos quedamos con la que trae rondas
  const merged = [...pending];
  for (const l of legacy) {
    const dup = pending.some(p => Math.abs(new Date(p.createdAt).getTime() - new Date(l.createdAt).getTime()) < 2000 && p.score === l.score);
    if (!dup) merged.push(l);
  }
  return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function applyFilters(items: HistoryItem[], f: HistoryFilters): HistoryItem[] {
  return items.filter(i => (!f.mode || i.mode === f.mode) && (!f.difficulty || i.difficulty === f.difficulty) && (!f.category || i.category === f.category));
}

/** Página de historial. `before` = createdAt del último elemento cargado. */
export async function fetchHistoryPage(f: HistoryFilters, before?: string): Promise<{ items: HistoryItem[]; hasMore: boolean; source: 'server' | 'local' }> {
  if (await hasSession()) {
    const rows = await fetchMyHistory({ mode: f.mode, difficulty: f.difficulty, category: f.category, before, limit: HISTORY_PAGE + 1 });
    const items: HistoryItem[] = rows.slice(0, HISTORY_PAGE).map(r => ({
      id: r.id, gameType: r.gameType, mode: r.mode, category: r.category, difficulty: r.difficulty, score: r.score, roundsPlayed: r.roundsPlayed,
      roundsTotal: r.roundsTotal, avgDistanceKm: r.avgDistanceKm, endReason: r.endReason, createdAt: r.createdAt,
      source: 'server', rounds: null, hasDetail: true,
    }));
    return { items, hasMore: rows.length > HISTORY_PAGE, source: 'server' };
  }
  const all = applyFilters(localItems(), f);
  const start = before ? all.findIndex(i => i.createdAt < before) : 0;
  const from = start < 0 ? all.length : start;
  const items = all.slice(from, from + HISTORY_PAGE);
  return { items, hasMore: from + HISTORY_PAGE < all.length, source: 'local' };
}

/** ¿Hay alguna partida (sin filtros)? Distingue "vacío" de "sin coincidencias". */
export async function hasAnyHistory(): Promise<boolean> {
  if (await hasSession()) return (await fetchMyHistory({ limit: 1 })).length > 0;
  return localItems().length > 0;
}

/** Rondas de una partida en la forma del Clásico (para Tus respuestas / Revisión por ciudad). */
export async function loadRounds(item: HistoryItem): Promise<RoundResult[]> {
  const rows = item.rounds && item.rounds.length > 0 ? item.rounds : item.source === 'server' ? await fetchMyResultRounds(item.id) : [];
  return rows.map(r => ({
    city: { ...kindFromPlaceId(r.place_id), name: r.city_name, country: r.city_country ?? '', lat: r.city_lat ?? 0, lon: r.city_lon ?? 0, difficulty: item.difficulty as Difficulty },
    clickLat: r.click_lat ?? r.city_lat ?? 0, clickLon: r.click_lon ?? r.city_lon ?? 0,
    distance: r.distance_km ?? 0, basePoints: r.base_points ?? 0, multiplier: r.multiplier ?? 1, totalPoints: r.points, timeUsed: r.time_s ?? 0,
  }));
}
