/**
 * GeoSpeed — Resultados de partida en servidor (F1)
 *
 * Toda partida terminada se guarda en `game_results` + `game_rounds` a través de la
 * RPC `save_game_result` (atómica e idempotente por client_id). Requiere sesión
 * (registrada o anónima). Si no hay sesión o falla la red, el payload se encola en
 * localStorage y se reintenta en el siguiente arranque / login (`flushPendingResults`).
 *
 * El historial y las estadísticas locales (gameUtils) siguen escribiéndose: son la
 * fuente para invitados sin sesión y el respaldo offline. F5 pasará la UI a leer
 * de aquí (`fetchMyProgress`, `fetchMyHistory`, `fetchLeaderboardTop`, `fetchMyRank`).
 */
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/lib/catalog';
import { SCORING_VERSION } from '@/lib/scoring';
import { placeIdOf } from '@/data/cities';
import type { Json } from '@/integrations/supabase/types';
import type { RoundResult } from '@/components/game/GameScreen';
import type { TimeAttackResult } from '@/components/game/TimeAttackScreen';
import { getGameHistory, getPlayerStats, type GameHistoryEntry } from './gameUtils';
import { ensureGuestSession } from './identity';

export type GameType = 'classic' | 'daily' | 'timeattack' | 'mundial' | 'speeddemon' | 'training' | 'challenge' | 'duel' | 'sprint' | 'quiz' | 'quiz_free';
export type EndReason = 'complete' | 'timeout' | 'abandoned';

export interface SaveRoundInput {
  round_no: number;
  /** Lugar del catálogo (tabla `places`): el servidor mide la distancia contra sus coordenadas */
  place_id?: string | null;
  city_name: string;
  city_country?: string | null;
  city_lat?: number | null;
  city_lon?: number | null;
  click_lat?: number | null;
  click_lon?: number | null;
  distance_km?: number | null;
  time_s?: number | null;
  base_points?: number | null;
  multiplier?: number | null;
  points: number;
  extra?: Record<string, Json | undefined> | null;
}

export interface SaveGameInput {
  gameType: GameType;
  mode: string;
  difficulty: string;
  score: number;
  roundsPlayed: number;
  roundsTotal: number;
  avgDistanceKm?: number | null;
  endReason: EndReason;
  seed?: number | null;
  challengeId?: string | null;
  /** Desafío diario: número del diario que se jugó (el servidor registra el día y la racha) */
  dailyNo?: number | null;
  /** Fase 6: qué se ubicó (ciudades por defecto; el servidor valida el valor) */
  category?: Category;
  /** Fase 10: quiz jugado (el servidor guarda el mejor puntaje en su mini ranking) */
  quizCode?: string | null;
  rounds: SaveRoundInput[];
  /** Para reintentos: si no se pasa, se genera uno. */
  clientId?: string;
}

const PENDING_KEY = 'geospeed_pending_results';
const PENDING_CAP = 20;

function newClientId(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

/** Payload de una partida tal como lo recibe save_game_result (el Sprint lo entrega con sprint_submit) */
export function buildSavePayload(input: SaveGameInput): Json {
  return toPayload(input, input.clientId ?? newClientId());
}

function toPayload(input: SaveGameInput, clientId: string): Json {
  return {
    client_id: clientId,
    created_at: new Date().toISOString(), // la RPC lo ignora; lo usa el historial local mientras no hay sesión
    game_type: input.gameType,
    mode: input.mode,
    difficulty: input.difficulty,
    score: Math.round(input.score),
    rounds_played: input.roundsPlayed,
    rounds_total: input.roundsTotal,
    avg_distance_km: input.avgDistanceKm == null ? null : Math.round(input.avgDistanceKm * 10) / 10,
    end_reason: input.endReason,
    seed: input.seed ?? null,
    challenge_id: input.challengeId ?? null,
    daily_no: input.dailyNo ?? null,
    category: input.category ?? 'cities',
    quiz_code: input.quizCode ?? null,
    // Fase 11: terminada sin señal → cuenta para el progreso, no para los rankings
    offline: typeof navigator !== 'undefined' && navigator.onLine === false,
    // Puntaje v2 (Temporada 1): el servidor recalcula cada ronda desde el clic, la ciudad y el tiempo
    scoring_version: SCORING_VERSION,
    rounds: input.rounds.map(r => ({
      round_no: r.round_no,
      place_id: r.place_id ?? null,
      city_name: r.city_name,
      city_country: r.city_country ?? null,
      city_lat: r.city_lat ?? null,
      city_lon: r.city_lon ?? null,
      click_lat: r.click_lat ?? null,
      click_lon: r.click_lon ?? null,
      distance_km: r.distance_km == null ? null : Math.round(r.distance_km * 10) / 10,
      // En décimas: es exactamente el tiempo con el que se puntuó la ronda
      time_s: r.time_s == null ? null : Math.round(r.time_s * 10) / 10,
      base_points: r.base_points ?? null,
      multiplier: r.multiplier ?? null,
      points: Math.round(r.points),
      extra: (r.extra ?? null) as Json,
    })),
  } as Json;
}

// ── Cola offline ────────────────────────────────────────────────────────────
function readPending(): Json[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
function writePending(list: Json[]) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-PENDING_CAP))); } catch { /* sin espacio: se pierde el más viejo */ }
}
function enqueue(payload: Json) {
  const list = readPending();
  list.push(payload);
  writePending(list);
}

