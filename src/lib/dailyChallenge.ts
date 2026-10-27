/**
 * Desafío diario con racha (Fase 2, docs/GeoSpeed_Plan_Competencia.md §2).
 *
 * La racha vive en el servidor (daily_status / save_game_result con `daily_no`): suma 1 por cada día con el
 * diario terminado, se gastan protectores al faltar un día y los hitos dan insignias, marcos y títulos.
 * Aquí: lectura y caché del estado, catálogo de hitos/marcos/títulos y el texto para compartir.
 */
import { supabase } from '@/integrations/supabase/client';
import { gameDay, dailyNumber } from '@/lib/gameDay';
import { dailyLink, type DailyShareData } from '@/lib/dailyShare';
export { SHARE_ORIGIN, shareName, dailyLink, parseDailyInvite, type DailyShareData, type DailyInvite } from '@/lib/dailyShare';

export interface DailyBadge { id: string; earned_at: string; seen: boolean }
export interface DailyTodayResult { score: number; hits: number; total: number; time_ms: number; grid: string; daily_no: number }
export interface DailyStatus {
  today: string;
  daily_no: number;
  current_streak: number;
  best_streak: number;
  last_day: string | null;
  freezes: number;
  freeze_cap: number;
  freeze_refill_on: string | null;
  lost_streak: number;
  lost_on: string | null;
  today_result: DailyTodayResult | null;
  played: string[];
  frozen: string[];
  badges: DailyBadge[];
  active_title: string | null;
  active_frame: string | null;
}

const CACHE_KEY = 'geospeed_daily_status';
/** Se dispara al cambiar el estado (para el Inicio, el encabezado y el calendario) */
export const DAILY_STATUS_EVENT = 'geospeed:daily-status';

export function getCachedDailyStatus(): DailyStatus | null {
  try {
    const s = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as DailyStatus | null;
    // Del día anterior: la racha puede haber cambiado; sirve para pintar mientras llega la nueva
    return s;
  } catch { return null; }
}

/** Racha que mostrar ya (caché): si el último diario fue antes de ayer, en riesgo o perdida → se ve hasta refrescar */
export function cachedStreak(): number {
  const s = getCachedDailyStatus();
  return s ? s.current_streak : 0;
}

/** Lee el estado del servidor (necesita sesión; sin ella devuelve null) y lo guarda en caché */
export async function fetchDailyStatus(): Promise<DailyStatus | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase.rpc('daily_status');
    if (error || !data) return null;
    const st = data as unknown as DailyStatus;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(st)); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new CustomEvent(DAILY_STATUS_EVENT, { detail: st }));
    return st;
  } catch {
    return null;
  }
}

/** ¿Ya terminó el diario de hoy? (servidor o, sin sesión, el registro local) */
export function playedToday(st: DailyStatus | null = getCachedDailyStatus()): boolean {
  const today = gameDay();
  if (st && st.today === today && st.today_result) return true;
  try { return !!localStorage.getItem(`geospeed_daily_${today}`); } catch { return false; }
}

export async function markBadgesSeen(ids: string[]): Promise<void> {
  if (!ids.length) return;
  try { await supabase.rpc('mark_badges_seen', { p_ids: ids }); } catch { /* reintenta en la próxima lectura */ }
}

export async function setActiveCosmetics(title: string | null, frame: string | null): Promise<boolean> {
  const { error } = await supabase.rpc('set_active_cosmetics', { p_title: title, p_frame: frame });
  if (!error) await fetchDailyStatus();
  return !error;
}

