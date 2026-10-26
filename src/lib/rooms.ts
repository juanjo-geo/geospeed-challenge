/**
 * Sala en vivo (docs/GeoSpeed_Sala_En_Vivo_Diseno.md, bloque S2): cliente de las funciones del servidor
 * (supabase/migrations/20261106120000_rooms.sql), reloj sincronizado con el servidor, línea de tiempo local y consulta
 * periódica del estado (sin Realtime).
 *
 * Simulador de desarrollo (sin la migración ni otros teléfonos): `localStorage.geospeed_mock_rooms = '1'` (solo DEV).
 *  · `__mockRoomBots(n)` suma n jugadores falsos a mi sala en espera.
 *  · `__mockRoomHosted(n)` crea una sala de otro anfitrión con n jugadores y devuelve su PIN (para probar unirse).
 *  Los jugadores falsos responden solos en cada ronda (con tiempos y distancias al azar).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureGuestSession } from '@/lib/identity';
import { pickChallengeCities, type ChallengeCity } from '@/lib/challenges';
import type { Category } from '@/lib/catalog';
import type { Difficulty, GameMode } from '@/data/cities';
import { haversineDistance } from '@/lib/gameUtils';
import { closeness, scaleForMode, scoreRound, difficultyHundredths } from '@/lib/scoring';
import { roomsBetaOn } from '@/lib/roomsBeta';

// ── Tipos (lo que devuelve room_state) ──────────────────────────────────────────────────────────────────
export type RoomPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished' | 'cancelled';
export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'cancelled';
export interface RoomSettings {
  mode: GameMode; difficulty: Difficulty; category: Category; rounds_total: number; seconds: number; max_players: number;
  countdown: number; reveal: number; host_plays: boolean;
}
export interface RoomPlayer { slot: number; name: string; avatar: string | null; total: number; hits: number; answered: number; is_host: boolean; me: boolean; answered_now: boolean; rank: number }
export interface RoomItem { n: number; id: string; kind: string; name: string; country: string | null; lat?: number; lon?: number }
export interface RoomClick { slot: number; name: string; lat: number; lon: number; km: number | null; base: number; points: number; time_s: number | null; me: boolean }
export interface RoomMyAnswer { round: number; lat: number; lon: number; time_s: number; km: number | null; base: number; points: number; combo: number; combo_mult: number }
export interface RoomState {
  id: string; pin: string; status: RoomStatus; phase: RoomPhase; round: number;
  opens_at: string | null; closes_at: string | null; ends_at: string | null; server_now: string; started_at: string | null;
  settings: RoomSettings; host_name: string | null; i_am_host: boolean; i_am_player: boolean; kicked: boolean;
  players: RoomPlayer[]; player_count: number; answered_count: number; items: RoomItem[];
  reveal: { round: number; clicks: RoomClick[] } | null;
  me: { slot: number; name: string; total: number; answers: RoomMyAnswer[] } | null;
  next_room: { id: string; pin: string; status: RoomStatus } | null;
}
export interface RoomAnswerResult { round: number; km: number | null; base: number; points: number; combo: number; combo_mult: number; time_s: number; total: number; repeat: boolean }

export const ROOM_ROUNDS = [5, 10, 13] as const;
export const ROOM_SECONDS = [10, 15, 20] as const;
export const ROOM_MAX_PLAYERS = 20;
export const ROOM_NAME_MIN = 2;
export const ROOM_NAME_MAX = 20;
export const isRoomPin = (s: string) => /^[1-9]\d{5}$/.test(s);
export const normalizePin = (raw: string) => raw.replace(/\D/g, '').slice(0, 6);
export const roomLink = (pin: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://geospeed-challenge.vercel.app'}/sala/${pin}`;
export const roomTvLink = (pin: string) => `${roomLink(pin)}/tv`;

export type RoomErrorCode =
  | 'auth_required' | 'account_required' | 'unavailable' | 'full' | 'started' | 'kicked' | 'name_invalid' | 'pro_required'
  | 'limit' | 'not_enough_players' | 'round_closed' | 'not_player' | 'network';
export class RoomError extends Error {
  constructor(public code: RoomErrorCode, message?: string) { super(message ?? code); }
}
function mapError(error: { message?: string; code?: string } | null): RoomError {
  const msg = error?.message ?? '';
  const m = msg.match(/room_(account_required|unavailable|full|started|kicked|name_invalid|pro_required|limit|not_enough_players|round_closed|not_player)/);
  if (m) return new RoomError(m[1] as RoomErrorCode);
  if (/not authenticated/.test(msg) || error?.code === '42501') return new RoomError('auth_required');
  if (error?.code === 'P0002') return new RoomError('unavailable');
  return new RoomError('network', msg);
}

// ── Apodo de invitado (se recuerda en el teléfono) ───────────────────────────────────────────────────────
const NAME_KEY = 'geospeed_room_name';
export const savedRoomName = (): string => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };
export const saveRoomName = (name: string) => { try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* sin almacenamiento */ } };
export const cleanRoomName = (raw: string) => raw.replace(/\s+/g, ' ').trimStart().slice(0, ROOM_NAME_MAX);

