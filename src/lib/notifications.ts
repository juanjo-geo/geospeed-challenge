// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Notificaciones del navegador
// ═══════════════════════════════════════════════════════════════════════════
//
// Avisos con contexto (reglas acordadas con JuanJo el 2026-10-19):
//   • Desafío diario: mañana a las 9:00 (hora local).
//   • Racha en peligro: MAÑANA a las 20:00, y solo si ese día todavía no se abrió el juego
//     (antes se programaba para hoy justo después de jugar, así que siempre era falsa).
//   • Vidas completas: cuando se llenan, y solo si siguen llenas al momento de avisar.
// Son temporizadores de la página: solo pueden salir con la app abierta en segundo plano. Nunca se
// muestran con el juego en pantalla y las atrasadas (más de 2 h) se descartan en vez de salir al abrir.
// Textos en el idioma del juego; se arman al momento de mostrar.
//
// El permiso se pide desde la UI (Index), a partir de la 3.ª partida: "Ahora no" lo pospone 7 días y
// se pregunta como máximo 2 veces.

import { playedToday } from './dailyChallenge';
import { supabase } from '@/integrations/supabase/client';
import { detectLocale, getTranslations, translate } from '@/i18n';
import { getStreakState } from './dailyStreak';
import { getEnergy } from './energySystem';
import { localDate } from './interruptions';

const PERMISSION_KEY = 'geospeed_notif_asked';
const PROMPT_KEY = 'geospeed_notif_prompt';
const SCHEDULE_KEY = 'geospeed_notif_schedules';
const ICON = '/icon-192.png';
const MAX_ASKS = 2;
const SNOOZE_MS = 7 * 24 * 3600 * 1000;
const STALE_MS = 2 * 3600 * 1000;
/** Partidas terminadas antes de ofrecer los avisos */
export const NOTIF_MIN_GAMES = 3;

/** Check if browser supports notifications */
export function supportsNotifications(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/** Current permission state */
export function getPermission(): NotificationPermission {
  if (!supportsNotifications()) return 'denied';
  return Notification.permission;
}

/** Has the user already been asked by the browser? */
export function hasBeenAsked(): boolean {
  try {
    return localStorage.getItem(PERMISSION_KEY) === 'true';
  } catch {
    return false;
  }
}

interface PromptState { asks: number; snoozeUntil: number }

function getPromptState(): PromptState {
  try {
    const raw = JSON.parse(localStorage.getItem(PROMPT_KEY) || 'null');
    if (raw && typeof raw.asks === 'number') return { asks: raw.asks, snoozeUntil: Number(raw.snoozeUntil) || 0 };
  } catch { /* ignore */ }
  return { asks: 0, snoozeUntil: 0 };
}

function savePromptState(st: PromptState): void {
  try { localStorage.setItem(PROMPT_KEY, JSON.stringify(st)); } catch { /* ignore */ }
}

/**
 * ¿Se puede ofrecer el aviso de notificaciones? Solo si el navegador aún no decidió (ni aceptado ni
 * bloqueado), el jugador terminó al menos NOTIF_MIN_GAMES partidas, no lo pospuso hace menos de 7 días
 * y no se le ha preguntado ya MAX_ASKS veces.
 */
export function canOfferNotifications(gamesPlayed: number): boolean {
  if (!supportsNotifications() || getPermission() !== 'default' || hasBeenAsked()) return false;
  if (gamesPlayed < NOTIF_MIN_GAMES) return false;
  const st = getPromptState();
  return st.asks < MAX_ASKS && Date.now() >= st.snoozeUntil;
}

/** "Ahora no": se recuerda y no se vuelve a preguntar en 7 días. */
export function snoozeNotificationPrompt(): void {
  const st = getPromptState();
  savePromptState({ asks: st.asks + 1, snoozeUntil: Date.now() + SNOOZE_MS });
}

/** Request notification permission — call only from explicit UI action */
export async function requestPermission(): Promise<boolean> {
  if (!supportsNotifications()) return false;
  try {
    localStorage.setItem(PERMISSION_KEY, 'true');
  } catch {}
  const st = getPromptState();
  savePromptState({ asks: st.asks + 1, snoozeUntil: st.snoozeUntil });
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Show a notification immediately */
export function showNotification(
  title: string,
  body: string,
  options?: { icon?: string; tag?: string; data?: Record<string, unknown> },
): void {
  if (getPermission() !== 'granted') return;

  const opts: NotificationOptions = {
    body,
    icon: options?.icon || ICON,
    badge: ICON,
    tag: options?.tag || 'geospeed',
    data: options?.data,
    silent: false,
  };

  // Use service worker for persistent notifications when available
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, opts);
    });
  } else {
    new Notification(title, opts);
  }
}

// ── Avisos programados ──

type NotifKind = 'daily' | 'streak' | 'lives';

interface ScheduledNotif {
  id: string;
  kind: NotifKind;
  fireAt: number; // timestamp ms
  params?: Record<string, string | number>;
}

