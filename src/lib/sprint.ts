/**
 * Sprint, el modo competitivo (Fase 5, docs/GeoSpeed_Plan_Competencia.md §1). Todo lo decide el servidor
 * (migración 20261025120000_sprint.sql): PS con Elo, divisiones, temporadas, cupo diario, rival y resultado.
 * Aquí: llamadas, caché del estado, divisiones para la interfaz, país del jugador y un simulador de desarrollo
 * (localStorage.geospeed_mock_sprint = '1').
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { USED_ISOS } from '@/lib/flags';
import { getRandomCities, placeIdOf, type City } from '@/data/cities';
import type { ChallengeGhost, GhostRound } from '@/lib/challenges';

export type DivisionKey = 'ciudad' | 'region' | 'pais' | 'continente' | 'mundo';
export const DIVISIONS: { key: DivisionKey; min: number; emoji: string }[] = [
  { key: 'ciudad', min: 0, emoji: '🏙️' },
  { key: 'region', min: 1100, emoji: '🗺️' },
  { key: 'pais', min: 1300, emoji: '🚩' },
  { key: 'continente', min: 1500, emoji: '🌎' },
  { key: 'mundo', min: 1700, emoji: '🌍' },
];
export const divisionOf = (points: number) => [...DIVISIONS].reverse().find((d) => points >= d.min) ?? DIVISIONS[0];
export const divisionByKey = (key: string) => DIVISIONS.find((d) => d.key === key) ?? DIVISIONS[0];
/** Avance dentro de la división (0–1) y PS que faltan para la siguiente (null en Mundo) */
export function divisionProgress(points: number): { pct: number; next: (typeof DIVISIONS)[number] | null; missing: number | null } {
  const i = DIVISIONS.indexOf(divisionOf(points));
  const next = DIVISIONS[i + 1] ?? null;
  if (!next) return { pct: 1, next: null, missing: null };
  const lo = i === 0 ? 900 : DIVISIONS[i].min; // la barra de Ciudad empieza en 900 para que 1.000 no se vea vacía
  return { pct: Math.max(0, Math.min(1, (points - lo) / (next.min - lo))), next, missing: next.min - points };
}

export const SPRINT_ROUNDS = 10;
export const SPRINT_SECONDS = 15;

export interface SprintSeason { id: number; name: string; ends_on: string; preseason: boolean; next_name?: string | null; next_starts_on?: string | null }
export interface SprintInboxItem { match_id: string; name: string; avatar: string | null; outcome: 'win' | 'loss' | 'draw'; delta: number; my_score: number; their_score: number; at: string }
export interface SprintAward { season: string; division: DivisionKey; peak: number }
export interface SprintStatus {
  unlocked: boolean; registered: boolean; games_played: number; games_needed: number;
  season: SprintSeason; points: number; division: DivisionKey; peak_points?: number;
  games?: number; season_games?: number; wins?: number; losses?: number; draws?: number;
  day_used?: number; day_limit?: number | null; pro?: boolean; country?: string | null;
  pending_match?: string | null; inbox?: SprintInboxItem[]; awards?: SprintAward[];
}
export interface SprintCity { n: number; id: string; name: string; country: string; iso: string | null; lat: number; lon: number }
export interface SprintMatch {
  match_id: string; cities: SprintCity[]; started_at: string;
  opponent: { name: string; avatar: string | null; country: string | null; points: number; division: DivisionKey; house: boolean };
  opp_rounds: GhostRound[]; opp_score: number;
}
export interface SprintResult {
  match_id: string; outcome: 'win' | 'loss' | 'draw' | 'void'; my_score: number; opp_score: number;
  points_before: number; points_after: number; delta: number; division_before: DivisionKey; division_after: DivisionKey;
  opponent: { name: string; avatar: string | null; country: string | null };
}
export interface SprintBoardRow { rank: number; user_id: string; points: number; division: DivisionKey; name: string; avatar: string | null; country: string | null; is_me: boolean }
export interface SprintBoard { season: string; scope: string; country: string | null; top: SprintBoardRow[]; me: { rank: number; points: number; total: number } | null }
export type SprintScope = 'global' | 'country' | 'friends';