// ── Reloj del servidor: diferencia con el reloj del teléfono (la medición de menor demora) ────────────────
let clockOffsetMs = 0;
let clockBestRtt = Infinity;
function noteServerTime(serverNowIso: string, t0: number, t1: number): void {
  const rtt = t1 - t0;
  const server = Date.parse(serverNowIso);
  if (!Number.isFinite(server)) return;
  // Una medición nueva reemplaza a la guardada si tardó poco más o menos que la mejor (el reloj puede ir corriéndose)
  if (rtt <= clockBestRtt + 60) {
    clockOffsetMs = server - (t0 + t1) / 2;
    clockBestRtt = Math.min(clockBestRtt, rtt);
  }
}
/** Hora del servidor en ms (estimada en el teléfono) */
export const serverNow = () => Date.now() + clockOffsetMs;

/**
 * Fase de la sala en un instante (la misma cuenta que _room_timeline del servidor): permite mostrar la cuenta
 * regresiva y el reloj de la ronda entre consulta y consulta.
 */
export function roomTimeline(s: Pick<RoomState, 'status' | 'started_at' | 'settings'>, nowMs: number): { phase: RoomPhase; round: number; opensAt: number; closesAt: number; endsAt: number } {
  const st = s.settings;
  if (s.status === 'cancelled') return { phase: 'cancelled', round: 0, opensAt: 0, closesAt: 0, endsAt: 0 };
  if (s.status === 'lobby' || !s.started_at) return { phase: 'lobby', round: 0, opensAt: 0, closesAt: 0, endsAt: 0 };
  const start = Date.parse(s.started_at);
  const slot = (st.seconds + st.reveal) * 1000;
  const endsAt = start + st.countdown * 1000 + st.rounds_total * slot;
  const t = nowMs - start - st.countdown * 1000;
  let phase: RoomPhase; let round: number;
  if (s.status === 'finished' || nowMs >= endsAt) { phase = 'finished'; round = st.rounds_total; }
  else if (t < 0) { phase = 'countdown'; round = 1; }
  else {
    const k = Math.min(st.rounds_total - 1, Math.floor(t / slot));
    round = k + 1;
    phase = t - k * slot < st.seconds * 1000 ? 'question' : 'reveal';
  }
  const opensAt = start + st.countdown * 1000 + (round - 1) * slot;
  return { phase, round, opensAt, closesAt: opensAt + st.seconds * 1000, endsAt };
}

