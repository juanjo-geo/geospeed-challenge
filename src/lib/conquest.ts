/**
 * Conquista el mapa (docs/GeoSpeed_Conquista_Plan.md): cliente de las funciones del servidor
 * (supabase/migrations/20261108120000_conquest.sql). C3: grupos, invitaciones y sala de espera. C4: tablero, ficha del
 * territorio y práctica. C5: la misión oficial (el servidor abre cada ronda y mide el tiempo) y su resultado. El cierre de
 * temporada y la actividad llegan en C6.
 *
 * Solo con cuenta registrada (decisión CQ-D1): sin sesión, o con una de invitado, las llamadas responden
 * `account_required` sin tocar el servidor (la vista previa de una invitación sí funciona sin sesión).
 *
 * Simulador de desarrollo (sin cuenta ni servidor): `localStorage.geospeed_mock_conquest = '1'` (solo DEV).
 *  · `__mockConqJoin(n)` suma n personas falsas a mi grupo más reciente.
 *  · `__mockConqGroup(n)` crea un grupo de otra persona con n integrantes y devuelve su código (para probar unirse).
 *  · `__mockConqConfirm()` hace que todos confirmen la próxima temporada.
 *  · `__mockConqOwn(iso, quien, marca)` da un territorio de la temporada en curso: quien = 'me' | 'bot' | n.º de puesto |
 *    'retired' | 'free'.
 *  · `__mockConqReserve(iso, min)` simula que alguien juega por ese país; `__mockConqUse(iso)` gasta una misión mía ahí.
 *  · Las misiones simuladas usan las 5 primeras ciudades del banco como paquete oficial y el reloj real.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { conquestBetaOn } from '@/lib/conquestBeta';
import { cityById } from '@/lib/itemMemory';
import { CONQUEST_COUNTRIES } from '@/data/conquestCatalog';

// ── Tipos (lo que devuelve el servidor) ──────────────────────────────────────────────────────────────────
export interface ConqRules {
  version: number; season_days: number; rounds: number; seconds: number; threshold: number; daily_missions: number;
  per_country_daily: number; cooldown_s: number; reservation_s: number; last_minutes_s: number; min_players: number;
  max_players: number; time_scale: number;
}
export type ConqSeasonStatus = 'lobby' | 'active' | 'closed' | 'cancelled';
export interface ConqMember { user_id: string; name: string | null; avatar: string | null; role: 'admin' | 'member'; me: boolean; confirmed: boolean }
export interface ConqSeasonInfo { id: string; number: number; status: ConqSeasonStatus; started_at: string | null; ends_at: string | null; rules: ConqRules; in_roster: boolean }
export interface ConqGroup {
  id: string; name: string; status: 'active' | 'archived'; is_admin: boolean; invite_code: string | null; max_players: number;
  server_now: string; muted: boolean | null; members: ConqMember[]; season: ConqSeasonInfo | null;
  last_closed: { id: string; number: number; closed_at: string; champions: (string | null)[] } | null;
}
export type ConqInviteState = 'open' | 'full' | 'season_active' | 'member';
export interface ConqPreview { group_id: string | null; name: string; admin_name: string | null; members_count: number; max_players: number; already_member: boolean; state: ConqInviteState }
export interface ConqGroupSummary {
  id: string; name: string; members_count: number;
  season: { id: string; number: number; status: ConqSeasonStatus; ends_at: string | null; in_roster: boolean } | null;
  me: { territories: number; defense_sum: number; rank: number } | null;
  unread: number;
}

/** Tablero (conq_map): plantilla congelada, territorios, clasificación y mis cupos */
export interface ConqPlayer { user_id: string; name: string | null; avatar: string | null; slot: number }
export interface ConqTerritory {
  iso: string; owner_id: string | null; retired: boolean; defense: number; version: number; captured_at: string | null; reserved_until: string | null;
}
export interface ConqStanding { user_id: string; name: string | null; slot: number; avatar: string | null; territories: number; defense_sum: number; rank: number }
export interface ConqMe { missions_left: number; missions_per_day: number; next_reset_at: string; active_attempt: string | null; in_roster: boolean }
export interface ConqMap {
  season: { id: string; group_id: string; number: number; status: ConqSeasonStatus; started_at: string | null; ends_at: string | null; rules: ConqRules; catalog: string[] };
  server_now: string; data_version: number; players: ConqPlayer[]; territories: ConqTerritory[]; standings: ConqStanding[];
  final: boolean; me: ConqMe | null; unread: number;
  /** Mi id (lo agrega el cliente desde la sesión: el servidor no lo repite) */
  my_id: string | null;
}
/** Por qué no se puede iniciar una misión en un país (conq_territory.reason) */
export type ConqBlock = 'season_closed' | 'not_in_roster' | 'season_ending' | 'own_territory' | 'reserved' | 'attempt_active' | 'daily_limit' | 'country_limit' | 'cooldown';
export type ConqKind = 'capture' | 'attack' | 'recover';
export interface ConqTerritoryDetail {
  iso: string; owner_id: string | null; retired: boolean; defense: number; version: number; reserved_until: string | null;
  kind: ConqKind; threshold: number; rounds: number; seconds: number; can_start: boolean; reason: ConqBlock | null;
  cooldown_until: string | null; my_country_today: number; per_country_daily: number; me: ConqMe | null; server_now: string;
}
/** Misión oficial (conq_attempt_*): el lugar de cada ronda solo llega al abrirla y la ubicación correcta, al cerrarla */
export type ConqAttemptStatus = 'active' | 'completed' | 'abandoned' | 'expired' | 'void';
export type ConqOutcome = 'captured' | 'failed' | 'conquered' | 'defended' | 'tie' | 'abandoned' | 'expired' | 'void';
export interface ConqRound {
  idx: number; place_id: string | null; name: string | null; opened_at: string | null; deadline_at: string | null; closed: boolean;
  answer: { lat: number | null; lon: number | null; time_s: number | null; distance_km: number | null; points: number } | null;
  correct: { lat: number; lon: number } | null;
}
export interface ConqAttempt {
  id: string; season_id: string; country: string; kind: ConqKind; status: ConqAttemptStatus; outcome: ConqOutcome | null;
  started_at: string; first_open_deadline: string; expires_at: string; finished_at: string | null; total: number;
  owner_at_start: string | null; defense_at_start: number; threshold: number; seconds: number; server_now: string;
  territory: { owner_id: string | null; retired: boolean; defense: number; version: number };
  rounds: ConqRound[];
}