function getSchedules(): ScheduledNotif[] {
  try {
    const items = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]');
    // Los avisos de la versión anterior (texto fijo en español, sin `kind`) se descartan
    return Array.isArray(items) ? items.filter((n: ScheduledNotif) => n && typeof n.kind === 'string') : [];
  } catch {
    return [];
  }
}

function saveSchedules(items: ScheduledNotif[]): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
  } catch {}
}

function schedule(id: string, kind: NotifKind, fireAt: Date, params?: Record<string, string | number>): void {
  if (getPermission() !== 'granted') return;
  const items = getSchedules().filter(n => n.id !== id);
  items.push({ id, kind, fireAt: fireAt.getTime(), params });
  saveSchedules(items);
}

/** Título y texto en el idioma actual del juego */
function texts(n: ScheduledNotif): { title: string; body: string } {
  const dict = getTranslations(detectLocale());
  switch (n.kind) {
    case 'streak': return { title: Number(n.params?.n) === 1 ? translate(dict, 'notif_streakTitleOne') : translate(dict, 'notif_streakTitle', n.params), body: translate(dict, 'notif_streakBody') };
    case 'lives': return { title: translate(dict, 'notif_livesTitle'), body: translate(dict, 'notif_livesBody') };
    default: return { title: translate(dict, 'notif_dailyTitle'), body: translate(dict, 'notif_dailyBody') };
  }
}

/** ¿Sigue teniendo sentido el aviso al momento de mostrarlo? */
function stillRelevant(n: ScheduledNotif): boolean {
  if (n.kind === 'streak') return !playedToday(); // ya terminó el diario de hoy
  if (n.kind === 'lives') { const e = getEnergy(); return e.regenLives >= e.maxLives; }
  return true;
}

/** Revisa los avisos vencidos: muestra los recientes con la app en segundo plano y descarta el resto */
export function checkScheduledNotifications(): void {
  if (getPermission() !== 'granted') return;
  const now = Date.now();
  const items = getSchedules();
  const due = items.filter(n => n.fireAt <= now);
  if (due.length === 0) return;
  const inBackground = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  due.forEach(n => {
    if (!inBackground || now - n.fireAt > STALE_MS || !stillRelevant(n)) return;
    const { title, body } = texts(n);
    showNotification(title, body, { tag: n.id });
  });
  saveSchedules(items.filter(n => n.fireAt > now));
}

// ── Contextual Notification Scheduling ──

/** Desafío diario: mañana a las 9:00 */
export function scheduleDailyReminder(): void {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  schedule('daily-reminder', 'daily', tomorrow);
}

/** Racha del diario en peligro (Fase 2): a la hora indicada (las 7 p. m., ver streakReminder.ts);
 *  al momento de mostrarlo se comprueba que el diario de hoy siga sin jugarse */
export function scheduleStreakWarning(currentStreak: number, at: Date): void {
  if (currentStreak < 1) return;
  schedule('streak-warning', 'streak', at, { n: currentStreak });
}

export function cancelStreakWarning(): void {
  saveSchedules(getSchedules().filter(n => n.id !== 'streak-warning'));
}

/** Vidas completas (se vuelve a comprobar al momento de avisar) */
export function scheduleLivesRegenerated(regenMs: number): void {
  if (regenMs <= 0) return;
  schedule('lives-full', 'lives', new Date(Date.now() + regenMs));
}

/** Initialize notification check loop (runs every 60s while app is open) */
let checkInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationLoop(): void {
  if (checkInterval) return;
  checkScheduledNotifications(); // Descarta lo vencido al abrir (no lo muestra: la app está en pantalla)
  checkInterval = setInterval(checkScheduledNotifications, 60_000);
}

export function stopNotificationLoop(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// WEB PUSH real (llega con la app cerrada) — requiere claves VAPID + backend
// ═══════════════════════════════════════════════════════════════════════════

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Suscribe al usuario a Web Push y guarda la suscripción en Supabase
 * (tabla push_subscriptions). Llamar tras conceder permiso.
 * No hace nada si falta VITE_VAPID_PUBLIC_KEY (aún no configurado).
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!supportsNotifications() || typeof window === 'undefined' || !('PushManager' in window)) return false;
    if (!VAPID_PUBLIC) { console.info('[push] Falta VITE_VAPID_PUBLIC_KEY — suscripción omitida'); return false; }
    if (getPermission() !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    const json = sub.toJSON();
    if (!json.endpoint) return false;

    // Por función del servidor: la tabla ya no es escribible desde el cliente y el user_id sale de la sesión
    const { error: upErr } = await supabase.rpc('register_push_subscription', {
      p_endpoint: json.endpoint,
      p_p256dh: json.keys?.p256dh ?? null,
      p_auth: json.keys?.auth ?? null,
    });
    if (upErr) { console.warn('[push] Guardar suscripción falló', upErr); return false; }
    return true;
  } catch (e) {
    console.warn('[push] Suscripción falló', e);
    return false;
  }
}