// ── Llamadas ───────────────────────────────────────────────────────────────────────────────────────────
function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_rooms') === '1'; } catch { return false; }
}
/** Simulador activo (solo desarrollo): deja probar crear salas sin cuenta registrada */
export const roomsMockEnabled = mockEnabled;
/** ¿Se ofrece la sala en vivo? Interruptor remoto, la prueba en este teléfono (`?salas=beta`), o siempre en desarrollo */
export function roomsEnabled(flag: boolean): boolean {
  return flag || import.meta.env.DEV || roomsBetaOn();
}

async function rpc<T>(fn: string, args: Record<string, unknown>, needsSession = true): Promise<T> {
  if (needsSession) {
    const r = await ensureGuestSession({ force: true });
    if (r === 'unavailable') throw new RoomError('auth_required');
  }
  const t0 = Date.now();
  const { data, error } = await (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>)(fn, args);
  const t1 = Date.now();
  if (error) throw mapError(error);
  const sn = (data as { server_now?: string } | null)?.server_now;
  if (sn) noteServerTime(sn, t0, t1);
  return data as T;
}

export interface CreateRoomOpts { mode: GameMode; difficulty: Difficulty; category: Category; rounds: number; seconds: number; hostPlays: boolean; requestId: string }

/** Lugares de la sala: los elige el teléfono del anfitrión y el servidor los valida contra `places` (solo viaja el id) */
export function pickRoomCities(o: Pick<CreateRoomOpts, 'mode' | 'difficulty' | 'category' | 'rounds'>, exclude: string[] = []): ChallengeCity[] {
  return pickChallengeCities(o.difficulty, o.mode, o.rounds, exclude, o.category).filter((c) => c.id);
}
const idsOf = (cities: ChallengeCity[]) => cities.map((c) => ({ id: c.id! }));

export async function createRoom(o: CreateRoomOpts): Promise<RoomState> {
  const cities = pickRoomCities(o);
  if (mockEnabled()) return mock.create(o, cities);
  const items = idsOf(cities);
  return rpc<RoomState>('room_create', { p: {
    mode: o.mode, difficulty: o.difficulty, category: o.category, rounds_total: o.rounds, seconds_per_round: o.seconds,
    host_plays: o.hostPlays, items, client_request_id: o.requestId,
  } });
}
export async function fetchRoomState(target: { id?: string | null; pin?: string | null }): Promise<RoomState> {
  if (mockEnabled()) return mock.state(target);
  // Por PIN no hace falta sesión (unirse, espectador, pantalla para proyectar)
  return rpc<RoomState>('room_state', { p_id: target.id ?? null, p_pin: target.pin ?? null }, !!target.id);
}
export async function joinRoom(pin: string, name: string): Promise<RoomState> {
  if (mockEnabled()) return mock.join(pin, name);
  return rpc<RoomState>('room_join', { p_pin: pin, p_name: name });
}
export async function startRoom(id: string): Promise<RoomState> {
  if (mockEnabled()) return mock.start(id);
  return rpc<RoomState>('room_start', { p_id: id });
}
export async function answerRoom(id: string, round: number, lat: number, lon: number, timeS: number): Promise<RoomAnswerResult> {
  if (mockEnabled()) return mock.answer(id, round, lat, lon, timeS);
  return rpc<RoomAnswerResult>('room_answer', { p_id: id, p_round: round, p_lat: lat, p_lon: lon, p_time_s: Math.round(timeS * 10) / 10 });
}
export async function kickFromRoom(id: string, slot: number): Promise<RoomState> {
  if (mockEnabled()) return mock.kick(id, slot);
  return rpc<RoomState>('room_kick', { p_id: id, p_slot: slot });
}
export async function leaveRoom(id: string): Promise<void> {
  if (mockEnabled()) return mock.leave(id);
  await rpc<void>('room_leave', { p_id: id });
}
export async function cancelRoom(id: string): Promise<void> {
  if (mockEnabled()) return mock.cancel(id);
  await rpc<void>('room_cancel', { p_id: id });
}
export async function rematchRoom(id: string, s: RoomSettings, exclude: string[]): Promise<RoomState> {
  const cities = pickRoomCities({ mode: s.mode, difficulty: s.difficulty, category: s.category, rounds: s.rounds_total }, exclude);
  if (mockEnabled()) return mock.rematch(id, cities);
  return rpc<RoomState>('room_rematch', { p_id: id, p: { items: idsOf(cities) } });
}