/** Ciudad de práctica: del banco del país, fuera del paquete oficial (el servidor no revela las oficiales) */
export interface ConqPracticeCity { id: string; name: string; lat: number; lon: number }

export const CONQ_MAX_PLAYERS = 5;
export const CONQ_MIN_PLAYERS = 2;
export const CONQ_NAME_MIN = 3;
export const CONQ_NAME_MAX = 30;
/** Reglas aprobadas (se muestran antes de iniciar; el servidor manda las de cada temporada) */
export const CONQ_RULES_V1: ConqRules = {
  version: 1, season_days: 7, rounds: 5, seconds: 15, threshold: 2000, daily_missions: 5, per_country_daily: 2,
  cooldown_s: 3600, reservation_s: 180, last_minutes_s: 180, min_players: 2, max_players: 5, time_scale: 1,
};

/** Código de invitación: 6 letras o números, sin espacios ni minúsculas */
export const normalizeConqCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
export const isConqCode = (s: string) => /^[A-Z0-9]{6}$/.test(s);
export const conquestLink = (code: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://geospeed-challenge.vercel.app'}/conquista/${code}`;
export const cleanGroupName = (raw: string) => raw.replace(/\s+/g, ' ').trimStart().slice(0, CONQ_NAME_MAX);

// ── Errores con código estable (se traducen con cq_err_<código>) ─────────────────────────────────────────
export type ConqErrorCode =
  | 'account_required' | 'name_invalid' | 'group_limit' | 'rate_limited' | 'invite_invalid' | 'season_active' | 'group_full'
  | 'not_member' | 'not_admin' | 'not_allowed' | 'not_enough_players' | 'catalog_incomplete' | 'season_closed' | 'not_in_roster'
  | 'season_ending' | 'attempt_active' | 'country_invalid' | 'reserved' | 'own_territory' | 'daily_limit' | 'country_limit'
  | 'cooldown' | 'attempt_unavailable' | 'round_invalid' | 'coord_invalid' | 'network';
const KNOWN = /conq_(account_required|name_invalid|group_limit|rate_limited|invite_invalid|season_active|group_full|not_member|not_admin|not_allowed|not_enough_players|catalog_incomplete|season_closed|not_in_roster|season_ending|attempt_active|country_invalid|reserved|own_territory|daily_limit|country_limit|cooldown|attempt_unavailable|round_invalid|coord_invalid)/;
export class ConqError extends Error {
  constructor(public code: ConqErrorCode, message?: string) { super(message ?? code); }
}
export function mapConqError(error: { message?: string; code?: string } | null): ConqError {
  const msg = error?.message ?? '';
  const m = msg.match(KNOWN);
  if (m) return new ConqError(m[1] as ConqErrorCode);
  if (/not authenticated/.test(msg)) return new ConqError('account_required');
  return new ConqError('network', msg);
}

// ── Reloj del servidor (la cuenta regresiva de la temporada; las rondas de C5 lo afinan) ─────────────────
let clockOffsetMs = 0;
let clockBestRtt = Infinity;
function noteServerTime(serverNowIso: string | undefined, t0: number, t1: number): void {
  const server = serverNowIso ? Date.parse(serverNowIso) : NaN;
  if (!Number.isFinite(server)) return;
  const rtt = t1 - t0;
  if (rtt <= clockBestRtt + 60) { clockOffsetMs = server - (t0 + t1) / 2; clockBestRtt = Math.min(clockBestRtt, rtt); }
}
/** Hora del servidor en ms (estimada en el teléfono) */
export const conqServerNow = () => Date.now() + clockOffsetMs;

/**
 * Puntos de una ronda (especificación v1.1, igual que `_conq_points` en el servidor):
 * redondear(1.000 × e^(−d/500) × (0,5 + 0,5 × (1 − t/15))), mitades hacia arriba; 0 sin respuesta o con t ≥ 15 s.
 * El servidor calcula los oficiales; aquí sirve para la práctica.
 */
export function conqPoints(km: number | null | undefined, t: number | null | undefined, seconds = 15): number {
  if (km == null || t == null || !Number.isFinite(km) || !Number.isFinite(t) || t >= seconds) return 0;
  return Math.floor(1000 * Math.exp(-Math.max(0, km) / 500) * (0.5 + 0.5 * (1 - Math.max(t, 0) / seconds)) + 0.5);
}

/** "6 d 23 h" · "5 h 10 min" · "12 min" */
export function formatTimeLeft(ms: number): string {
  const mins = Math.max(0, Math.ceil(ms / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  if (d > 0) return `${d} d${h ? ` ${h} h` : ''}`;
  if (h > 0) return `${h} h${m ? ` ${m} min` : ''}`;
  return `${m} min`;
}

// ── Interruptor ──────────────────────────────────────────────────────────────────────────────────────────
function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_conquest') === '1'; } catch { return false; }
}
export const conquestMockEnabled = mockEnabled;
/** ¿Se ofrece Conquista? Interruptor remoto, la prueba en este teléfono (`?conquista=beta`), o siempre en desarrollo */
export function conquestEnabled(flag: boolean): boolean {
  return flag || import.meta.env.DEV || conquestBetaOn();
}

// ── Llamadas ─────────────────────────────────────────────────────────────────────────────────────────────
async function registered(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session && !session.user.is_anonymous;
}

async function sessionUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

async function rpc<T>(fn: string, args: Record<string, unknown>, needsAccount = true): Promise<T> {
  if (needsAccount && !(await registered())) throw new ConqError('account_required');
  const t0 = Date.now();
  const { data, error } = await (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>)(fn, args);
  const t1 = Date.now();
  if (error) throw mapConqError(error);
  noteServerTime((data as { server_now?: string } | null)?.server_now, t0, t1);
  return data as T;
}

export async function createGroup(name: string, requestId: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.create(name);
  return rpc<ConqGroup>('conq_group_create', { p_name: name.trim(), p_request_id: requestId });
}
export async function previewInvite(code: string): Promise<ConqPreview> {
  if (mockEnabled()) return mock.preview(code);
  return rpc<ConqPreview>('conq_invite_preview', { p_code: code }, false);
}
export async function acceptInvite(code: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.accept(code);
  return rpc<ConqGroup>('conq_invite_accept', { p_code: code });
}
export async function fetchGroup(id: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.state(id);
  return rpc<ConqGroup>('conq_group_state', { p_group: id });
}
export async function fetchMyGroups(): Promise<ConqGroupSummary[]> {
  if (mockEnabled()) return mock.mine();
  return (await rpc<{ groups: ConqGroupSummary[] }>('my_conq_groups', {})).groups ?? [];
}
export async function regenerateInvite(id: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.regenerate(id);
  return rpc<ConqGroup>('conq_invite_regenerate', { p_group: id });
}
export async function removeMember(id: string, userId: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.remove(id, userId);
  return rpc<ConqGroup>('conq_member_remove', { p_group: id, p_member: userId });
}
export async function leaveGroup(id: string): Promise<void> {
  if (mockEnabled()) return mock.leave(id);
  await rpc('conq_group_leave', { p_group: id });
}
export async function cancelGroup(id: string): Promise<void> {
  if (mockEnabled()) return mock.cancel(id);
  await rpc('conq_group_cancel', { p_group: id });
}
export async function setParticipation(id: string, on: boolean): Promise<ConqGroup> {
  if (mockEnabled()) return mock.confirm(id, on);
  return rpc<ConqGroup>('conq_confirm', { p_group: id, p_on: on });
}
export async function setMuted(id: string, on: boolean): Promise<ConqGroup> {
  if (mockEnabled()) return mock.mute(id, on);
  return rpc<ConqGroup>('conq_mute', { p_group: id, p_on: on });
}
export async function startSeason(id: string): Promise<ConqGroup> {
  if (mockEnabled()) return mock.start(id);
  return rpc<ConqGroup>('conq_season_start', { p_group: id });
}

export async function fetchMap(seasonId: string): Promise<ConqMap> {
  if (mockEnabled()) return mock.map(seasonId);
  const [m, myId] = await Promise.all([rpc<Omit<ConqMap, 'my_id'>>('conq_map', { p_season: seasonId }), sessionUserId()]);
  return { ...m, my_id: myId };
}
export async function fetchTerritory(seasonId: string, iso: string): Promise<ConqTerritoryDetail> {
  if (mockEnabled()) return mock.territory(seasonId, iso);
  return rpc<ConqTerritoryDetail>('conq_territory', { p_season: seasonId, p_iso: iso });
}
export async function fetchPracticeSet(seasonId: string, iso: string): Promise<ConqPracticeCity[]> {
  if (mockEnabled()) return mock.practice(seasonId, iso);
  return (await rpc<ConqPracticeCity[] | null>('conq_practice_set', { p_season: seasonId, p_iso: iso })) ?? [];
}

// ── Misión oficial ───────────────────────────────────────────────────────────────────────────────────────
export async function startAttempt(seasonId: string, iso: string, requestId: string): Promise<ConqAttempt> {
  if (mockEnabled()) return mock.attemptStart(seasonId, iso, requestId);
  return rpc<ConqAttempt>('conq_attempt_start', { p_season: seasonId, p_iso: iso, p_request_id: requestId });
}
export async function openRound(attemptId: string, idx: number): Promise<ConqAttempt> {
  if (mockEnabled()) return mock.roundOpen(attemptId, idx);
  return rpc<ConqAttempt>('conq_round_open', { p_attempt: attemptId, p_idx: idx });
}
export async function answerRound(attemptId: string, idx: number, lat: number, lon: number): Promise<ConqAttempt> {
  if (mockEnabled()) return mock.roundAnswer(attemptId, idx, lat, lon);
  return rpc<ConqAttempt>('conq_round_answer', { p_attempt: attemptId, p_idx: idx, p_lat: lat, p_lon: lon });
}
export async function abandonAttempt(attemptId: string): Promise<ConqAttempt> {
  if (mockEnabled()) return mock.attemptAbandon(attemptId);
  return rpc<ConqAttempt>('conq_attempt_abandon', { p_attempt: attemptId });
}
export async function fetchAttempt(attemptId: string): Promise<ConqAttempt> {
  if (mockEnabled()) return mock.attemptState(attemptId);
  return rpc<ConqAttempt>('conq_attempt_state', { p_attempt: attemptId });
}
/** Ronda en juego: la primera sin cerrar (null si ya se cerraron las cinco) */
export const currentRound = (a: ConqAttempt): ConqRound | null => a.rounds.find((r) => !r.closed) ?? null;
/** Ciudades respondidas (con un toque; las que vencieron sin respuesta no cuentan) */
export const answeredRounds = (a: ConqAttempt) => a.rounds.filter((r) => r.closed && r.answer?.lat != null).length;

/** Misión en curso de este teléfono (para volver a ella tras recargar o cerrar la app) */
const ACTIVE_KEY = 'geospeed_conq_active';
export interface ActiveMission { attemptId: string; seasonId: string; iso: string }
export function rememberActiveMission(m: ActiveMission): void { try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(m)); } catch { /* sin almacenamiento */ } }
export function forgetActiveMission(attemptId?: string): void {
  try { if (!attemptId || activeMission()?.attemptId === attemptId) localStorage.removeItem(ACTIVE_KEY); } catch { /* sin almacenamiento */ }
}
export function activeMission(): ActiveMission | null {
  try { const v = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); return v?.attemptId ? v : null; } catch { return null; }
}

