/**
 * Recordatorio de la racha (Fase 2): a las 7 p. m. (hora local) si ese día no se jugó el diario —
 * "🔥 Tu racha de 12 días termina hoy". Se puede apagar en Ajustes.
 *
 * - App instalada (Capacitor): notificación local del sistema (@capacitor/local-notifications), que sale
 *   aunque la app esté cerrada. Al terminar el diario se reprograma para el día siguiente.
 * - Web: el aviso local de notifications.ts (solo sale con la página abierta en segundo plano).
 */
import { Capacitor } from '@capacitor/core';
import { getPrefs } from './prefs';
import { getCachedDailyStatus, playedToday } from './dailyChallenge';
import { scheduleStreakWarning, cancelStreakWarning } from './notifications';
import { getTranslations, detectLocale, translate } from '@/i18n';

const NATIVE_ID = 1901;
const REMINDER_HOUR = 19;
const ASKED_KEY = 'geospeed_native_notif_asked';

/** Próximas 7 p. m. locales: hoy si aún no se jugó el diario y no han pasado; si no, mañana */
export function nextReminderAt(now: Date = new Date(), doneToday = playedToday()): Date {
  const at = new Date(now);
  at.setHours(REMINDER_HOUR, 0, 0, 0);
  if (doneToday || at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
  return at;
}

const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

function reminderTexts(streak: number) {
  const dict = getTranslations(detectLocale());
  return {
    title: streak === 1 ? translate(dict, 'notif_streakTitleOne') : translate(dict, 'notif_streakTitle', { n: streak }),
    body: translate(dict, 'notif_streakBody'),
  };
}

/** Programa (o quita) el recordatorio según la racha en caché, el ajuste y si ya se jugó hoy */
export async function syncStreakReminder(): Promise<void> {
  const streak = getCachedDailyStatus()?.current_streak ?? 0;
  const enabled = getPrefs().streakReminder && streak >= 1;
  const at = nextReminderAt();
  if (!isNative()) {
    if (enabled) scheduleStreakWarning(streak, at); else cancelStreakWarning();
    return;
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: NATIVE_ID }] });
    if (!enabled) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    const { title, body } = reminderTexts(streak);
    await LocalNotifications.schedule({
      notifications: [{ id: NATIVE_ID, title, body, schedule: { at, allowWhileIdle: true } }],
    });
  } catch { /* sin complemento (web) o sin permiso */ }
}

/** App instalada: pide el permiso de notificaciones una sola vez (tras el primer diario con racha) */
export async function askNativeReminderPermissionOnce(): Promise<void> {
  if (!isNative() || !getPrefs().streakReminder) return;
  try {
    if (localStorage.getItem(ASKED_KEY)) return;
    localStorage.setItem(ASKED_KEY, '1');
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') await LocalNotifications.requestPermissions();
    await syncStreakReminder();
  } catch { /* sin complemento */ }
}