/** Cada cuánto se consulta el estado según la fase */
export function pollInterval(phase: RoomPhase | null): number | null {
  const fast = mockEnabled() ? 0.4 : 1;
  switch (phase) {
    case 'cancelled': return null;
    case 'lobby': return 3000 * fast;
    case 'finished': return 5000 * fast;
    default: return 4000 * fast;
  }
}

/**
 * Estado de una sala consultado periódicamente (según la fase). `refresh()` pide uno ya (al empezar, al
 * responder, al cerrar una ronda…). Los errores de red no borran el último estado bueno.
 */
export function useRoomState(target: { id?: string | null; pin?: string | null }) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<RoomError | null>(null);
  const key = target.id ?? target.pin ?? '';
  const targetRef = useRef(target);
  targetRef.current = target;
  const keyRef = useRef(key);
  keyRef.current = key;
  // Una consulta a la vez por sala; la respuesta de otra sala (p. ej. la anterior a "Otra ronda") se descarta
  const inflight = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const k = keyRef.current;
    if (!k || inflight.current === k) return;
    inflight.current = k;
    try {
      const s = await fetchRoomState(targetRef.current);
      if (keyRef.current !== k) return;
      setState(s);
      setError(null);
    } catch (e) {
      if (keyRef.current === k) setError(e instanceof RoomError ? e : new RoomError('network'));
    } finally {
      if (inflight.current === k) inflight.current = null;
    }
  }, []);

  useEffect(() => { setState(null); setError(null); void refresh(); }, [key, refresh]);
  const interval = pollInterval(state?.phase ?? (error ? null : 'lobby'));
  useEffect(() => {
    if (!interval || !key) return;
    const id = setInterval(() => { if (!document.hidden) void refresh(); }, interval);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [interval, key, refresh]);

  return { state, setState, error, refresh };
}

// ── Simulador (solo desarrollo) ──────────────────────────────────────────────────────────────────────────
interface MockPlayer { uid: string; slot: number; name: string; avatar: string | null; kicked: boolean; skill: number }
interface MockAnswer { uid: string; round: number; lat: number; lon: number; time_s: number; km: number; base: number; points: number; combo: number; combo_mult: number }
interface MockRoom {
  id: string; pin: string; host: string; host_plays: boolean; status: RoomStatus; settings: RoomSettings;
  items: Required<RoomItem>[]; started_at: number | null; created_at: number; players: MockPlayer[]; answers: MockAnswer[]; next_room_id: string | null;
}
const ME = 'me';
const MOCK_KEY = 'geospeed_mock_rooms_db';
const BOT_NAMES = ['Valentina', 'Mateo', 'Camila', 'Santiago', 'Lucía', 'Sebastián', 'Isabella', 'Nicolás', 'Mariana', 'Samuel', 'Sofía', 'Daniel', 'Gabriela', 'Tomás', 'Laura', 'Andrés', 'Paula', 'Juan', 'Sara', 'Felipe'];
const BOT_AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐙', '🦉', null, '🐯', '🐨', null];
const mockDb = (): Record<string, MockRoom> => { try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}'); } catch { return {}; } };
const mockSave = (db: Record<string, MockRoom>) => localStorage.setItem(MOCK_KEY, JSON.stringify(db));
const delay = () => new Promise((r) => setTimeout(r, 120));
const rand = (seed: string) => { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };
const SETTINGS_EXTRA = { countdown: 5, reveal: 8 };

const mockItems = (cities: ChallengeCity[]): Required<RoomItem>[] =>
  cities.map((c, i) => ({ n: i + 1, id: c.id!, kind: c.kind ?? 'city', name: c.name, country: c.country ?? null, lat: c.lat, lon: c.lon }));

