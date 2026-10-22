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
import { worldCities, placeIdOf, type City, type Difficulty, type GameMode } from '@/data/cities';
import { getRandomItems, kindFromPlaceId, type Category } from '@/lib/catalog';
import { countryIso } from '@/lib/flags';
import { ensureGuestSession } from '@/lib/identity';

export const CHALLENGE_ROUNDS = 13;
export const CHALLENGE_SECONDS = 15;

export interface ChallengeCity {
  n: number; name: string; country: string; iso: string | null; lat: number; lon: number;
  /** Fase 6: id del lugar (`flag:XX` en banderas) y tipo; los retos viejos no lo traen (ciudades) */
  id?: string; kind?: 'city' | 'flag';
}

export interface Challenge {
  id: string;
  code: string;
  mode: GameMode;
  difficulty: Difficulty;
  /** Fase 6: qué se ubica (los retos anteriores son de ciudades) */
  category?: Category;
  rounds_total: number;
  seconds_per_round: number;
  cities: ChallengeCity[];
  status: 'open' | 'active' | 'completed' | 'cancelled';
  parent_challenge_id?: string | null;
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
  category?: Category;
  status: Challenge['status'];
  creator_name: string;
  creator_avatar: string | null;
  /** null = todavía no participa; 'creator' = es su propio reto */
  my_role: 'creator' | 'opponent' | null;
  /** Invitado a una revancha: ya está como participante pero aún no aceptó */
  accepted: boolean;
  is_rematch: boolean;
}

export interface ChallengeRound {
  round_no: number; place_id?: string | null; city_name: string; city_country: string | null; city_lat: number; city_lon: number;
  click_lat: number | null; click_lon: number | null; distance_km: number | null; time_s: number | null;
  base_points: number | null; multiplier: number | null; points: number;
}
export interface ChallengeResult { score: number; end_reason: string; rounds: ChallengeRound[] }

export interface ChallengeDetail extends Challenge {
  my_role: 'creator' | 'opponent';
  my_finished: boolean;
  is_rematch?: boolean;
  rival: { name: string; avatar: string | null; accepted?: boolean; finished: boolean } | null;
  my_result: ChallengeResult | null;
  /** Solo cuando el reto está completado (ambos terminaron) */
  rival_result: ChallengeResult | null;
}

/** Fase 3 — carrera contra el fantasma: la partida del rival, ronda por ronda (RPC challenge_ghost) */
export interface GhostRound { round_no: number; time_s: number | null; click_lat: number | null; click_lon: number | null; distance_km: number | null; points: number }
export interface ChallengeGhost { name: string; avatar: string | null; score: number; end_reason: string; rounds: GhostRound[] }

export type ChallengeState = 'to_accept' | 'to_play' | 'waiting' | 'ready';
/** Fila de la bandeja "Mis retos" (RPC my_challenges) */
export interface MyChallenge {
  id: string; code: string; mode: GameMode; difficulty: Difficulty; status: Challenge['status'];
  created_at: string; completed_at: string | null; rounds_total: number; is_rematch: boolean;
  my_role: 'creator' | 'opponent'; state: ChallengeState;
  rival_name: string | null; rival_avatar: string | null; rival_finished: boolean;
  my_score: number | null; rival_score: number | null;
}

export type ChallengeErrorCode = 'auth_required' | 'unavailable' | 'network';
export class ChallengeError extends Error {
  constructor(public code: ChallengeErrorCode, message?: string) { super(message ?? code); }
}