export class SprintError extends Error {
  constructor(public code: 'locked' | 'limit' | 'no_opponent' | 'rematch_unavailable' | 'unavailable' | 'network') { super(code); }
}
const mapError = (e: { message?: string } | null): SprintError => {
  const m = e?.message ?? '';
  if (m.includes('sprint_locked')) return new SprintError('locked');
  if (m.includes('sprint_limit')) return new SprintError('limit');
  if (m.includes('sprint_no_opponent')) return new SprintError('no_opponent');
  if (m.includes('sprint_rematch_unavailable')) return new SprintError('rematch_unavailable');
  if (m.includes('sprint_unavailable')) return new SprintError('unavailable');
  return new SprintError('network');
};

// ── Estado (con caché para pintar al instante) ──────────────────────────────
export const SPRINT_STATUS_EVENT = 'geospeed:sprint-status';
const CACHE_KEY = 'geospeed_sprint_status';
export function getCachedSprintStatus(): SprintStatus | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as SprintStatus | null; } catch { return null; }
}
function cacheStatus(s: SprintStatus) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* sin espacio */ }
  window.dispatchEvent(new CustomEvent(SPRINT_STATUS_EVENT, { detail: s }));
}

/** Estado del jugador; sin sesión devuelve null (no crea una). Pone el país del teléfono si aún no tiene. */
export async function fetchSprintStatus(): Promise<SprintStatus | null> {
  if (mockEnabled()) { const s = mock.status(); cacheStatus(s); return s; }
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null;
    const { data, error } = await supabase.rpc('sprint_status');
    if (error || !data) return getCachedSprintStatus();
    const s = data as unknown as SprintStatus;
    cacheStatus(s);
    if (s.unlocked && !s.country) { const c = defaultCountry(); if (c) void setMyCountry(c); }
    return s;
  } catch {
    return getCachedSprintStatus();
  }
}

let lastStatusFetch = 0;
/** Pide el estado como mucho una vez por minuto (el Inicio se monta seguido) */
export function refreshSprintStatus(force = false): Promise<SprintStatus | null> {
  if (!force && Date.now() - lastStatusFetch < 60_000) return Promise.resolve(getCachedSprintStatus());
  lastStatusFetch = Date.now();
  return fetchSprintStatus();
}
/** Estado para una pantalla: el de la caché al instante y el del servidor cuando llega */
export function useSprintStatus(): SprintStatus | null {
  const [st, setSt] = useState<SprintStatus | null>(getCachedSprintStatus);
  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<SprintStatus>).detail);
    window.addEventListener(SPRINT_STATUS_EVENT, on);
    void refreshSprintStatus();
    return () => window.removeEventListener(SPRINT_STATUS_EVENT, on);
  }, []);
  return st;
}

export async function findSprintMatch(rematchOf?: string): Promise<SprintMatch> {
  if (mockEnabled()) return mock.find();
  const { data, error } = await supabase.rpc('sprint_find_match', rematchOf ? { p_rematch_of: rematchOf } : {});
  if (error || !data) throw mapError(error);
  return data as unknown as SprintMatch;
}

/** Entrega la carrera (payload como el de save_game_result: rondas y client_id); el servidor decide el resultado */
export async function submitSprint(matchId: string, payload: Record<string, unknown>): Promise<SprintResult> {
  if (mockEnabled()) return mock.submit(matchId, payload);
  const { data, error } = await supabase.rpc('sprint_submit', { p_match: matchId, p: payload as never });
  if (error || !data) throw mapError(error);
  return data as unknown as SprintResult;
}

/** Salir de la carrera con la ×: derrota en el acto (no se puede retomar) */
export async function forfeitSprint(matchId: string): Promise<void> {
  if (mockEnabled()) { const d = mockDb(); d.pending = null; d.losses++; d.points = Math.max(0, d.points - 20); mockSave(d); return; }
  await supabase.rpc('sprint_forfeit', { p_match: matchId });
}

// Entrega que no llegó al servidor (sin señal): se guarda y se reintenta al volver al Sprint
const UNSENT_KEY = 'geospeed_sprint_unsent';
export function saveUnsentSprint(matchId: string, payload: unknown) { try { localStorage.setItem(UNSENT_KEY, JSON.stringify({ matchId, payload })); } catch { /* sin espacio */ } }
export function takeUnsentSprint(): { matchId: string; payload: Record<string, unknown> } | null {
  try { const v = JSON.parse(localStorage.getItem(UNSENT_KEY) || 'null'); return v; } catch { return null; }
}
export function clearUnsentSprint() { try { localStorage.removeItem(UNSENT_KEY); } catch { /* nada */ } }