/** Respuestas de los jugadores falsos hasta este instante (cada uno con su tiempo y su puntería) */
function mockBots(r: MockRoom, now: number): void {
  if (r.status !== 'playing' || !r.started_at) return;
  const st = r.settings;
  const tl = roomTimeline({ status: r.status, started_at: new Date(r.started_at).toISOString(), settings: st }, now);
  const lastRound = tl.phase === 'finished' ? st.rounds_total : tl.round;
  for (let round = 1; round <= lastRound; round++) {
    const opens = r.started_at + st.countdown * 1000 + (round - 1) * (st.seconds + st.reveal) * 1000;
    const item = r.items[round - 1];
    for (const p of r.players) {
      if (p.uid === ME || p.kicked || r.answers.some((a) => a.uid === p.uid && a.round === round)) continue;
      const x = rand(`${r.id}${p.uid}${round}`);
      if (x < 0.08) continue; // a veces no responde
      const time = Math.round((1.2 + x * (st.seconds - 2)) * 10) / 10;
      if (now < opens + time * 1000) continue;
      const km = Math.round(((1 - p.skill) * 2500 * rand(`${p.uid}${round}km`) + 5) * 10) / 10;
      const dLat = (km / 111) * (rand(`${p.uid}${round}a`) - 0.5), dLon = (km / 111) * (rand(`${p.uid}${round}b`) - 0.5);
      mockScore(r, p.uid, round, item.lat + dLat, item.lon + dLon, time, km);
    }
  }
}

function mockScore(r: MockRoom, uid: string, round: number, lat: number, lon: number, time: number, kmOverride?: number): MockAnswer {
  const item = r.items[round - 1];
  const km = kmOverride ?? Math.round(haversineDistance(lat, lon, item.lat, item.lon) * 10) / 10;
  const prev = r.answers.filter((a) => a.uid === uid && a.round < round).sort((a, b) => b.round - a.round)[0];
  const prevCombo = prev && prev.round === round - 1 ? prev.combo : 0;
  const s = scoreRound(closeness(km, scaleForMode(r.settings.mode)), time, prevCombo, difficultyHundredths(r.settings.difficulty));
  const a: MockAnswer = { uid, round, lat, lon, time_s: time, km, base: s.closeness, points: s.points, combo: s.combo, combo_mult: s.comboMult };
  r.answers.push(a);
  return a;
}