/** Repite `refresh` cada `every` ms con la pestaña visible y al volver a ella */
function usePolling(key: string | null, every: number, refresh: () => Promise<void>) {
  useEffect(() => {
    if (!key) return;
    const tick = () => { if (document.visibilityState === 'visible') void refresh(); };
    const t = setInterval(tick, every);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [key, every, refresh]);
}

/** Tablero de una temporada: consulta cada 20 s (las capturas de los demás aparecen solas) */
export function useConqMap(seasonId: string | null) {
  const [map, setMap] = useState<ConqMap | null>(null);
  const [error, setError] = useState<ConqError | null>(null);
  const idRef = useRef(seasonId);
  idRef.current = seasonId;
  const refresh = useCallback(async () => {
    const k = idRef.current;
    if (!k) return;
    try {
      const m = await fetchMap(k);
      if (idRef.current === k) { setMap(m); setError(null); }
    } catch (e) {
      if (idRef.current === k) setError(e instanceof ConqError ? e : new ConqError('network'));
    }
  }, []);
  useEffect(() => { setMap(null); setError(null); void refresh(); }, [seasonId, refresh]);
  usePolling(seasonId, map?.final ? 120_000 : 20_000, refresh);
  return { map, error, refresh };
}

/** Ficha de un territorio: consulta cada 15 s (reservas y esperas cambian solas) */
export function useConqTerritory(seasonId: string | null, iso: string | null) {
  const [detail, setDetail] = useState<ConqTerritoryDetail | null>(null);
  const [error, setError] = useState<ConqError | null>(null);
  const key = seasonId && iso ? `${seasonId}:${iso}` : null;
  const keyRef = useRef(key);
  keyRef.current = key;
  const refresh = useCallback(async () => {
    const k = keyRef.current;
    if (!k) return;
    const [sid, i] = k.split(':');
    try {
      const d = await fetchTerritory(sid, i);
      if (keyRef.current === k) { setDetail(d); setError(null); }
    } catch (e) {
      if (keyRef.current === k) setError(e instanceof ConqError ? e : new ConqError('network'));
    }
  }, []);
  useEffect(() => { setDetail(null); setError(null); void refresh(); }, [key, refresh]);
  usePolling(key, 15_000, refresh);
  return { detail, error, refresh };
}

/** Sala del grupo: consulta cada 5 s en la sala de espera (para ver quién entra) y cada 30 s con temporada en curso */
export function useConqGroup(id: string | null) {
  const [group, setGroup] = useState<ConqGroup | null>(null);
  const [error, setError] = useState<ConqError | null>(null);
  const idRef = useRef(id);
  idRef.current = id;
  const refresh = useCallback(async () => {
    const k = idRef.current;
    if (!k) return;
    try {
      const g = await fetchGroup(k);
      if (idRef.current === k) { setGroup(g); setError(null); }
    } catch (e) {
      if (idRef.current === k) setError(e instanceof ConqError ? e : new ConqError('network'));
    }
  }, []);
  useEffect(() => { setGroup(null); setError(null); void refresh(); }, [id, refresh]);
  const every = group?.season?.status === 'active' ? 30_000 : 5_000;
  useEffect(() => {
    if (!id) return;
    const tick = () => { if (document.visibilityState === 'visible') void refresh(); };
    const t = setInterval(tick, every);
    const onVis = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [id, every, refresh]);
  return { group, setGroup, error, refresh };
}

// ── Simulador de desarrollo ──────────────────────────────────────────────────────────────────────────────
interface MockMember { user_id: string; name: string; avatar: string | null; role: 'admin' | 'member'; joined_at: number; muted: boolean }
interface MockTerr { owner: string | null; retired: boolean; defense: number; version: number; reserved_until: number | null; captured_at: number | null; reserved_by?: string | null }
interface MockRound { idx: number; place_id: string; opened_at: number | null; deadline_at: number | null; closed: boolean; lat: number | null; lon: number | null; time_s: number | null; km: number | null; points: number }
interface MockAttempt {
  id: string; iso: string; kind: ConqKind; status: ConqAttemptStatus; outcome: ConqOutcome | null; started_at: number; first_open_deadline: number;
  expires_at: number; finished_at: number | null; total: number; owner_at_start: string | null; defense_at_start: number; version_at_start: number;
  request_id: string; rounds: MockRound[];
}
interface MockSeason {
  id: string; number: number; status: ConqSeasonStatus; confirms: string[]; started_at: number | null; ends_at: number | null;
  roster?: ConqPlayer[]; terr?: Record<string, MockTerr>; used?: { iso: string; at: number; attempt?: string }[]; attempts?: MockAttempt[];
}
interface MockGroup { id: string; name: string; status: 'active' | 'archived'; admin: string; code: string; members: MockMember[]; seasons: MockSeason[] }
const ME = 'me';
const MOCK_KEY = 'geospeed_mock_conquest_db';
const BOTS = ['Paola', 'Gerónimo', 'Valentina', 'Mateo', 'Camila', 'Santiago', 'Lucía', 'Tomás'];
const BOT_AVATARS = ['🦊', null, '🐼', '🦁', null, '🐙'];
const mockDb = (): Record<string, MockGroup> => { try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '{}'); } catch { return {}; } };
const mockSave = (db: Record<string, MockGroup>) => localStorage.setItem(MOCK_KEY, JSON.stringify(db));
const wait = () => new Promise((r) => setTimeout(r, 120));
const newCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
const lobbyOf = (g: MockGroup) => [...g.seasons].reverse().find((s) => s.status === 'lobby') ?? null;
const activeOf = (g: MockGroup) => g.seasons.find((s) => s.status === 'active') ?? null;

