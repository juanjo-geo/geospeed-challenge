import { supabase } from '@/integrations/supabase/client';

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

/**
 * Continuous scoring curve — every km closer = more points.
 * Formula: max(0, 1000 × (1 − d/7000)^1.5)
 * 0km=1000, 50km=989, 200km=935, 500km=832, 1000km=660, 2000km=366, 5000km=55, 7000km+=0
 */
export function calculateBasePoints(distanceKm: number): number {
  if (distanceKm >= 7000) return 0;
  return Math.round(1000 * Math.pow(1 - distanceKm / 7000, 1.5));
}

/**
 * Gradual speed multiplier — every second counts.
 * Formula: clamp(0.4, 2.2 − t × 0.13, 2.2)
 * 1s=x2.07, 3s=x1.81, 5s=x1.55, 8s=x1.16, 10s=x0.90, 14s+=x0.40
 */
export function getMultiplier(timeUsedSeconds: number): { value: number; label: string; emoji: string } {
  const raw = 2.2 - timeUsedSeconds * 0.13;
  const value = Math.round(Math.max(0.4, Math.min(2.2, raw)) * 100) / 100;
  const emoji = value >= 1.8 ? '🚀' : value >= 1.3 ? '⚡' : value >= 1.0 ? '🎯' : value >= 0.7 ? '🐢' : '🦕';
  const label = `×${value.toFixed(1)}`;
  return { value, label, emoji };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${Math.round(km).toLocaleString()} km`;
}

export interface LeaderboardEntry {
  initials: string;
  score: number;
  difficulty: string;
  mode: string;
  date: string;
  user_id?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  bestScore: number;
  totalDistance: number;
  totalRounds: number;
}

// --- Leaderboard (Supabase Cloud) ---

export type LeaderboardPeriod = 'all' | 'week' | 'month';

export async function getLeaderboard(mode?: string, period: LeaderboardPeriod = 'all'): Promise<LeaderboardEntry[]> {
  try {
    let query = supabase
      .from('leaderboard')
      .select('initials, score, difficulty, mode, created_at')
      .order('score', { ascending: false })
      .limit(10);
    if (mode) query = query.eq('mode', mode);

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
    return mergeLeaderboards(cloud, getLeaderboardLocal(), mode);
  } catch {
    return getLeaderboardLocal(mode);
  }
}

/** Combina dos listas de leaderboard, deduplica por iniciales+score y ordena desc */
function mergeLeaderboards(a: LeaderboardEntry[], b: LeaderboardEntry[], mode?: string): LeaderboardEntry[] {
  const all = [...a, ...b].filter(e => !mode || (e.mode || 'world') === mode);
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
  saveLeaderboardLocal(entry);

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

export async function qualifiesForLeaderboard(score: number): Promise<boolean> {
  const board = await getLeaderboard();
  return board.length < 10 || score > board[board.length - 1].score;
}

function getLeaderboardLocal(mode?: string): LeaderboardEntry[] {
  try {
    const all: LeaderboardEntry[] = JSON.parse(localStorage.getItem('geospeed_leaderboard') || '[]');
    const filtered = mode ? all.filter(e => (e.mode || 'world') === mode) : all;
    return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch { return []; }
}

// --- Player Stats (localStorage — personal) ---

export function getPlayerStats(): PlayerStats {
  try {
    return JSON.parse(localStorage.getItem('geospeed_stats') || '{"gamesPlayed":0,"bestScore":0,"totalDistance":0,"totalRounds":0}');
  } catch {
    return { gamesPlayed: 0, bestScore: 0, totalDistance: 0, totalRounds: 0 };
  }
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
  history.unshift(entry);
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