function mockView(r: MockRoom, now: number, viewer: string | null): RoomState {
  mockBots(r, now);
  const st = r.settings;
  const tl = roomTimeline({ status: r.status, started_at: r.started_at ? new Date(r.started_at).toISOString() : null, settings: st }, now);
  if (r.status === 'playing' && tl.phase === 'finished') r.status = 'finished';
  if (r.status === 'lobby' && now - r.created_at > 30 * 60 * 1000) r.status = 'cancelled';
  const closed = tl.phase === 'reveal' ? tl.round : tl.phase === 'question' ? tl.round - 1 : tl.phase === 'finished' ? st.rounds_total : 0;
  const shown = tl.phase === 'countdown' ? 1 : tl.phase === 'question' ? tl.round : tl.phase === 'reveal' ? Math.min(tl.round + 1, st.rounds_total) : tl.phase === 'finished' ? st.rounds_total : 0;
  const live = r.players.filter((p) => !p.kicked);
  const stats = live.map((p) => {
    const mine = r.answers.filter((a) => a.uid === p.uid);
    return { p, total: mine.reduce((s, a) => s + a.points, 0), hits: mine.filter((a) => a.base >= 800).length, time: mine.reduce((s, a) => s + a.time_s, 0), answered: mine.length };
  }).sort((a, b) => b.total - a.total || a.time - b.time || b.hits - a.hits);
  const players: RoomPlayer[] = stats.map((x, i) => ({
    slot: x.p.slot, name: x.p.name, avatar: x.p.avatar, total: x.total, hits: x.hits, answered: x.answered, is_host: x.p.uid === r.host, me: x.p.uid === viewer,
    answered_now: r.answers.some((a) => a.uid === x.p.uid && a.round === tl.round),
    rank: i > 0 && stats[i - 1].total === x.total && stats[i - 1].time === x.time && stats[i - 1].hits === x.hits ? 0 : i + 1,
  }));
  players.forEach((p, i) => { if (p.rank === 0) p.rank = players[i - 1].rank; });
  const me = viewer ? r.players.find((p) => p.uid === viewer && !p.kicked) : undefined;
  const iso = (ms: number) => new Date(ms).toISOString();
  return {
    id: r.id, pin: r.pin, status: r.status, phase: tl.phase, round: tl.round,
    opens_at: tl.opensAt ? iso(tl.opensAt) : null, closes_at: tl.closesAt ? iso(tl.closesAt) : null, ends_at: tl.endsAt ? iso(tl.endsAt) : null,
    server_now: iso(now), started_at: r.started_at ? iso(r.started_at) : null,
    settings: st, host_name: r.players.find((p) => p.uid === r.host)?.name ?? 'Anfitrión',
    i_am_host: viewer === r.host, i_am_player: !!me, kicked: !!(viewer && r.players.find((p) => p.uid === viewer)?.kicked),
    players, player_count: players.length,
    answered_count: r.answers.filter((a) => a.round === tl.round && live.some((p) => p.uid === a.uid)).length,
    items: r.items.filter((it) => it.n <= shown).map((it) => (it.n <= closed ? it : { n: it.n, id: it.id, kind: it.kind, name: it.name, country: it.country })),
    reveal: closed > 0 && (tl.phase === 'reveal' || tl.phase === 'finished') ? {
      round: closed,
      clicks: r.answers.filter((a) => a.round === closed && live.some((p) => p.uid === a.uid)).sort((a, b) => b.points - a.points).map((a) => {
        const p = r.players.find((x) => x.uid === a.uid)!;
        return { slot: p.slot, name: p.name, lat: a.lat, lon: a.lon, km: a.km, base: a.base, points: a.points, time_s: a.time_s, me: a.uid === viewer };
      }),
    } : null,
    me: me ? { slot: me.slot, name: me.name, total: stats.find((x) => x.p.uid === viewer)?.total ?? 0,
      answers: r.answers.filter((a) => a.uid === viewer).sort((a, b) => a.round - b.round).map((a) => ({ round: a.round, lat: a.lat, lon: a.lon, time_s: a.time_s, km: a.km, base: a.base, points: a.points, combo: a.combo, combo_mult: a.combo_mult })) } : null,
    next_room: r.next_room_id ? { id: r.next_room_id, pin: mockDb()[r.next_room_id]?.pin ?? '', status: mockDb()[r.next_room_id]?.status ?? 'lobby' } : null,
  };
}

function mockNewRoom(host: string, o: { mode: GameMode; difficulty: Difficulty; category: Category; rounds: number; seconds: number; hostPlays: boolean }, cities: ChallengeCity[]): MockRoom {
  return {
    id: crypto.randomUUID(), pin: String(100000 + Math.floor(Math.random() * 900000)), host, host_plays: o.hostPlays, status: 'lobby',
    settings: { mode: o.mode, difficulty: o.difficulty, category: o.category, rounds_total: o.rounds, seconds: o.seconds, max_players: ROOM_MAX_PLAYERS, host_plays: o.hostPlays, ...SETTINGS_EXTRA },
    items: mockItems(cities), started_at: null, created_at: Date.now(), players: [], answers: [], next_room_id: null,
  };
}

