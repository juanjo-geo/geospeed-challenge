/**
 * Conquista el mapa (docs/GeoSpeed_Conquista_Plan.md): cliente de las funciones del servidor
 * (supabase/migrations/20261108120000_conquest.sql). Fase C3: grupos, invitaciones y sala de espera. El tablero, las
 * misiones y el cierre llegan en C4–C6.
 *
 * Solo con cuenta registrada (decisión CQ-D1): sin sesión, o con una de invitado, las llamadas responden
 * `account_required` sin tocar el servidor (la vista previa de una invitación sí funciona sin sesión).
 *
 * Simulador de desarrollo (sin cuenta ni servidor): `localStorage.geospeed_mock_conquest = '1'` (solo DEV).
 *  · `__mockConqJoin(n)` suma n personas falsas a mi grupo más reciente.
 *  · `__mockConqGroup(n)` crea un grupo de otra persona con n integrantes y devuelve su código (para probar unirse).
 *  · `__mockConqConfirm()` hace que todos confirmen la próxima temporada.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { conquestBetaOn } from '@/lib/conquestBeta';

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
interface MockSeason { id: string; number: number; status: ConqSeasonStatus; confirms: string[]; started_at: number | null; ends_at: number | null }
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
    mockSave(db); return mockView(g);
  },
};

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
}
