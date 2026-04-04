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

export function calculateBasePoints(distanceKm: number): number {
  if (distanceKm >= 8000) return 0;
  if (distanceKm < 50) return 1000;
  if (distanceKm < 200) return 800;
  if (distanceKm < 500) return 500;
  if (distanceKm < 1000) return 300;
  if (distanceKm < 2000) return 100;
  return 50;
}

export function getMultiplier(timeUsedSeconds: number): { value: number; label: string; emoji: string } {
  if (timeUsedSeconds < 4) return { value: 2, label: "×2", emoji: "🚀" };
  if (timeUsedSeconds < 9) return { value: 1, label: "×1", emoji: "🎯" };
  return { value: 0.5, label: "×0.5", emoji: "🦕" };
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

export async function getLeaderboard(mode?: string): Promise<LeaderboardEntry[]> {
  try {
    let query = supabase
      .from('leaderboard')
      .select('initials, score, difficulty, mode, created_at')
      .order('score', { ascending: false })
      .limit(5);
    if (mode) query = query.eq('mode', mode);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => ({
      initials: row.initials,
      score: row.score,
      difficulty: row.difficulty,
      mode: row.mode || 'world',
      date: row.created_at.split('T')[0],
    }));
  } catch {
    try { return JSON.parse(localStorage.getItem('geospeed_leaderboard') || '[]'); } catch { return []; }
  }
}

export async function addToLeaderboard(entry: LeaderboardEntry): Promise<boolean> {
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

    const board = await getLeaderboard();
    return board.some(e => e.initials === entry.initials && e.score === entry.score);
  } catch {
    const board = getLeaderboardLocal();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem('geospeed_leaderboard', JSON.stringify(board.slice(0, 5)));
    return board.slice(0, 5).some(e => e.initials === entry.initials && e.score === entry.score);
  }
}

export async function qualifiesForLeaderboard(score: number): Promise<boolean> {
  const board = await getLeaderboard();
  return board.length < 5 || score > board[board.length - 1].score;
}

function getLeaderboardLocal(): LeaderboardEntry[] {
  try { return JSON.parse(localStorage.getItem('geospeed_leaderboard') || '[]'); } catch { return []; }
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
  type: 'classic' | 'timeattack';
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