// ── Hitos de la racha ───────────────────────────────────────────────────────
export interface StreakMilestone {
  days: number;
  badge: string;           // id en user_badges
  nameKey: string;         // insignia (lo ven otros)
  rewardKey: string;       // utilidad
  frame?: 'bronze' | 'silver' | 'gold';
  title?: 'viajero' | 'leyenda';
  emoji: string;
}
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, badge: 'streak_3', nameKey: 'streak_b3', rewardKey: 'streak_r3', emoji: '🔥' },
  { days: 7, badge: 'streak_7', nameKey: 'streak_b7', rewardKey: 'streak_r7', frame: 'bronze', emoji: '🥉' },
  { days: 30, badge: 'streak_30', nameKey: 'streak_b30', rewardKey: 'streak_r30', emoji: '🌋' },
  { days: 100, badge: 'streak_100', nameKey: 'streak_b100', rewardKey: 'streak_r100', frame: 'silver', title: 'viajero', emoji: '💯' },
  { days: 365, badge: 'streak_365', nameKey: 'streak_b365', rewardKey: 'streak_r365', frame: 'gold', title: 'leyenda', emoji: '🌍' },
];
export const milestoneOf = (badgeId: string) => STREAK_MILESTONES.find((m) => m.badge === badgeId);
export const FRAME_STYLE: Record<string, { ring: string; glow: string }> = {
  bronze: { ring: 'hsl(28 62% 52%)', glow: 'hsl(28 70% 50% / 0.55)' },
  silver: { ring: 'hsl(210 14% 78%)', glow: 'hsl(210 30% 85% / 0.55)' },
  gold: { ring: 'hsl(45 95% 58%)', glow: 'hsl(45 100% 55% / 0.7)' },
  // Fase 9: marcos de los logros (src/lib/progression.ts FRAMES)
  medal: { ring: 'hsl(174 72% 52%)', glow: 'hsl(174 80% 50% / 0.6)' },
  flame: { ring: 'hsl(18 95% 56%)', glow: 'hsl(22 100% 55% / 0.65)' },
  globe: { ring: 'hsl(199 89% 62%)', glow: 'hsl(199 95% 60% / 0.6)' },
  sniper: { ring: 'hsl(330 80% 64%)', glow: 'hsl(330 90% 62% / 0.6)' },
  sprint: { ring: 'hsl(265 80% 70%)', glow: 'hsl(265 90% 68% / 0.6)' },
};
/** Nombre de cada título (racha del diario y logros de la Fase 9): clave `title_<id>` */
const TITLE_IDS = ['viajero', 'leyenda', 'medallista', 'veterano', 'francotirador', 'rayo', 'retador', 'ojeador', 'cartografo', 'trotamundos', 'memoria', 'abanderado', 'elite', 'incansable', 'sabio', 'conquistador'];
export const TITLE_KEY: Record<string, string> = Object.fromEntries(TITLE_IDS.map((id) => [id, `title_${id}`]));

// ── Compartir (sin revelar las ciudades) ────────────────────────────────────
/** Cuadritos: 🟩 acierto rápido (< 3 s) · 🟨 acierto lento · 🟥 fallo · ⬛ sin jugar (se acabó el tiempo) */
export function gridEmojis(grid: string): string {
  return [...grid].map((c) => (c === 'G' ? '🟩' : c === 'Y' ? '🟨' : c === 'R' ? '🟥' : '⬛')).join('');
}

/** Cuadritos desde las rondas jugadas (para mostrar al instante, antes de la respuesta del servidor) */
export function gridFromRounds(rounds: { basePoints: number; timeExact?: number; timeUsed: number }[], total: number): string {
  const g = rounds.map((r) => (r.basePoints >= 400 ? ((r.timeExact ?? r.timeUsed) < 3 ? 'G' : 'Y') : 'R')).join('');
  return g.padEnd(total, 'X');
}


export function dailyShareText(d: DailyShareData, t: (k: string, v?: Record<string, string | number>) => string): string {
  const lines = [
    t('share_dailyTitle', { n: d.dailyNo }),
    `${d.hits}/${d.total} · ${Math.round(d.timeMs / 1000)} s`,
    gridEmojis(d.grid),
  ];
  if (d.streak >= 1) lines.push(d.streak === 1 ? t('share_dailyStreakOne') : t('share_dailyStreak', { n: d.streak }));
  lines.push(`${t('share_dailyChallenge')} ${dailyLink(d)}`);
  return lines.join('\n');
}


export const todayDailyNo = () => dailyNumber(gameDay());