export async function fetchSprintBoard(scope: SprintScope): Promise<SprintBoard | null> {
  if (mockEnabled()) return mock.board(scope);
  const { data, error } = await supabase.rpc('sprint_leaderboard', { p_scope: scope, p_limit: 50 });
  if (error || !data) return null;
  return data as unknown as SprintBoard;
}

export async function markSprintInboxSeen(ids: string[]): Promise<void> {
  if (!ids.length || mockEnabled()) return;
  await supabase.rpc('sprint_inbox_seen', { p_ids: ids });
}

export async function setMyCountry(iso: string | null): Promise<boolean> {
  if (mockEnabled()) { mock.setCountry(iso); return true; }
  const { error } = await supabase.rpc('set_my_country', { p_iso: iso as string });
  return !error;
}

// ── País ────────────────────────────────────────────────────────────────────
const TZ_COUNTRY: Record<string, string> = {
  'America/Bogota': 'CO', 'America/Mexico_City': 'MX', 'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Argentina/Buenos_Aires': 'AR',
  'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Montevideo': 'UY',
  'America/Panama': 'PA', 'America/Costa_Rica': 'CR', 'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI', 'America/Santo_Domingo': 'DO', 'America/Havana': 'CU', 'America/Puerto_Rico': 'PR', 'America/Sao_Paulo': 'BR',
  'Europe/Madrid': 'ES', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US', 'America/Denver': 'US',
};
/** País del teléfono: la región del idioma (es-CO → CO) o, si no trae, la zona horaria */
export function defaultCountry(): string | null {
  try {
    for (const l of navigator.languages ?? [navigator.language]) {
      const m = /-([A-Z]{2})\b/.exec(l);
      if (m && USED_ISOS.includes(m[1])) return m[1];
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_COUNTRY[tz] ?? null;
  } catch { return null; }
}

/** Países para elegir (los que tienen bandera en el juego), con su nombre en el idioma del juego, ordenados */
export function countryOptions(locale: string): { iso: string; name: string }[] {
  let dn: Intl.DisplayNames | null = null;
  try { dn = new Intl.DisplayNames([locale], { type: 'region' }); } catch { /* navegador viejo */ }
  return USED_ISOS.filter((iso) => iso !== 'XK' && iso.length === 2)
    .map((iso) => ({ iso, name: (dn?.of(iso) as string) || iso }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
export const isoName = (iso: string | null | undefined, locale: string) => {
  if (!iso) return '';
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) || iso; } catch { return iso; }
};

// ── Para jugar: ciudades y fantasma del rival ───────────────────────────────
export const sprintCitiesToGame = (m: SprintMatch): City[] =>
  m.cities.map((c) => ({ id: c.id, name: c.name, country: c.country, lat: c.lat, lon: c.lon, difficulty: 'medium' }));
export const sprintGhost = (m: SprintMatch): ChallengeGhost => ({
  name: m.opponent.name, avatar: m.opponent.avatar, score: m.opp_score, end_reason: 'complete', rounds: m.opp_rounds,
});

// ── Simulador local (solo desarrollo) ───────────────────────────────────────
function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_sprint') === '1'; } catch { return false; }
}
const MOCK_KEY = 'geospeed_mock_sprint_db';
interface MockDb { points: number; games: number; used: number; day: string; country: string | null; pending: SprintMatch | null; wins: number; losses: number; draws: number }
const mockDb = (): MockDb => { try { return { points: 1000, games: 0, used: 0, day: '', country: 'CO', pending: null, wins: 0, losses: 0, draws: 0, ...JSON.parse(localStorage.getItem(MOCK_KEY) || '{}') }; } catch { return { points: 1000, games: 0, used: 0, day: '', country: 'CO', pending: null, wins: 0, losses: 0, draws: 0 }; } };
const mockSave = (d: MockDb) => localStorage.setItem(MOCK_KEY, JSON.stringify(d));
const today = () => new Date().toISOString().slice(0, 10);
const mock = {
  status(): SprintStatus {
    const d = mockDb();
    if (d.day !== today()) { d.day = today(); d.used = 0; mockSave(d); }
    return {
      unlocked: true, registered: true, games_played: 9, games_needed: 5,
      season: { id: 0, name: 'Pretemporada', ends_on: '2026-10-25', preseason: true, next_name: 'Sprint Andes', next_starts_on: '2026-10-26' },
      points: d.points, division: divisionOf(d.points).key, peak_points: d.points, games: d.games, season_games: d.games,
      wins: d.wins, losses: d.losses, draws: d.draws, day_used: d.used, day_limit: 5, pro: false, country: d.country, pending_match: d.pending?.match_id ?? null,
      inbox: d.games > 0 ? [{ match_id: 'mock-inbox', name: 'Valentina', avatar: null, outcome: 'loss', delta: -12, my_score: 9800, their_score: 12100, at: new Date().toISOString() }] : [],
      awards: [],
    };
  },
  async find(): Promise<SprintMatch> {
    await new Promise((r) => setTimeout(r, 500));
    const d = mockDb();
    if (d.pending) return d.pending;
    if (d.used >= 5) throw new SprintError('limit');
    const cities = getRandomCities('medium', SPRINT_ROUNDS, 'world');
    const rounds: GhostRound[] = cities.map((c, i) => ({ round_no: i + 1, time_s: Math.round((2 + Math.random() * 5) * 10) / 10, click_lat: c.lat + (Math.random() - 0.5) * 8, click_lon: c.lon + (Math.random() - 0.5) * 8, distance_km: Math.round(100 + Math.random() * 600), points: Math.round(600 + Math.random() * 1400) }));
    const m: SprintMatch = {
      match_id: crypto.randomUUID(), started_at: new Date().toISOString(),
      cities: cities.map((c, i) => ({ n: i + 1, id: placeIdOf(c), name: c.name, country: c.country, iso: null, lat: c.lat, lon: c.lon })),
      opponent: { name: 'Valentina', avatar: null, country: 'MX', points: d.points + 30, division: divisionOf(d.points + 30).key, house: false },
      opp_rounds: rounds, opp_score: rounds.reduce((s, r) => s + r.points, 0),
    };
    d.pending = m; d.used += 1; mockSave(d);
    return m;
  },
  async submit(matchId: string, payload: Record<string, unknown>): Promise<SprintResult> {
    await new Promise((r) => setTimeout(r, 400));
    const d = mockDb();
    const m = d.pending;
    if (!m || m.match_id !== matchId) throw new SprintError('unavailable');
    const rounds = (payload.rounds as { points?: number }[]) ?? [];
    const mine = rounds.reduce((s, r) => s + (r.points ?? 0), 0);
    const sc = mine > m.opp_score ? 1 : mine < m.opp_score ? 0 : 0.5;
    const e = 1 / (1 + 10 ** ((m.opponent.points - d.points) / 400));
    const delta = Math.round((d.games < 10 ? 40 : 20) * (sc - e));
    const before = d.points;
    d.points = Math.max(0, d.points + delta); d.games += 1; d.pending = null;
    if (sc === 1) d.wins++; else if (sc === 0) d.losses++; else d.draws++;
    mockSave(d);
    return { match_id: matchId, outcome: sc === 1 ? 'win' : sc === 0 ? 'loss' : 'draw', my_score: mine, opp_score: m.opp_score, points_before: before, points_after: d.points, delta,
      division_before: divisionOf(before).key, division_after: divisionOf(d.points).key, opponent: { name: m.opponent.name, avatar: null, country: m.opponent.country } };
  },
  board(scope: SprintScope): SprintBoard {
    const d = mockDb();
    const rows = [{ name: 'Valentina', points: 1120, country: 'MX' }, { name: 'Tú', points: d.points, country: d.country }, { name: 'Andrés', points: 1015, country: 'CO' }, { name: 'Lucía', points: 980, country: 'AR' }]
      .filter((r) => scope !== 'country' || r.country === d.country)
      .sort((a, b) => b.points - a.points)
      .map((r, i) => ({ rank: i + 1, user_id: r.name, points: r.points, division: divisionOf(r.points).key, name: r.name, avatar: null, country: r.country, is_me: r.name === 'Tú' }));
    const me = rows.find((r) => r.is_me);
    return { season: 'Pretemporada', scope, country: d.country, top: rows, me: me ? { rank: me.rank, points: me.points, total: rows.length } : null };
  },
  setCountry(iso: string | null) { const d = mockDb(); d.country = iso; mockSave(d); },
};