const mock = {
  async create(o: CreateRoomOpts, cities: ChallengeCity[]): Promise<RoomState> {
    await delay();
    const db = mockDb();
    for (const r of Object.values(db)) if (r.host === ME && r.status === 'lobby') r.status = 'cancelled';
    const r = mockNewRoom(ME, o, cities);
    if (o.hostPlays) r.players.push({ uid: ME, slot: 1, name: savedRoomName() || 'Juanjo', avatar: null, kicked: false, skill: 0 });
    db[r.id] = r; mockSave(db);
    return mockView(r, Date.now(), ME);
  },
  async state(target: { id?: string | null; pin?: string | null }): Promise<RoomState> {
    await delay();
    const db = mockDb();
    const r = target.id ? db[target.id] : Object.values(db).filter((x) => x.pin === target.pin).sort((a, b) => b.created_at - a.created_at)[0];
    if (!r) throw new RoomError('unavailable');
    const v = mockView(r, Date.now(), ME);
    mockSave(db);
    return v;
  },
  async join(pin: string, name: string): Promise<RoomState> {
    await delay();
    const db = mockDb();
    const r = Object.values(db).filter((x) => x.pin === pin && (x.status === 'lobby' || x.status === 'playing')).sort((a, b) => b.created_at - a.created_at)[0];
    if (!r) throw new RoomError('unavailable');
    const mine = r.players.find((p) => p.uid === ME);
    if (mine?.kicked) throw new RoomError('kicked');
    if (!mine) {
      if (r.status !== 'lobby') throw new RoomError('started');
      if (r.players.filter((p) => !p.kicked).length >= r.settings.max_players) throw new RoomError('full');
      const n = name.trim();
      if (n.length < ROOM_NAME_MIN || /puta|mierda|fuck/i.test(n)) throw new RoomError('name_invalid');
      r.players.push({ uid: ME, slot: Math.max(0, ...r.players.map((p) => p.slot)) + 1, name: n, avatar: null, kicked: false, skill: 0 });
    }
    mockSave(db);
    return mockView(r, Date.now(), ME);
  },
  async start(id: string): Promise<RoomState> {
    await delay();
    const db = mockDb(); const r = db[id];
    if (!r || r.host !== ME) throw new RoomError('unavailable');
    if (r.players.filter((p) => !p.kicked).length < 2) throw new RoomError('not_enough_players');
    if (r.status === 'lobby') { r.status = 'playing'; r.started_at = Date.now(); }
    mockSave(db);
    return mockView(r, Date.now(), ME);
  },
  async answer(id: string, round: number, lat: number, lon: number, timeS: number): Promise<RoomAnswerResult> {
    await delay();
    const db = mockDb(); const r = db[id];
    if (!r) throw new RoomError('unavailable');
    const prev = r.answers.find((a) => a.uid === ME && a.round === round);
    const now = Date.now();
    const tl = roomTimeline({ status: r.status, started_at: r.started_at ? new Date(r.started_at).toISOString() : null, settings: r.settings }, now);
    if (!prev && (tl.round !== round || now > tl.closesAt + 1000 || (tl.phase !== 'question' && tl.phase !== 'reveal'))) throw new RoomError('round_closed');
    const a = prev ?? mockScore(r, ME, round, lat, lon, Math.max(timeS, (now - tl.opensAt) / 1000 - 1));
    mockSave(db);
    const total = r.answers.filter((x) => x.uid === ME).reduce((s, x) => s + x.points, 0);
    return { round, km: a.km, base: a.base, points: a.points, combo: a.combo, combo_mult: a.combo_mult, time_s: a.time_s, total, repeat: !!prev };
  },
  async kick(id: string, slot: number): Promise<RoomState> {
    await delay();
    const db = mockDb(); const r = db[id];
    const p = r?.players.find((x) => x.slot === slot && x.uid !== r.host);
    if (p) p.kicked = true;
    mockSave(db);
    return mockView(r, Date.now(), ME);
  },
  async leave(id: string): Promise<void> {
    await delay();
    const db = mockDb(); const r = db[id];
    if (!r) return;
    if (r.host === ME && r.status === 'lobby') r.status = 'cancelled';
    else if (r.status === 'lobby') r.players = r.players.filter((p) => p.uid !== ME);
    mockSave(db);
  },
  async cancel(id: string): Promise<void> {
    await delay();
    const db = mockDb(); const r = db[id];
    if (r && r.host === ME && (r.status === 'lobby' || r.status === 'playing')) r.status = 'cancelled';
    mockSave(db);
  },
  async rematch(id: string, cities: ChallengeCity[]): Promise<RoomState> {
    await delay();
    const db = mockDb(); const r = db[id];
    if (!r || r.host !== ME) throw new RoomError('unavailable');
    if (r.next_room_id && db[r.next_room_id]) return mockView(db[r.next_room_id], Date.now(), ME);
    const s = r.settings;
    const n = mockNewRoom(ME, { mode: s.mode, difficulty: s.difficulty, category: s.category, rounds: s.rounds_total, seconds: s.seconds, hostPlays: s.host_plays }, cities);
    n.players = r.players.filter((p) => !p.kicked).map((p, i) => ({ ...p, slot: i + 1 }));
    db[n.id] = n; r.next_room_id = n.id; mockSave(db);
    return mockView(n, Date.now(), ME);
  },
};

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  /** Suma n jugadores falsos (entran de a uno) a mi sala en espera más reciente */
  w.__mockRoomBots = (n = 5) => {
    const db = mockDb();
    const r = Object.values(db).filter((x) => x.host === ME && x.status === 'lobby').sort((a, b) => b.created_at - a.created_at)[0]
      ?? Object.values(db).filter((x) => x.status === 'lobby' && x.players.some((p) => p.uid === ME)).sort((a, b) => b.created_at - a.created_at)[0];
    if (!r) return 'no hay sala en espera';
    let added = 0;
    const tick = () => {
      const d = mockDb(); const room = d[r.id];
      if (!room || added >= n || room.players.filter((p) => !p.kicked).length >= ROOM_MAX_PLAYERS) return;
      const slot = Math.max(0, ...room.players.map((p) => p.slot)) + 1;
      room.players.push({ uid: `bot${slot}`, slot, name: BOT_NAMES[(slot - 1) % BOT_NAMES.length] + (slot > BOT_NAMES.length ? ` ${slot}` : ''), avatar: BOT_AVATARS[slot % BOT_AVATARS.length], kicked: false, skill: 0.4 + rand(`${room.id}${slot}`) * 0.55 });
      mockSave(d); added++;
      setTimeout(tick, 450);
    };
    tick();
    return `entrando ${n} a ${r.pin}`;
  };
  /** Sala de otro anfitrión (falso) con n jugadores, para probar unirse con el PIN */
  w.__mockRoomHosted = (n = 4, mode: GameMode = 'world', category: Category = 'cities') => {
    const o = { mode, difficulty: 'basic' as Difficulty, category, rounds: 5, seconds: 15, hostPlays: true };
    const r = mockNewRoom('bot1', o, pickRoomCities(o));
    for (let i = 1; i <= n; i++) r.players.push({ uid: `bot${i}`, slot: i, name: BOT_NAMES[i - 1], avatar: BOT_AVATARS[i % BOT_AVATARS.length], kicked: false, skill: 0.5 + rand(`${r.id}${i}`) * 0.4 });
    const db = mockDb(); db[r.id] = r; mockSave(db);
    return r.pin;
  };
  /** El anfitrión falso empieza su sala (para probar al invitado en la partida) */
  w.__mockRoomStartHosted = (pin: string) => {
    const db = mockDb();
    const r = Object.values(db).find((x) => x.pin === pin && x.status === 'lobby');
    if (!r) return 'no existe';
    r.status = 'playing'; r.started_at = Date.now(); mockSave(db);
    return 'ok';
  };
}