function mockView(g: MockGroup): ConqGroup {
  const now = Date.now();
  // Una temporada simulada vencida se cierra sola y abre la sala de la siguiente
  const act = activeOf(g);
  if (act && act.ends_at && now >= act.ends_at) {
    act.status = 'closed';
    g.seasons.push({ id: crypto.randomUUID(), number: act.number + 1, status: 'lobby', confirms: [g.admin], started_at: null, ends_at: null });
  }
  const season = activeOf(g) ?? lobbyOf(g);
  const last = [...g.seasons].reverse().find((s) => s.status === 'closed') ?? null;
  return {
    id: g.id, name: g.name, status: g.status, is_admin: g.admin === ME, invite_code: g.admin === ME ? g.code : null, max_players: CONQ_MAX_PLAYERS,
    server_now: new Date(now).toISOString(), muted: g.members.find((m) => m.user_id === ME)?.muted ?? null,
    members: g.members.map((m) => ({ user_id: m.user_id, name: m.name, avatar: m.avatar, role: m.role, me: m.user_id === ME, confirmed: !!season && season.confirms.includes(m.user_id) })),
    season: season ? { id: season.id, number: season.number, status: season.status, started_at: season.started_at ? new Date(season.started_at).toISOString() : null, ends_at: season.ends_at ? new Date(season.ends_at).toISOString() : null, rules: CONQ_RULES_V1, in_roster: season.confirms.includes(ME) } : null,
    last_closed: last ? { id: last.id, number: last.number, closed_at: new Date(last.ends_at ?? now).toISOString(), champions: [g.members[0]?.name ?? null] } : null,
  };
}
const mockGet = (id: string) => {
  const db = mockDb();
  const g = db[id];
  if (!g || !g.members.some((m) => m.user_id === ME)) throw new ConqError('not_member');
  return { db, g };
};
const myActive = (db: Record<string, MockGroup>) => Object.values(db).filter((g) => g.status === 'active' && g.members.some((m) => m.user_id === ME)).length;

