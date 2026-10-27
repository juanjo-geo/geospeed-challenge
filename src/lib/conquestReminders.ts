/**
 * Conquista (C6, decisión CQ-D3: sin push en la v1): recordatorios locales 24 h y 1 h antes del cierre de cada temporada
 * en la que juego.
 * - App instalada (Capacitor): notificación del sistema (@capacitor/local-notifications), que sale aunque la app esté
 *   cerrada. El permiso se pide una sola vez, al abrir el tablero de una temporada en la que participo.
 * - Web: el aviso local de notifications.ts (solo sale con la página abierta en segundo plano y con permiso).
 * Silenciar el grupo los quita. Se vuelven a sincronizar al ver mis grupos, la sala y el tablero.
 * En una temporada acelerada de QA (`time_scale`) los plazos se aceleran igual: con 144, "24 h antes" = 10 min antes.
 */
import { Capacitor } from '@capacitor/core';
import { cancelConquestReminders, scheduleConquestReminder } from './notifications';
import { detectLocale, getTranslations, translate } from '@/i18n';

export interface ReminderSeason {
  seasonId: string;
  groupId: string;
  endsAt: string | null;
  active: boolean;
  inRoster: boolean;
  /** Si no se sabe aquí (lista de grupos, tablero), se usa lo último que dijo la sala */
  muted?: boolean | null;
  /** Factor de QA de la temporada; la lista de grupos no lo trae y usa lo último que dijeron la sala o el tablero */
  timeScale?: number | null;
}

export const REMINDER_HOURS = [24, 1] as const;
const MUTED_KEY = 'geospeed_conq_muted';
const ASKED_KEY = 'geospeed_conq_notif_asked';
const SCALE_KEY = 'geospeed_conq_scale';

/** Avisos que todavía no pasaron para un cierre dado */
export function reminderTimes(endsAt: number, now = Date.now(), timeScale = 1): { h: number; at: number }[] {
  const k = Math.max(1, timeScale || 1);
  return REMINDER_HOURS.map((h) => ({ h, at: endsAt - (h * 3_600_000) / k })).filter((x) => x.at > now);
}

function scaleMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(SCALE_KEY) || '{}'); } catch { return {}; }
}
/** Guarda el factor de las temporadas aceleradas (solo las de QA; las normales no ocupan espacio) */
function rememberScale(seasonId: string, scale: number): void {
  try {
    const m = scaleMap();
    if (scale > 1) m[seasonId] = scale; else if (m[seasonId]) delete m[seasonId]; else return;
    localStorage.setItem(SCALE_KEY, JSON.stringify(m));
  } catch { /* sin almacenamiento */ }
}

/** Id numérico estable por temporada y plazo (las notificaciones nativas piden enteros) */
export function nativeReminderId(seasonId: string, h: number): number {
  let x = 0;
  for (const c of seasonId) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return 3000 + (x % 2000) * 2 + (h === 1 ? 1 : 0);
}

function mutedMap(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(MUTED_KEY) || '{}'); } catch { return {}; }
}
/** La sala guarda si el grupo está silenciado (la lista de grupos y el tablero no lo traen) */
export function rememberMuted(groupId: string, muted: boolean): void {
  try { const m = mutedMap(); if (muted) m[groupId] = true; else delete m[groupId]; localStorage.setItem(MUTED_KEY, JSON.stringify(m)); } catch { /* sin almacenamiento */ }
}

const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

function texts(h: number) {
  const dict = getTranslations(detectLocale());
  return { title: translate(dict, h === 1 ? 'notif_conqTitle1' : 'notif_conqTitle24'), body: translate(dict, 'notif_conqBody') };
}

/** Programa o quita los avisos de cada temporada según si sigue en curso, si juego en ella y si silencié el grupo */
export async function syncConquestReminders(list: ReminderSeason[]): Promise<void> {
  const muted = mutedMap();
  const scales = scaleMap();
  const now = Date.now();
  const plan = list.map((s) => {
    if (s.timeScale != null) rememberScale(s.seasonId, s.timeScale);
    const off = !s.active || !s.inRoster || (s.muted ?? muted[s.groupId] ?? false) || !s.endsAt;
    return { s, times: off ? [] : reminderTimes(Date.parse(s.endsAt!), now, s.timeScale ?? scales[s.seasonId] ?? 1) };
  });
  if (!isNative()) {
    for (const { s, times } of plan) {
      cancelConquestReminders((id) => id.startsWith(`conq-${s.seasonId}-`));
      for (const x of times) scheduleConquestReminder(`conq-${s.seasonId}-${x.h}`, new Date(x.at), { h: x.h });
    }
    return;
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: plan.flatMap(({ s }) => REMINDER_HOURS.map((h) => ({ id: nativeReminderId(s.seasonId, h) }))) });
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    const notifications = plan.flatMap(({ s, times }) => times.map((x) => ({ id: nativeReminderId(s.seasonId, x.h), ...texts(x.h), schedule: { at: new Date(x.at), allowWhileIdle: true } })));
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch { /* sin complemento o sin permiso */ }
}

/** App instalada: pide el permiso una vez, la primera vez que abro el tablero de una temporada en la que juego */
export async function askConquestPermissionOnce(): Promise<void> {
  if (!isNative()) return;
  try {
    if (localStorage.getItem(ASKED_KEY)) return;
    localStorage.setItem(ASKED_KEY, '1');
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') await LocalNotifications.requestPermissions();
  } catch { /* sin complemento */ }
}
