/**
 * F3 · Reto asincrónico entre amigos — cliente.
 *
 * Servidor: supabase/migrations/20261018120000_challenges.sql (RPC SECURITY DEFINER).
 *  - challenge_create   crea el reto con la lista explícita de ciudades (D2) y devuelve el código (D3)
 *  - challenge_preview  lo que ve el invitado antes de aceptar (sin ciudades ni puntajes)
 *  - challenge_join     aceptar con el código (idempotente)
 *  - challenge_detail   reto + mi resultado + el del rival SOLO cuando ambos terminaron
 *  - my_challenges      bandeja con estado por reto (F4)
 * La partida se guarda con saveGameResult({ gameType: 'challenge', challengeId }); un trigger del
 * servidor marca al jugador como terminado y completa el reto cuando terminan los dos.
 *
 * Desarrollo sin la migración aplicada: `localStorage.geospeed_mock_challenges = '1'` activa un
 * simulador en memoria (solo en `npm run dev`). `window.__mockRivalFinish(id, score)` simula al amigo.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { getRandomCities, worldCities, type City, type Difficulty, type GameMode } from '@/data/cities';
import { countryIso } from '@/lib/flags';

export const CHALLENGE_ROUNDS = 13;
export const CHALLENGE_SECONDS = 15;

export interface ChallengeCity { n: number; name: string; country: string; iso: string | null; lat: number; lon: number }

export interface Challenge {
  id: string;
  code: string;
  mode: GameMode;
  difficulty: Difficulty;
  rounds_total: number;
  seconds_per_round: number;
  cities: ChallengeCity[];
  status: 'open' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  is_creator: boolean;
}

export interface ChallengePreview {
  id: string;
  code: string;
  mode: GameMode;
  difficulty: Difficulty;
  rounds_total: number;
  seconds_per_round: number;
  status: Challenge['status'];
  creator_name: string;
  creator_avatar: string | null;
  /** null = todavía no participa; 'creator' = es su propio reto */
  my_role: 'creator' | 'opponent' | null;
}

export interface ChallengeRound {
  round_no: number; city_name: string; city_country: string | null; city_lat: number; city_lon: number;
  click_lat: number | null; click_lon: number | null; distance_km: number | null; time_s: number | null;
  base_points: number | null; multiplier: number | null; points: number;
}
export interface ChallengeResult { score: number; end_reason: string; rounds: ChallengeRound[] }

export interface ChallengeDetail extends Challenge {
  my_role: 'creator' | 'opponent';
  my_finished: boolean;
  rival: { name: string; avatar: string | null; finished: boolean } | null;
  my_result: ChallengeResult | null;
  /** Solo cuando el reto está completado (ambos terminaron) */
  rival_result: ChallengeResult | null;
}

export type ChallengeErrorCode = 'auth_required' | 'unavailable' | 'network';
export class ChallengeError extends Error {
  constructor(public code: ChallengeErrorCode, message?: string) { super(message ?? code); }
}

// ── Sesión: registrada o anónima (D1). Si el anónimo está desactivado en Supabase, pide login. ──
export async function ensureSession(): Promise<void> {
  if (mockEnabled()) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new ChallengeError('auth_required', error.message);
}

function mapError(error: { message?: string; code?: string } | null): ChallengeError {
  const msg = error?.message ?? '';
  if (/challenge_unavailable/.test(msg) || error?.code === 'P0002') return new ChallengeError('unavailable');
  if (/not authenticated/.test(msg) || error?.code === '42501') return new ChallengeError('auth_required');
  return new ChallengeError('network', msg);
}

/** Código normalizado: mayúsculas, sin espacios ni guiones; 5 caracteres del alfabeto del servidor. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}
export const isValidCode = (code: string) => /^[A-HJ-NP-Z2-9]{5}$/.test(code);

/** Huella del catálogo (para diagnosticar retos creados con otra versión de cities.ts). */
function catalogVersion(): string {
  let h = 0;
  for (const c of worldCities) for (let i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) | 0;
  return `w${worldCities.length}-${(h >>> 0).toString(36)}`;
}

/** Elige las ciudades del reto en el cliente del creador (D2: el servidor guarda la lista tal cual). */
export function pickChallengeCities(difficulty: Difficulty, mode: GameMode, rounds = CHALLENGE_ROUNDS): ChallengeCity[] {
  return getRandomCities(difficulty, rounds, mode).map((c, i) => ({
    n: i + 1, name: c.name, country: c.country, iso: countryIso(c.country), lat: c.lat, lon: c.lon,
  }));
}

/** Ciudades del reto en el formato que usa GameScreen. */
export function challengeCitiesToGame(ch: Pick<Challenge, 'cities' | 'difficulty'>): City[] {
  return ch.cities.map(c => ({ name: c.name, country: c.country, lat: c.lat, lon: c.lon, difficulty: ch.difficulty }));
}

export function challengeLink(code: string): string {
  return `${window.location.origin}/reto/${code}`;
}

// ── RPC ─────────────────────────────────────────────────────────────────────
export async function createChallenge(opts: { mode: GameMode; difficulty: Difficulty; requestId: string; parentId?: string | null }): Promise<Challenge> {
  if (mockEnabled()) return mock.create(opts);
  await ensureSession();
  const cities = pickChallengeCities(opts.difficulty, opts.mode);
  const { data, error } = await supabase.rpc('challenge_create', {
    p: {
      mode: opts.mode, difficulty: opts.difficulty, rounds_total: cities.length, seconds_per_round: CHALLENGE_SECONDS,
      cities, catalog_version: catalogVersion(), client_request_id: opts.requestId, parent_challenge_id: opts.parentId ?? null,
    } as unknown as Json,
  });
  if (error || !data) throw mapError(error);
  return data as unknown as Challenge;
}