const mock = {
  async create(name: string): Promise<ConqGroup> {
    await wait();
    const n = name.trim();
    if (n.length < CONQ_NAME_MIN || n.length > CONQ_NAME_MAX) throw new ConqError('name_invalid');
    const db = mockDb();
    if (myActive(db) >= 3) throw new ConqError('group_limit');
    const g: MockGroup = { id: crypto.randomUUID(), name: n, status: 'active', admin: ME, code: newCode(),
      members: [{ user_id: ME, name: 'Yo', avatar: null, role: 'admin', joined_at: Date.now(), muted: false }],
      seasons: [{ id: crypto.randomUUID(), number: 1, status: 'lobby', confirms: [ME], started_at: null, ends_at: null }] };
    db[g.id] = g; mockSave(db);
    return mockView(g);
  },
  async preview(code: string): Promise<ConqPreview> {
    await wait();
    const g = Object.values(mockDb()).find((x) => x.code === code && x.status === 'active');
    if (!g) throw new ConqError('invite_invalid');
    const member = g.members.some((m) => m.user_id === ME);
    return { group_id: member ? g.id : null, name: g.name, admin_name: g.members.find((m) => m.user_id === g.admin)?.name ?? null, members_count: g.members.length,
      max_players: CONQ_MAX_PLAYERS, already_member: member, state: member ? 'member' : activeOf(g) ? 'season_active' : g.members.length >= CONQ_MAX_PLAYERS ? 'full' : 'open' };
  },
  async accept(code: string): Promise<ConqGroup> {
    await wait();
    const db = mockDb();
    const g = Object.values(db).find((x) => x.code === code && x.status === 'active');
    if (!g) throw new ConqError('invite_invalid');
    if (g.members.some((m) => m.user_id === ME)) return mockView(g);
    if (activeOf(g)) throw new ConqError('season_active');
    if (g.members.length >= CONQ_MAX_PLAYERS) throw new ConqError('group_full');
    if (myActive(db) >= 3) throw new ConqError('group_limit');
    g.members.push({ user_id: ME, name: 'Yo', avatar: null, role: 'member', joined_at: Date.now(), muted: false });
    lobbyOf(g)?.confirms.push(ME);
    mockSave(db);
    return mockView(g);
  },
  async state(id: string): Promise<ConqGroup> { await wait(); const { db, g } = mockGet(id); const v = mockView(g); mockSave(db); return v; },
  async mine(): Promise<ConqGroupSummary[]> {
    await wait();
    const db = mockDb();
    return Object.values(db).filter((g) => g.status === 'active' && g.members.some((m) => m.user_id === ME)).map((g) => {
      const v = mockView(g);
      return { id: g.id, name: g.name, members_count: g.members.length,
        season: v.season ? { id: v.season.id, number: v.season.number, status: v.season.status, ends_at: v.season.ends_at, in_roster: v.season.in_roster } : null,
        me: v.season?.status === 'active' ? { territories: 0, defense_sum: 0, rank: 1 } : null, unread: 0 };
    });
  },
  async regenerate(id: string): Promise<ConqGroup> { await wait(); const { db, g } = mockGet(id); if (g.admin !== ME) throw new ConqError('not_admin'); g.code = newCode(); mockSave(db); return mockView(g); },
  async remove(id: string, userId: string): Promise<ConqGroup> {
    await wait(); const { db, g } = mockGet(id);
    if (g.admin !== ME) throw new ConqError('not_admin');
    if (activeOf(g)) throw new ConqError('season_active');
    g.members = g.members.filter((m) => m.user_id !== userId);
    for (const s of g.seasons) s.confirms = s.confirms.filter((u) => u !== userId);
    mockSave(db); return mockView(g);
  },
  async leave(id: string): Promise<void> {
    await wait(); const { db, g } = mockGet(id);
    if (activeOf(g)) throw new ConqError('season_active');
    g.members = g.members.filter((m) => m.user_id !== ME);
    if (g.admin === ME) {
      const next = g.members[0];
      if (next) { next.role = 'admin'; g.admin = next.user_id; } else g.status = 'archived';
    }
    mockSave(db);
  },
  async cancel(id: string): Promise<void> { await wait(); const { db, g } = mockGet(id); if (g.admin !== ME) throw new ConqError('not_admin'); g.status = 'archived'; mockSave(db); },
  async confirm(id: string, on: boolean): Promise<ConqGroup> {
    await wait(); const { db, g } = mockGet(id); const s = lobbyOf(g);
    if (!s) throw new ConqError('season_active');
    s.confirms = s.confirms.filter((u) => u !== ME); if (on) s.confirms.push(ME);
    mockSave(db); return mockView(g);
  },
  async mute(id: string, on: boolean): Promise<ConqGroup> { await wait(); const { db, g } = mockGet(id); const me = g.members.find((m) => m.user_id === ME)!; me.muted = on; mockSave(db); return mockView(g); },
  async start(id: string): Promise<ConqGroup> {
    await wait(); const { db, g } = mockGet(id);
    if (g.admin !== ME) throw new ConqError('not_admin');
    if (activeOf(g)) throw new ConqError('season_active');
    const s = lobbyOf(g);
    if (!s) throw new ConqError('season_active');
    const confirmed = g.members.filter((m) => s.confirms.includes(m.user_id));
    if (confirmed.length < CONQ_MIN_PLAYERS) throw new ConqError('not_enough_players');
    s.status = 'active'; s.started_at = Date.now(); s.ends_at = Date.now() + 7 * 86_400_000;
    s.roster = confirmed.map((m, i) => ({ user_id: m.user_id, name: m.name, avatar: m.avatar, slot: i }));
    mockSave(db); return mockView(g);
  },
  async map(seasonId: string): Promise<ConqMap> {
    await wait();
    const { db, g, s } = mockSeason(seasonId);
    mockView(g); mockSave(db);
    const now = Date.now();
    const terr = mockTerr(s);
    const territories: ConqTerritory[] = MOCK_CATALOG.map((iso) => ({ iso, owner_id: terr[iso].owner, retired: terr[iso].retired, defense: terr[iso].defense,
      version: terr[iso].version, captured_at: terr[iso].captured_at ? new Date(terr[iso].captured_at!).toISOString() : null,
      reserved_until: terr[iso].reserved_until && terr[iso].reserved_until! > now ? new Date(terr[iso].reserved_until!).toISOString() : null }));
    return {
      season: { id: s.id, group_id: g.id, number: s.number, status: s.status, started_at: s.started_at ? new Date(s.started_at).toISOString() : null,
        ends_at: s.ends_at ? new Date(s.ends_at).toISOString() : null, rules: CONQ_RULES_V1, catalog: MOCK_CATALOG },
      server_now: new Date(now).toISOString(), data_version: territories.reduce((a, x) => a + x.version, 0),
      players: mockRoster(g, s), territories, standings: mockStandings(g, s), final: s.status === 'closed', me: mockMe(s), unread: 0, my_id: ME,
    };
  },
  async territory(seasonId: string, iso: string): Promise<ConqTerritoryDetail> {
    await wait();
    const { g, s } = mockSeason(seasonId);
    const now = Date.now();
    const t = mockTerr(s)[iso.toUpperCase()];
    if (!t) throw new ConqError('country_invalid');
    const me = mockMe(s);
    const day = s.started_at ? Math.floor((now - s.started_at) / 86_400_000) : 0;
    const mine = (s.used ?? []).filter((u) => s.started_at && Math.floor((u.at - s.started_at) / 86_400_000) === day);
    const here = mine.filter((u) => u.iso === iso).length;
    const last = Math.max(0, ...(s.used ?? []).filter((u) => u.iso === iso).map((u) => u.at));
    const coolUntil = last ? last + CONQ_RULES_V1.cooldown_s * 1000 : 0;
    const inRoster = mockRoster(g, s).some((p) => p.user_id === ME);
    const reason: ConqBlock | null = s.status !== 'active' ? 'season_closed'
      : !inRoster ? 'not_in_roster'
      : s.ends_at && now >= s.ends_at - CONQ_RULES_V1.last_minutes_s * 1000 ? 'season_ending'
      : t.owner === ME ? 'own_territory'
      : t.reserved_until && t.reserved_until > now ? 'reserved'
      : (s.attempts ?? []).some((a) => a.status === 'active') ? 'attempt_active'
      : mine.length >= CONQ_RULES_V1.daily_missions ? 'daily_limit'
      : here >= CONQ_RULES_V1.per_country_daily ? 'country_limit'
      : coolUntil > now ? 'cooldown' : null;
    return { iso: iso.toUpperCase(), owner_id: t.owner, retired: t.retired, defense: t.defense, version: t.version,
      reserved_until: t.reserved_until && t.reserved_until > now ? new Date(t.reserved_until).toISOString() : null,
      kind: !t.owner && !t.retired ? 'capture' : 'attack', threshold: CONQ_RULES_V1.threshold, rounds: 5, seconds: 15,
      can_start: !reason, reason, cooldown_until: coolUntil > now ? new Date(coolUntil).toISOString() : null,
      my_country_today: here, per_country_daily: CONQ_RULES_V1.per_country_daily, me, server_now: new Date(now).toISOString() };
  },
  async attemptStart(seasonId: string, iso: string, requestId: string): Promise<ConqAttempt> {
    await wait();
    const { db, s } = mockSeason(seasonId);
    const prev = (s.attempts ?? []).find((a) => a.request_id === requestId);
    if (prev) { mockTouchAttempt(s, prev); mockSave(db); return mockAttemptJson(s, prev); }
    for (const a of s.attempts ?? []) mockTouchAttempt(s, a);
    mockSave(db);
    const terr = await mock.territory(seasonId, iso);
    if (terr.reason) throw new ConqError(terr.reason);
    const db2 = mockDb();
    const { s: s2 } = (() => { for (const g of Object.values(db2)) { const x = g.seasons.find((y) => y.id === seasonId); if (x) return { s: x }; } throw new ConqError('not_member'); })();
    const t = mockTerr(s2)[iso.toUpperCase()];
    const now = Date.now();
    const ids = CONQUEST_COUNTRIES.find((c) => c.iso === iso.toUpperCase())?.cityIds.slice(0, 5) ?? [];
    const a: MockAttempt = {
      id: crypto.randomUUID(), iso: iso.toUpperCase(), kind: terr.kind, status: 'active', outcome: null, started_at: now,
      first_open_deadline: now + 30_000, expires_at: Math.min(now + CONQ_RULES_V1.reservation_s * 1000, s2.ends_at ?? Infinity), finished_at: null, total: 0,
      owner_at_start: t.owner, defense_at_start: t.defense, version_at_start: t.version, request_id: requestId,
      rounds: ids.map((id, i) => ({ idx: i + 1, place_id: id, opened_at: null, deadline_at: null, closed: false, lat: null, lon: null, time_s: null, km: null, points: 0 })),
    };
    (s2.attempts ??= []).push(a);
    (s2.used ??= []).push({ iso: a.iso, at: now, attempt: a.id });
    Object.assign(t, { reserved_by: a.id, reserved_until: a.expires_at });
    mockSave(db2);
    return mockAttemptJson(s2, a);
  },
  async roundOpen(attemptId: string, idx: number): Promise<ConqAttempt> {
    await wait();
    const { db, s, a } = mockAttempt(attemptId);
    mockTouchAttempt(s, a);
    const r = a.rounds.find((x) => x.idx === idx);
    if (!r) throw new ConqError('round_invalid');
    if (a.status === 'active' && !r.opened_at) {
      if (a.rounds.some((x) => x.idx < idx && !x.closed)) throw new ConqError('round_invalid');
      r.opened_at = Date.now();
      r.deadline_at = Math.min(r.opened_at + 15_000, a.expires_at);
    }
    mockSave(db);
    return mockAttemptJson(s, a);
  },
  async roundAnswer(attemptId: string, idx: number, lat: number, lon: number): Promise<ConqAttempt> {
    await wait();
    const { db, s, a } = mockAttempt(attemptId);
    const r = a.rounds.find((x) => x.idx === idx);
    if (!r) throw new ConqError('round_invalid');
    if (r.closed || a.status !== 'active') return mockAttemptJson(s, a);
    if (!r.opened_at) throw new ConqError('round_invalid');
    const now = Date.now();
    if (now >= a.expires_at) { mockTouchAttempt(s, a); mockSave(db); return mockAttemptJson(s, a); }
    const c = cityById(r.place_id);
    const km = c ? haversine(lat, lon, c.lat, c.lon) : 0;
    const t = Math.round((now - r.opened_at) / 10) / 100;
    Object.assign(r, { lat, lon, time_s: t, km: Math.round(km * 10) / 10, points: now >= (r.deadline_at ?? 0) ? 0 : conqPoints(km, t), closed: true });
    if (a.rounds.every((x) => x.closed)) mockFinalize(s, a, now);
    mockSave(db);
    return mockAttemptJson(s, a);
  },
  async attemptAbandon(attemptId: string): Promise<ConqAttempt> {
    await wait();
    const { db, s, a } = mockAttempt(attemptId);
    if (a.status === 'active') {
      Object.assign(a, { status: 'abandoned', outcome: 'abandoned', finished_at: Date.now(), total: a.rounds.reduce((x, r) => x + r.points, 0) });
      mockRelease(s, a);
    }
    mockSave(db);
    return mockAttemptJson(s, a);
  },
  async attemptState(attemptId: string): Promise<ConqAttempt> {
    await wait();
    const { db, s, a } = mockAttempt(attemptId);
    mockTouchAttempt(s, a);
    mockSave(db);
    return mockAttemptJson(s, a);
  },
  async practice(seasonId: string, iso: string): Promise<ConqPracticeCity[]> {
    await wait();
    mockSeason(seasonId);
    const ids = CONQUEST_COUNTRIES.find((c) => c.iso === iso.toUpperCase())?.cityIds ?? [];
    // El "paquete oficial" simulado son las 5 primeras; la práctica sale de las otras 7
    return ids.slice(5).sort(() => Math.random() - 0.5).slice(0, 5)
      .map((id) => cityById(id)).filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ id: c.id ?? '', name: c.name, lat: c.lat, lon: c.lon }));
  },
};