async function rpcSave(payload: Json): Promise<{ id: string | null; retryable: boolean }> {
  const { data, error } = await supabase.rpc('save_game_result', { p: payload });
  if (error) {
    // 42501 = sin sesión (no reintentar hasta que haya login); errores de red/5xx sí.
    const retryable = !/42501|not authenticated|permission denied/i.test(error.message + (error.code ?? ''));
    console.warn('[gameResults] save failed:', error.message);
    return { id: null, retryable };
  }
  return { id: (data as string | null) ?? null, retryable: false };
}

/**
 * Guarda una partida. Devuelve el id del resultado o null si quedó en cola / sin sesión.
 * Nunca lanza: el final de partida no debe romperse por el servidor.
 */
export async function saveGameResult(input: SaveGameInput): Promise<string | null> {
  const clientId = input.clientId ?? newClientId();
  const payload = toPayload(input, clientId);
  try {
    // D1: la primera partida terminada crea la sesión anónima (perezosa: quien solo mira no cuenta)
    const guest = await ensureGuestSession();
    if (guest === 'unavailable') {
      // Anónimo desactivado o sin red: guardar para cuando exista sesión (anónima o cuenta)
      enqueue(payload);
      return null;
    }
    // Recién creada: primero lo que estaba en cola (historial heredado incluido)
    if (guest === 'created') await flushPendingResults().catch(() => 0);
    const res = await rpcSave(payload);
    if (!res.id && res.retryable) enqueue(payload);
    return res.id;
  } catch (e) {
    console.warn('[gameResults] save threw:', e);
    enqueue(payload);
    return null;
  }
}

/** Reintenta lo encolado. Llamar al arrancar con sesión y tras login. */
export async function flushPendingResults(): Promise<number> {
  const list = readPending();
  if (list.length === 0) return 0;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;
  } catch { return 0; }
  const remaining: Json[] = [];
  let saved = 0;
  for (const payload of list) {
    const res = await rpcSave(payload);
    if (res.id) saved++;
    else if (res.retryable) remaining.push(payload);
    // no reintentable (p. ej. payload inválido): se descarta
  }
  writePending(remaining);
  return saved;
}

// ── Adaptadores desde los tipos de pantalla ─────────────────────────────────
export function roundsFromResults(rounds: RoundResult[]): SaveRoundInput[] {
  return rounds.map((r, i) => ({
    round_no: i + 1,
    place_id: placeIdOf(r.city),
    city_name: r.city.name,
    city_country: r.city.country,
    city_lat: r.city.lat,
    city_lon: r.city.lon,
    click_lat: r.timedOut ? null : r.clickLat,
    click_lon: r.timedOut ? null : r.clickLon,
    distance_km: r.timedOut ? null : r.distance,
    time_s: r.timeExact ?? r.timeUsed,
    base_points: r.basePoints,
    multiplier: r.multiplier,
    points: r.totalPoints,
    extra: r.combo != null ? { combo: r.combo, combo_mult: r.comboMult ?? 1 } : null,
  }));
}

export function roundsFromTimeAttack(rounds: TimeAttackResult['rounds']): SaveRoundInput[] {
  // Desde F2 las rondas de Caos traen clic, base y multiplicador (misma forma que RoundResult)
  return roundsFromResults(rounds);
}

export function avgDistance(rounds: { distance: number }[]): number | null {
  if (rounds.length === 0) return null;
  return rounds.reduce((s, r) => s + r.distance, 0) / rounds.length;
}

// ── Migración del historial local (una vez por usuario y dispositivo) ───────
/**
 * Sube las ≤20 partidas del historial local y el XP local como `xp_legacy`.
 * Idempotente en servidor; el flag local evita repetir la llamada en cada login.
 */
export async function importLegacyHistoryOnce(userId: string): Promise<void> {
  const flag = `geospeed_legacy_imported_${userId}`;
  try {
    if (localStorage.getItem(flag)) return;
    const entries: GameHistoryEntry[] = getGameHistory();
    const stats = getPlayerStats();
    const localXp = entries.reduce((s, g) => s + g.score, 0) || Math.round(stats.bestScore * stats.gamesPlayed * 0.3);
    const { error } = await supabase.rpc('import_legacy_history', {
      p: { xp_legacy: localXp, entries: entries as unknown as Json } as Json,
    });
    if (error) {
      console.warn('[gameResults] legacy import failed:', error.message);
      return; // se reintenta en el próximo login
    }
    localStorage.setItem(flag, new Date().toISOString());
  } catch (e) {
    console.warn('[gameResults] legacy import threw:', e);
  }
}

// ── Lecturas (las usa F5; se dejan listas) ──────────────────────────────────
export interface MyProgress {
  gamesPlayed: number;
  bestScore: number;
  totalXp: number;
  totalRounds: number;
  avgDistanceKm: number | null;
}

