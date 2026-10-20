import { supabase } from '@/integrations/supabase/client';
import { appNumberLocale } from '@/lib/format';
import { SCORING_VERSION, SEASON_1_START } from '@/lib/scoring';

const R = 6371; // Earth radius in km

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// El puntaje de cada ronda (cercanía × rapidez × combo × dificultad) vive en src/lib/scoring.ts (puntaje v2,
// Temporada 1). La curva anterior 1000 × (1 − d/7000)^1.5 quedó en las tablas "Histórico".

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km).toLocaleString(appNumberLocale())} km`;
}

export interface LeaderboardEntry {
  initials: string;
  score: number;
  difficulty: string;
  mode: string;
  date: string;
  user_id?: string;
  /** Versión del puntaje (2 = Temporada 1). Las entradas sin versión son de la escala anterior. */
  v?: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  bestScore: number;
  totalDistance: number;
  totalRounds: number;
  /** Puntaje v2 (Temporada 1): el récord se reinicia y el anterior queda en legacyBest */
  scoringVersion?: number;
  legacyBest?: number;
}

// --- Leaderboard (Supabase Cloud) ---

export type LeaderboardPeriod = 'all' | 'week' | 'month';

export async function getLeaderboard(mode?: string, period: LeaderboardPeriod = 'all', difficulty?: string): Promise<LeaderboardEntry[]> {
  try {
    let query = supabase
      .from('leaderboard')
      .select('initials, score, difficulty, mode, created_at')
      .order('score', { ascending: false })
      .limit(10);
    if (mode) query = query.eq('mode', mode);
    if (difficulty) query = query.eq('difficulty', difficulty);
    // Temporada 1 (puntaje v2): las iniciales anteriores tienen otra escala de puntos
    query = query.gte('created_at', SEASON_1_START);

    // Time-period filter
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    const cloud: LeaderboardEntry[] = (data || []).map(row => ({
      initials: row.initials,
      score: row.score,
      difficulty: row.difficulty,
      mode: row.mode || 'world',
      date: row.created_at.split('T')[0],
    }));
    // Mezclar con entradas locales (por si submit-score falló pero se guardó local)
    return mergeLeaderboards(cloud, getLeaderboardLocal(), mode, difficulty);
  } catch {
    return getLeaderboardLocal(mode, difficulty);
  }
}

/** Combina dos listas de leaderboard, deduplica por iniciales+score y ordena desc */
function mergeLeaderboards(a: LeaderboardEntry[], b: LeaderboardEntry[], mode?: string, difficulty?: string): LeaderboardEntry[] {
  const all = [...a, ...b].filter(e => (!mode || (e.mode || 'world') === mode) && (!difficulty || e.difficulty === difficulty));
  const seen = new Set<string>();
  const unique: LeaderboardEntry[] = [];
  for (const e of all) {
    const key = `${e.initials}|${e.score}|${e.mode || 'world'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }
  unique.sort((x, y) => y.score - x.score);
  return unique.slice(0, 10);
}

export async function addToLeaderboard(entry: LeaderboardEntry): Promise<boolean> {
  // 1) Guardar SIEMPRE en local primero — así el score nunca se pierde aunque la nube falle
  saveLeaderboardLocal({ ...entry, v: SCORING_VERSION });

  // 2) Intentar enviar a la nube (best-effort)
  try {
    const body: Record<string, unknown> = {
      initials: entry.initials,
      score: entry.score,
      difficulty: entry.difficulty,
      mode: entry.mode,
    };
    if (entry.user_id) body.user_id = entry.user_id;

    const { data, error } = await supabase.functions.invoke('submit-score', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  } catch (e) {
    // La nube falló pero el score ya quedó local; el ranking lo mostrará igual
    console.warn('[leaderboard] submit-score falló, guardado solo local:', e);
  }

  // 3) Confirmar que la entrada está presente (nube o local)
  const board = await getLeaderboard(entry.mode);
  return board.some(e => e.initials === entry.initials && e.score === entry.score);
}

/** Guarda una entrada en el leaderboard local (dedup + top 10) */
function saveLeaderboardLocal(entry: LeaderboardEntry): void {
  try {
    const board = getLeaderboardLocal();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const unique = board.filter(e => {
      const k = `${e.initials}|${e.score}|${e.mode || 'world'}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    localStorage.setItem('geospeed_leaderboard', JSON.stringify(unique.slice(0, 50)));
  } catch { /* ignore quota errors */ }
}

export async function qualifiesForLeaderboard(score: number, mode?: string, difficulty?: string): Promise<boolean> {
  if (score <= 0) return false;
  try {
    // Comparar contra el ranking DEL MODO que el jugador ve (no el global mezclado)
    const board = await getLeaderboard(mode, 'all', difficulty);
    return board.length < 10 || score > board[board.length - 1].score;
  } catch {
    // Si falla la consulta, ser permisivo: mejor permitir guardar que perder el score
    return true;
  }
}

function getLeaderboardLocal(mode?: string, difficulty?: string): LeaderboardEntry[] {
  try {
    const all: LeaderboardEntry[] = JSON.parse(localStorage.getItem('geospeed_leaderboard') || '[]');
    const filtered = all.filter(e => e.v === SCORING_VERSION && (!mode || (e.mode || 'world') === mode) && (!difficulty || e.difficulty === difficulty));
    return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch { return []; }
}

// --- Player Stats (localStorage — personal) ---

export function getPlayerStats(): PlayerStats {
  let stats: PlayerStats;
  try {
    stats = JSON.parse(localStorage.getItem('geospeed_stats') || '{"gamesPlayed":0,"bestScore":0,"totalDistance":0,"totalRounds":0}');
  } catch {
    return { gamesPlayed: 0, bestScore: 0, totalDistance: 0, totalRounds: 0, scoringVersion: SCORING_VERSION };
  }
  // Temporada 1 (puntaje v2): el récord personal arranca de nuevo; el anterior se guarda aparte
  if (stats.scoringVersion !== SCORING_VERSION) {
    stats = { ...stats, legacyBest: stats.bestScore, bestScore: 0, scoringVersion: SCORING_VERSION };
    try { localStorage.setItem('geospeed_stats', JSON.stringify(stats)); } catch { /* sin almacenamiento */ }
  }
  return stats;
}

export function updatePlayerStats(score: number, distances: number[]) {
  const stats = getPlayerStats();
  stats.gamesPlayed++;
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.totalDistance += distances.reduce((a, b) => a + b, 0);
  stats.totalRounds += distances.length;
  localStorage.setItem('geospeed_stats', JSON.stringify(stats));
}

// --- Game History (localStorage) ---

export interface GameHistoryEntry {
  date: string;
  score: number;
  rounds: number;
  difficulty: string;
  mode: string;
  avgDistance: number;
  type: 'classic' | 'timeattack' | 'daily';
  /** Versión del puntaje (2 = Temporada 1); las anteriores no cuentan para los récords */
  v?: number;
}

const MAX_HISTORY = 20;

export function getGameHistory(): GameHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem('geospeed_history') || '[]');
  } catch {
    return [];
  }
}

export function addGameHistory(entry: GameHistoryEntry) {
  const history = getGameHistory();
  history.unshift({ ...entry, v: entry.v ?? SCORING_VERSION });
  localStorage.setItem('geospeed_history', JSON.stringify(history.slice(0, MAX_HISTORY)));
}

/**
 * Get the count of players who submitted scores today (for social proof in Daily Challenge).
 * Uses Supabase leaderboard table filtered by today's date.
 */
export async function getDailyPlayerCount(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