// ── Sesión: registrada o anónima (D1). Si el anónimo está desactivado en Supabase, pide login. ──
export async function ensureSession(): Promise<void> {
  if (mockEnabled()) return;
  const r = await ensureGuestSession();
  if (r === 'unavailable') throw new ChallengeError('auth_required');
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
export function pickChallengeCities(difficulty: Difficulty, mode: GameMode, rounds = CHALLENGE_ROUNDS, exclude: string[] = [], category: Category = 'cities'): ChallengeCity[] {
  // Revancha: ciudades nuevas excluyendo las del reto original; si el pool no alcanza, se completan
  // con las excluidas (la invitación muestra el número real de ciudades nuevas, D2).
  const banned = new Set(exclude);
  const pool = getRandomItems(category, difficulty, rounds * 4, mode);
  const fresh = pool.filter(c => !banned.has(c.name));
  const seen = new Set<string>();
  const picked: City[] = [];
  for (const c of [...fresh, ...pool]) {
    if (picked.length >= rounds || seen.has(c.name)) continue;
    seen.add(c.name); picked.push(c);
  }
  return picked.map((c, i) => ({ n: i + 1, id: placeIdOf(c), kind: c.kind ?? 'city', name: c.name, country: c.country, iso: countryIso(c.country), lat: c.lat, lon: c.lon }));
}

/** Cuántas ciudades de `cities` no estaban en el reto original */
export function countNewCities(cities: ChallengeCity[], parent: ChallengeCity[] | null | undefined): number {
  if (!parent) return cities.length;
  const prev = new Set(parent.map(c => c.name));
  return cities.filter(c => !prev.has(c.name)).length;
}

/** Ciudades del reto en el formato que usa GameScreen. */
export function challengeCitiesToGame(ch: Pick<Challenge, 'cities' | 'difficulty'>): City[] {
  return ch.cities.map(c => ({ ...kindFromPlaceId(c.id), name: c.name, country: c.country, lat: c.lat, lon: c.lon, difficulty: ch.difficulty }));
}

export function challengeLink(code: string): string {
  return `${window.location.origin}/reto/${code}`;
}

// ── RPC ─────────────────────────────────────────────────────────────────────
export async function createChallenge(opts: { mode: GameMode; difficulty: Difficulty; category?: Category; requestId: string; parentId?: string | null; excludeCities?: string[] }): Promise<Challenge> {
  if (mockEnabled()) return mock.create(opts);
  await ensureSession();
  const category = opts.category ?? 'cities';
  const cities = pickChallengeCities(opts.difficulty, opts.mode, CHALLENGE_ROUNDS, opts.excludeCities ?? [], category);
  const { data, error } = await supabase.rpc('challenge_create', {
    p: {
      mode: opts.mode, difficulty: opts.difficulty, category, rounds_total: cities.length, seconds_per_round: CHALLENGE_SECONDS,
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

export async function fetchMyChallenges(): Promise<MyChallenge[]> {
  if (mockEnabled()) return mock.list();
  await ensureSession();
  const { data, error } = await supabase.rpc('my_challenges', { p_limit: 100 });
  if (error) throw mapError(error);
  return (data ?? []) as unknown as MyChallenge[];
}

export async function fetchChallengeDetail(id: string): Promise<ChallengeDetail> {
  if (mockEnabled()) return mock.detail(id);
  await ensureSession();
  const { data, error } = await supabase.rpc('challenge_detail', { p_id: id });
  if (error || !data) throw mapError(error);
  return data as unknown as ChallengeDetail;
}

/** Partida del rival para correr contra ella; null si el rival aún no juega o si yo ya jugué.
 *  Nunca lanza: sin fantasma la partida es un reto normal. */
export async function fetchChallengeGhost(id: string): Promise<ChallengeGhost | null> {
  try {
    if (mockEnabled()) return await mock.ghost(id);
    await ensureSession();
    const { data, error } = await supabase.rpc('challenge_ghost', { p_id: id });
    if (error || !data) return null;
    const g = data as unknown as ChallengeGhost;
    return Array.isArray(g.rounds) && g.rounds.length ? g : null;
  } catch {
    return null;
  }
}

// ── Simulador local (solo desarrollo) ───────────────────────────────────────
function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_challenges') === '1'; } catch { return false; }
}

const MOCK_KEY = 'geospeed_mock_challenges_db';
interface MockRow {
  ch: Challenge & { req?: string; parentId?: string | null };
  /** 'creator' | 'opponent' (revancha recibida) */
  myRole: 'creator' | 'opponent';
  myAccepted: boolean;
  mine: ChallengeResult | null;
  rival: { name: string; joined: boolean; result: ChallengeResult | null };
}
const mockDb = (): Record<string, MockRow> => { try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}'); } catch { return {}; } };
const mockSave = (db: Record<string, MockRow>) => localStorage.setItem(MOCK_KEY, JSON.stringify(db));
const delay = () => new Promise(r => setTimeout(r, 350));
// Filas antiguas del simulador (sin myRole/myAccepted) cuentan como propias y aceptadas
const mockAccepted = (r: MockRow) => r.myAccepted ?? true;
const mockState = (r: MockRow): ChallengeState => !mockAccepted(r) ? 'to_accept' : !r.mine ? 'to_play' : (r.mine && r.rival.result) ? 'ready' : 'waiting';
const mockStatus = (r: MockRow): Challenge['status'] => (r.mine && r.rival.result) ? 'completed' : r.rival.joined ? 'active' : 'open';

const mock = {
  async create(opts: { mode: GameMode; difficulty: Difficulty; category?: Category; requestId: string; parentId?: string | null; excludeCities?: string[] }): Promise<Challenge> {
    await delay();
    const db = mockDb();
    const existing = Object.values(db).find(r => r.ch.req === opts.requestId);
    if (existing) return existing.ch;
    const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () => alpha[Math.floor(Math.random() * 32)]).join('');
    const parent = opts.parentId ? db[opts.parentId] : null;
    const ch: MockRow['ch'] = {
      id: crypto.randomUUID(), code, mode: opts.mode, difficulty: opts.difficulty, category: opts.category ?? 'cities', rounds_total: CHALLENGE_ROUNDS,
      seconds_per_round: CHALLENGE_SECONDS, cities: pickChallengeCities(opts.difficulty, opts.mode, CHALLENGE_ROUNDS, opts.excludeCities ?? [], opts.category ?? 'cities'),
      status: 'open', parent_challenge_id: opts.parentId ?? null, created_at: new Date().toISOString(), completed_at: null, is_creator: true, req: opts.requestId, parentId: opts.parentId ?? null,
    };
    // Revancha: el rival del reto original queda invitado (sin aceptar)
    db[ch.id] = { ch, myRole: 'creator', myAccepted: true, mine: null, rival: { name: parent?.rival.name ?? 'Explorador', joined: !!parent, result: null } };
    mockSave(db);
    return ch;
  },
  async preview(code: string): Promise<ChallengePreview> {
    await delay();
    const row = Object.values(mockDb()).find(r => r.ch.code === code);
    if (!row) throw new ChallengeError('unavailable');
    const { ch } = row;
    return { id: ch.id, code: ch.code, mode: ch.mode, difficulty: ch.difficulty, rounds_total: ch.rounds_total,
      seconds_per_round: ch.seconds_per_round, status: mockStatus(row), creator_name: row.myRole === 'creator' ? 'Explorador' : row.rival.name, creator_avatar: null,
      my_role: row.myRole ?? 'creator', accepted: mockAccepted(row), is_rematch: !!ch.parentId };
  },
  async join(code: string): Promise<Challenge> {
    await delay();
    const db = mockDb();
    const row = Object.values(db).find(r => r.ch.code === code);
    if (!row) throw new ChallengeError('unavailable');
    row.myAccepted = true; mockSave(db);
    return row.ch;
  },
  async detail(id: string): Promise<ChallengeDetail> {
    await delay();
    const row = mockDb()[id];
    if (!row) throw new ChallengeError('unavailable');
    const done = !!row.mine && !!row.rival.result;
    return { ...row.ch, status: mockStatus(row), my_role: row.myRole ?? 'creator', my_finished: !!row.mine, is_rematch: !!row.ch.parentId,
      rival: row.rival.joined ? { name: row.rival.name, avatar: null, accepted: !!row.rival.result || row.myRole === 'opponent' || row.rival.joined && !row.ch.parentId, finished: !!row.rival.result } : null,
      my_result: row.mine, rival_result: done ? row.rival.result : null };
  },
  async ghost(id: string): Promise<ChallengeGhost | null> {
    await delay();
    const row = mockDb()[id];
    if (!row || row.mine || !row.rival.result) return null;
    return { name: row.rival.name, avatar: null, score: row.rival.result.score, end_reason: row.rival.result.end_reason, rounds: row.rival.result.rounds };
  },
  async list(): Promise<MyChallenge[]> {
    await delay();
    return Object.values(mockDb()).map(r => ({
      id: r.ch.id, code: r.ch.code, mode: r.ch.mode, difficulty: r.ch.difficulty, status: mockStatus(r), created_at: r.ch.created_at,
      completed_at: null, rounds_total: r.ch.rounds_total, is_rematch: !!r.ch.parentId, my_role: r.myRole ?? 'creator', state: mockState(r),
      rival_name: r.rival.joined ? r.rival.name : null, rival_avatar: null, rival_finished: !!r.rival.result,
      my_score: mockStatus(r) === 'completed' ? r.mine!.score : null, rival_score: mockStatus(r) === 'completed' ? r.rival.result!.score : null,
    })).sort((a, b) => b.created_at.localeCompare(a.created_at));
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
  const w = window as unknown as Record<string, unknown>;
  w.__mockRivalFinish = (id: string, score = 5000) => {
    const db = mockDb();
    if (!db[id]) return 'no existe';
    const mine = db[id].mine;
    // Sin mi partida (el rival juega primero, Fase 3): sus rondas salen de las ciudades del reto
    const base: ChallengeRound[] = mine?.rounds ?? db[id].ch.cities.map((c, i) => ({
      round_no: i + 1, city_name: c.name, city_country: c.country, city_lat: c.lat, city_lon: c.lon,
      click_lat: c.lat, click_lon: c.lon, distance_km: 0, time_s: 2 + Math.random() * 4, base_points: null, multiplier: null, points: 0,
    }));
    db[id].rival = { name: db[id].rival.name === 'Explorador' ? 'Valentina' : db[id].rival.name, joined: true, result: {
      score, end_reason: 'complete',
      rounds: base.map(r => {
        const dLat = (Math.random() - 0.5) * 12, dLon = (Math.random() - 0.5) * 12;
        const lat = (r.click_lat ?? r.city_lat) + dLat, lon = (r.click_lon ?? r.city_lon) + dLon;
        const km = Math.round(111 * Math.hypot(lat - r.city_lat, (lon - r.city_lon) * Math.cos((r.city_lat * Math.PI) / 180)));
        return { ...r, click_lat: lat, click_lon: lon, distance_km: km, time_s: Math.round(((r.time_s ?? 5) + Math.random() * 3) * 10) / 10, points: Math.round(score / Math.max(1, base.length)) };
      }),
    } };
    mockSave(db);
    return 'ok';
  };
  w.__mockRivalJoin = (id: string) => {
    const db = mockDb();
    if (!db[id]) return 'no existe';
    db[id].rival.joined = true; db[id].rival.name = 'Valentina';
    mockSave(db);
    return 'ok';
  };
  /** Simula que Valentina me pide revancha (aparece "Por aceptar" en Mis retos) */
  w.__mockIncomingRematch = (mode: GameMode = 'world', difficulty: Difficulty = 'basic') => {
    const db = mockDb();
    const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 5 }, () => alpha[Math.floor(Math.random() * 32)]).join('');
    const ch: MockRow['ch'] = { id: crypto.randomUUID(), code, mode, difficulty, rounds_total: CHALLENGE_ROUNDS, seconds_per_round: CHALLENGE_SECONDS,
      cities: pickChallengeCities(difficulty, mode), status: 'active', created_at: new Date().toISOString(), completed_at: null, is_creator: false, parentId: 'x' };
    db[ch.id] = { ch, myRole: 'opponent', myAccepted: false, mine: null, rival: { name: 'Valentina', joined: true, result: null } };
    mockSave(db);
    return ch.code;
  };
}