export async function previewChallenge(code: string): Promise<ChallengePreview> {
  if (mockEnabled()) return mock.preview(code);
  await ensureSession();
  const { data, error } = await supabase.rpc('challenge_preview', { p_code: code });
  if (error || !data) throw mapError(error);
  return data as unknown as ChallengePreview;
}

export async function joinChallenge(code: string): Promise<Challenge> {
  if (mockEnabled()) return mock.join(code);
  await ensureSession();
  const { data, error } = await supabase.rpc('challenge_join', { p_code: code });
  if (error || !data) throw mapError(error);
  return data as unknown as Challenge;
}

export async function fetchChallengeDetail(id: string): Promise<ChallengeDetail> {
  if (mockEnabled()) return mock.detail(id);
  await ensureSession();
  const { data, error } = await supabase.rpc('challenge_detail', { p_id: id });
  if (error || !data) throw mapError(error);
  return data as unknown as ChallengeDetail;
}

// ── Simulador local (solo desarrollo) ───────────────────────────────────────
function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_challenges') === '1'; } catch { return false; }
}

const MOCK_KEY = 'geospeed_mock_challenges_db';
interface MockRow { ch: Challenge; mine: ChallengeResult | null; rival: { name: string; joined: boolean; result: ChallengeResult | null } }
const mockDb = (): Record<string, MockRow> => { try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}'); } catch { return {}; } };
const mockSave = (db: Record<string, MockRow>) => localStorage.setItem(MOCK_KEY, JSON.stringify(db));
const delay = () => new Promise(r => setTimeout(r, 350));

const mock = {
  async create(opts: { mode: GameMode; difficulty: Difficulty; requestId: string }): Promise<Challenge> {
    await delay();
    const db = mockDb();
    const existing = Object.values(db).find(r => (r.ch as Challenge & { req?: string }).req === opts.requestId);
    if (existing) return existing.ch;
    const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () => alpha[Math.floor(Math.random() * 32)]).join('');
    const ch = {
      id: crypto.randomUUID(), code, mode: opts.mode, difficulty: opts.difficulty, rounds_total: CHALLENGE_ROUNDS,
      seconds_per_round: CHALLENGE_SECONDS, cities: pickChallengeCities(opts.difficulty, opts.mode), status: 'open',
      created_at: new Date().toISOString(), completed_at: null, is_creator: true, req: opts.requestId,
    } as Challenge;
    db[ch.id] = { ch, mine: null, rival: { name: 'Explorador', joined: false, result: null } };
    mockSave(db);
    return ch;
  },
  async preview(code: string): Promise<ChallengePreview> {
    await delay();
    const row = Object.values(mockDb()).find(r => r.ch.code === code);
    if (!row) throw new ChallengeError('unavailable');
    const { ch } = row;
    return { id: ch.id, code: ch.code, mode: ch.mode, difficulty: ch.difficulty, rounds_total: ch.rounds_total,
      seconds_per_round: ch.seconds_per_round, status: ch.status, creator_name: 'Explorador', creator_avatar: null,
      my_role: ch.is_creator ? 'creator' : null };
  },
  async join(code: string): Promise<Challenge> {
    await delay();
    const db = mockDb();
    const row = Object.values(db).find(r => r.ch.code === code);
    if (!row) throw new ChallengeError('unavailable');
    return row.ch;
  },
  async detail(id: string): Promise<ChallengeDetail> {
    await delay();
    const row = mockDb()[id];
    if (!row) throw new ChallengeError('unavailable');
    const done = !!row.mine && !!row.rival.result;
    return { ...row.ch, status: done ? 'completed' : row.rival.joined ? 'active' : 'open',
      my_role: 'creator', my_finished: !!row.mine,
      rival: row.rival.joined ? { name: row.rival.name, avatar: null, finished: !!row.rival.result } : null,
      my_result: row.mine, rival_result: done ? row.rival.result : null };
  },
};

/** Simulador: guarda mi resultado (lo llama Index tras la partida cuando el simulador está activo). */
export function mockRecordMyResult(id: string, result: ChallengeResult): void {
  if (!mockEnabled()) return;
  const db = mockDb();
  if (db[id] && !db[id].mine) { db[id].mine = result; mockSave(db); }
}
export const isMockChallenges = mockEnabled;

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__mockRivalFinish = (id: string, score = 5000) => {
    const db = mockDb();
    if (!db[id]) return 'no existe';
    const mine = db[id].mine;
    db[id].rival = { name: 'Valentina', joined: true, result: {
      score, end_reason: 'complete',
      rounds: (mine?.rounds ?? []).map(r => {
        const dLat = (Math.random() - 0.5) * 12, dLon = (Math.random() - 0.5) * 12;
        const lat = (r.click_lat ?? r.city_lat) + dLat, lon = (r.click_lon ?? r.city_lon) + dLon;
        const km = Math.round(111 * Math.hypot(lat - r.city_lat, (lon - r.city_lon) * Math.cos((r.city_lat * Math.PI) / 180)));
        return { ...r, click_lat: lat, click_lon: lon, distance_km: km, time_s: Math.round(((r.time_s ?? 5) + Math.random() * 3) * 10) / 10, points: Math.round(score / Math.max(1, mine?.rounds.length ?? 13)) };
      }),
    } };
    mockSave(db);
    return 'ok';
  };
  (window as unknown as Record<string, unknown>).__mockRivalJoin = (id: string) => {
    const db = mockDb();
    if (!db[id]) return 'no existe';
    db[id].rival.joined = true; db[id].rival.name = 'Valentina';
    mockSave(db);
    return 'ok';
  };
}