const MOCK_CATALOG = ['CO', 'PE', 'EC', 'CL', 'AR', 'BR', 'MX', 'ES', 'FR', 'IT'];
function mockSeason(seasonId: string) {
  const db = mockDb();
  for (const g of Object.values(db)) {
    const s = g.seasons.find((x) => x.id === seasonId);
    if (s) {
      if (!g.members.some((m) => m.user_id === ME)) throw new ConqError('not_member');
      return { db, g, s };
    }
  }
  throw new ConqError('not_member');
}
function mockTerr(s: MockSeason): Record<string, MockTerr> {
  s.terr ??= {};
  for (const iso of MOCK_CATALOG) s.terr[iso] ??= { owner: null, retired: false, defense: 0, version: 0, reserved_until: null, captured_at: null };
  return s.terr;
}
/** Plantilla congelada (las temporadas simuladas viejas no la tenían: los confirmados) */
function mockRoster(g: MockGroup, s: MockSeason): ConqPlayer[] {
  return s.roster ?? g.members.filter((m) => s.confirms.includes(m.user_id)).map((m, i) => ({ user_id: m.user_id, name: m.name, avatar: m.avatar, slot: i }));
}
function mockStandings(g: MockGroup, s: MockSeason): ConqStanding[] {
  const terr = mockTerr(s);
  const rows = mockRoster(g, s).map((p) => {
    const mine = Object.values(terr).filter((t) => t.owner === p.user_id);
    return { ...p, territories: mine.length, defense_sum: mine.reduce((a, t) => a + t.defense, 0), rank: 1 };
  });
  for (const r of rows) r.rank = 1 + rows.filter((o) => o.territories > r.territories || (o.territories === r.territories && o.defense_sum > r.defense_sum)).length;
  return rows.sort((a, b) => a.rank - b.rank || (a.name ?? '').localeCompare(b.name ?? ''));
}
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
};
function mockAttempt(attemptId: string) {
  const db = mockDb();
  for (const g of Object.values(db)) for (const s of g.seasons) {
    const a = (s.attempts ?? []).find((x) => x.id === attemptId);
    if (a) return { db, s, a };
  }
  throw new ConqError('attempt_unavailable');
}
function mockRelease(s: MockSeason, a: MockAttempt) {
  const t = mockTerr(s)[a.iso];
  if (t.reserved_by === a.id) Object.assign(t, { reserved_by: null, reserved_until: null });
}
/** Como _conq_finalize: solo cambia el mapa si terminó dentro de la reserva y nadie tocó el país entretanto */
function mockFinalize(s: MockSeason, a: MockAttempt, doneAt: number) {
  const t = mockTerr(s)[a.iso];
  const total = a.rounds.reduce((x, r) => x + r.points, 0);
  if (doneAt > a.expires_at || t.reserved_by !== a.id || t.version !== a.version_at_start) {
    Object.assign(a, { status: 'expired', outcome: 'expired', total, finished_at: Math.min(doneAt, a.expires_at) });
    mockRelease(s, a);
    return;
  }
  const outcome: ConqOutcome = !t.owner && !t.retired ? (total >= CONQ_RULES_V1.threshold ? 'captured' : 'failed')
    : total > t.defense ? 'conquered' : total === t.defense ? 'tie' : 'defended';
  if (outcome === 'captured' || outcome === 'conquered') Object.assign(t, { owner: ME, retired: false, defense: total, captured_at: doneAt });
  Object.assign(t, { version: t.version + 1, reserved_by: null, reserved_until: null });
  Object.assign(a, { status: 'completed', outcome, total, finished_at: doneAt });
}
function mockTouchAttempt(s: MockSeason, a: MockAttempt) {
  if (a.status !== 'active') return;
  const now = Date.now();
  for (const r of a.rounds) if (r.opened_at && !r.closed && (r.deadline_at ?? 0) <= now) Object.assign(r, { closed: true, points: 0 });
  if (a.rounds.every((r) => r.closed)) {
    // Cuándo se cerró la última: la respuesta recibida o el vencimiento
    mockFinalize(s, a, Math.max(...a.rounds.map((r) => (r.opened_at && r.time_s != null ? r.opened_at + r.time_s * 1000 : r.deadline_at ?? now))));
    return;
  }
  if (!a.rounds.some((r) => r.opened_at) && now >= a.first_open_deadline) {
    Object.assign(a, { status: 'void', outcome: 'void', finished_at: now });
    s.used = (s.used ?? []).filter((u) => u.attempt !== a.id);
    mockRelease(s, a);
    return;
  }
  if (now >= a.expires_at) {
    Object.assign(a, { status: 'expired', outcome: 'expired', total: a.rounds.reduce((x, r) => x + r.points, 0), finished_at: a.expires_at });
    mockRelease(s, a);
  }
}
function mockAttemptJson(s: MockSeason, a: MockAttempt): ConqAttempt {
  const t = mockTerr(s)[a.iso];
  const iso = (n: number | null) => (n == null ? null : new Date(n).toISOString());
  return {
    id: a.id, season_id: s.id, country: a.iso, kind: a.kind, status: a.status, outcome: a.outcome, started_at: iso(a.started_at)!,
    first_open_deadline: iso(a.first_open_deadline)!, expires_at: iso(a.expires_at)!, finished_at: iso(a.finished_at),
    total: a.status === 'active' ? a.rounds.reduce((x, r) => x + r.points, 0) : a.total, owner_at_start: a.owner_at_start,
    defense_at_start: a.defense_at_start, threshold: CONQ_RULES_V1.threshold, seconds: 15, server_now: new Date().toISOString(),
    territory: { owner_id: t.owner, retired: t.retired, defense: t.defense, version: t.version },
    rounds: a.rounds.map((r) => {
      const c = cityById(r.place_id);
      return { idx: r.idx, place_id: r.opened_at ? r.place_id : null, name: r.opened_at ? c?.name ?? r.place_id : null,
        opened_at: iso(r.opened_at), deadline_at: iso(r.deadline_at), closed: r.closed,
        answer: r.closed ? { lat: r.lat, lon: r.lon, time_s: r.time_s, distance_km: r.km, points: r.points } : null,
        correct: r.closed && c ? { lat: c.lat, lon: c.lon } : null };
    }),
  };
}
function mockMe(s: MockSeason): ConqMe | null {
  if (s.status !== 'active' || !s.started_at) return null;
  const now = Date.now();
  const day = Math.floor((now - s.started_at) / 86_400_000);
  const used = (s.used ?? []).filter((u) => Math.floor((u.at - s.started_at!) / 86_400_000) === day).length;
  return { missions_left: Math.max(0, CONQ_RULES_V1.daily_missions - used), missions_per_day: CONQ_RULES_V1.daily_missions,
    next_reset_at: new Date(s.started_at + (day + 1) * 86_400_000).toISOString(),
    active_attempt: (s.attempts ?? []).find((a) => { mockTouchAttempt(s, a); return a.status === 'active'; })?.id ?? null,
    in_roster: (s.roster ?? []).some((p) => p.user_id === ME) || s.confirms.includes(ME) };
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  w.__mockConqJoin = (n = 1) => {
    const db = mockDb();
    const g = Object.values(db).filter((x) => x.status === 'active' && x.members.some((m) => m.user_id === ME)).sort((a, b) => b.members[0].joined_at - a.members[0].joined_at)[0];
    if (!g) return 'sin grupo';
    for (let i = 0; i < n && g.members.length < CONQ_MAX_PLAYERS; i++) {
      const k = g.members.length;
      const uid = `bot-${crypto.randomUUID().slice(0, 6)}`;
      g.members.push({ user_id: uid, name: BOTS[k % BOTS.length], avatar: BOT_AVATARS[k % BOT_AVATARS.length], role: 'member', joined_at: Date.now() + k, muted: false });
      lobbyOf(g)?.confirms.push(uid);
    }
    mockSave(db);
    return g.members.length;
  };
  w.__mockConqGroup = (n = 2) => {
    const db = mockDb();
    const admin = `bot-${crypto.randomUUID().slice(0, 6)}`;
    const members: MockMember[] = Array.from({ length: Math.min(n, CONQ_MAX_PLAYERS) }, (_, k) => ({
      user_id: k === 0 ? admin : `bot-${crypto.randomUUID().slice(0, 6)}`, name: BOTS[k % BOTS.length], avatar: BOT_AVATARS[k % BOT_AVATARS.length],
      role: k === 0 ? 'admin' : 'member', joined_at: Date.now() + k, muted: false,
    }));
    const g: MockGroup = { id: crypto.randomUUID(), name: 'Los Exploradores', status: 'active', admin, code: newCode(), members,
      seasons: [{ id: crypto.randomUUID(), number: 1, status: 'lobby', confirms: members.map((m) => m.user_id), started_at: null, ends_at: null }] };
    db[g.id] = g; mockSave(db);
    return g.code;
  };
  w.__mockConqConfirm = () => {
    const db = mockDb();
    for (const g of Object.values(db)) { const s = lobbyOf(g); if (s) s.confirms = g.members.map((m) => m.user_id); }
    mockSave(db);
    return 'ok';
  };
  /** Temporada en curso más reciente de mis grupos */
  const activeMock = () => {
    const db = mockDb();
    const g = Object.values(db).filter((x) => x.members.some((m) => m.user_id === ME) && activeOf(x)).sort((a, b) => (activeOf(b)!.started_at ?? 0) - (activeOf(a)!.started_at ?? 0))[0];
    return g ? { db, g, s: activeOf(g)! } : null;
  };
  w.__mockConqOwn = (iso: string, who: string | number = 'bot', defense = 2400) => {
    const a = activeMock();
    if (!a) return 'sin temporada en curso';
    const t = mockTerr(a.s)[iso.toUpperCase()];
    if (!t) return 'país fuera del catálogo';
    const roster = mockRoster(a.g, a.s);
    const owner = who === 'me' ? ME : who === 'free' || who === 'retired' ? null : typeof who === 'number' ? roster[who]?.user_id ?? null : roster.find((p) => p.user_id !== ME)?.user_id ?? null;
    Object.assign(t, { owner, retired: who === 'retired', defense: who === 'free' ? 0 : defense, version: t.version + 1, captured_at: Date.now() });
    mockSave(a.db);
    return 'ok';
  };
  w.__mockConqReserve = (iso: string, minutes = 3) => {
    const a = activeMock();
    if (!a) return 'sin temporada en curso';
    mockTerr(a.s)[iso.toUpperCase()].reserved_until = Date.now() + minutes * 60_000;
    mockSave(a.db);
    return 'ok';
  };
  w.__mockConqUse = (iso: string) => {
    const a = activeMock();
    if (!a) return 'sin temporada en curso';
    (a.s.used ??= []).push({ iso: iso.toUpperCase(), at: Date.now() });
    mockSave(a.db);
    return 'ok';
  };
}