export async function fetchMyProgress(): Promise<MyProgress | null> {
  const { data, error } = await supabase.rpc('my_progress');
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    gamesPlayed: Number(row.games_played ?? 0),
    bestScore: Number(row.best_score ?? 0),
    totalXp: Number(row.total_xp ?? 0),
    totalRounds: Number(row.total_rounds ?? 0),
    avgDistanceKm: row.avg_distance_km == null ? null : Number(row.avg_distance_km),
  };
}

export interface LeaderboardTopRow {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  bestScore: number;
  achievedAt: string;
  /** Título y marco ganados con la racha del diario (Fase 2) */
  activeTitle?: string | null;
  activeFrame?: string | null;
}

export type RankPeriod = 'all' | 'week' | 'month';
/** Temporada 1 = puntaje v2 (cercanía × rapidez × combo); Histórico = escala anterior + tabla vieja */
export type RankSeason = 't1' | 'historic';
/** gameType: null = ranking de ciudades (o Mundial si mode='mundial'); 'timeattack' = 60s de Caos (tabla aparte, B2) */
export async function fetchLeaderboardTop(mode = 'world', difficulty: string | null = null, period: RankPeriod = 'all', limit = 10, gameType: string | null = null, season: RankSeason = 't1', category: Category = 'cities'): Promise<LeaderboardTopRow[]> {
  const { data, error } = await supabase.rpc('leaderboard_top', { p_mode: mode, p_difficulty: difficulty, p_period: period, p_limit: limit, p_game_type: gameType, p_season: season, p_category: category });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(r => ({
    rank: Number(r.rank), userId: String(r.user_id), displayName: String(r.display_name ?? ''),
    avatar: String(r.avatar ?? ''), bestScore: Number(r.best_score ?? 0), achievedAt: String(r.achieved_at ?? ''),
    activeTitle: (r.active_title as string | null) ?? null, activeFrame: (r.active_frame as string | null) ?? null,
  }));
}

export async function fetchMyRank(mode = 'world', difficulty: string | null = null, period: RankPeriod = 'all', gameType: string | null = null, season: RankSeason = 't1', category: Category = 'cities'): Promise<{ rank: number | null; bestScore: number | null; totalPlayers: number } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('my_rank', { p_mode: mode, p_difficulty: difficulty, p_period: period, p_game_type: gameType, p_season: season, p_category: category });
  if (error || !data) return null;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    rank: row.rank == null ? null : Number(row.rank),
    bestScore: row.best_score == null ? null : Number(row.best_score),
    totalPlayers: Number(row.total_players ?? 0),
  };
}

export interface MyHistoryRow {
  id: string;
  gameType: GameType;
  mode: string;
  difficulty: string;
  score: number;
  roundsPlayed: number;
  roundsTotal: number;
  avgDistanceKm: number | null;
  endReason: EndReason;
  isRecord: boolean;
  createdAt: string;
  category: string;
}

/** Detalle por ciudad de una partida del servidor (game_rounds es privada: solo las propias). */
export async function fetchMyResultRounds(resultId: string): Promise<SaveRoundInput[]> {
  const { data, error } = await supabase
    .from('game_rounds')
    .select('round_no, place_id, city_name, city_country, city_lat, city_lon, click_lat, click_lon, distance_km, time_s, base_points, multiplier, points')
    .eq('result_id', resultId)
    .order('round_no', { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    round_no: r.round_no, place_id: r.place_id, city_name: r.city_name, city_country: r.city_country, city_lat: r.city_lat, city_lon: r.city_lon,
    click_lat: r.click_lat, click_lon: r.click_lon, distance_km: r.distance_km == null ? null : Number(r.distance_km),
    time_s: r.time_s == null ? null : Number(r.time_s), base_points: r.base_points,
    multiplier: r.multiplier == null ? null : Number(r.multiplier), points: r.points,
  }));
}

/** Cola offline leída (para el historial local de invitados). */
export function readPendingResults(): Array<Record<string, unknown>> {
  return readPending() as Array<Record<string, unknown>>;
}

/** Historial paginado por cursor (created_at del último elemento). */
export async function fetchMyHistory(opts: { mode?: string; difficulty?: string; category?: string; before?: string; limit?: number } = {}): Promise<MyHistoryRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  let q = supabase
    .from('game_results')
    .select('id, game_type, mode, difficulty, score, rounds_played, rounds_total, avg_distance_km, end_reason, is_record, created_at, category')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 20);
  if (opts.mode) q = q.eq('mode', opts.mode);
  if (opts.difficulty) q = q.eq('difficulty', opts.difficulty);
  if (opts.category) q = q.eq('category', opts.category);
  if (opts.before) q = q.lt('created_at', opts.before);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, gameType: r.game_type as GameType, mode: r.mode, difficulty: r.difficulty, score: r.score,
    roundsPlayed: r.rounds_played, roundsTotal: r.rounds_total,
    avgDistanceKm: r.avg_distance_km == null ? null : Number(r.avg_distance_km),
    endReason: r.end_reason as EndReason, isRecord: r.is_record, createdAt: r.created_at, category: r.category ?? 'cities',
  }));
}
