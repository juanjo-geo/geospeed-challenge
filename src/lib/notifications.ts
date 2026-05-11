// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Push Notifications System
// ═══════════════════════════════════════════════════════════════════════════
//
// Context-aware browser notifications:
//   • Daily challenge reminder (9 AM local time)
//   • Streak at risk (if no play today by 8 PM)
//   • Lives regenerated (when full again)
//
// Uses Notification API + service worker registration.
// Permission is requested explicitly via UI, never auto-prompted.

const PERMISSION_KEY = 'geospeed_notif_asked';
const SCHEDULE_KEY = 'geospeed_notif_schedules';

/** Check if browser supports notifications */
export function supportsNotifications(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/** Current permission state */
export function getPermission(): NotificationPermission {
  if (!supportsNotifications()) return 'denied';
  return Notification.permission;
}

/** Has the user already been asked? (avoid re-prompting) */
export function hasBeenAsked(): boolean {
  try {
    return localStorage.getItem(PERMISSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Request notification permission — call only from explicit UI action */
export async function requestPermission(): Promise<boolean> {
  if (!supportsNotifications()) return false;
  try {
    localStorage.setItem(PERMISSION_KEY, 'true');
  } catch {}
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
    icon: options?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
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

// ── Scheduled Notification Helpers ──

interface ScheduledNotif {
  id: string;
  fireAt: number; // timestamp ms
  title: string;
  body: string;
  tag: string;
}

function getSchedules(): ScheduledNotif[] {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSchedules(items: ScheduledNotif[]): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
  } catch {}
}

/** Schedule a notification for a future time (local timers — best effort) */
export function scheduleNotification(
  id: string,
  fireAt: Date,
  title: string,
  body: string,
): void {
  if (getPermission() !== 'granted') return;

  const items = getSchedules().filter(n => n.id !== id);
  items.push({ id, fireAt: fireAt.getTime(), title, body, tag: id });
  saveSchedules(items);
}

/** Check and fire any due scheduled notifications */
export function checkScheduledNotifications(): void {
  if (getPermission() !== 'granted') return;
  const now = Date.now();
  const items = getSchedules();
  const due = items.filter(n => n.fireAt <= now);
  const remaining = items.filter(n => n.fireAt > now);

  due.forEach(n => {
    showNotification(n.title, n.body, { tag: n.tag });
  });

  if (due.length > 0) saveSchedules(remaining);
}

// ── Contextual Notification Scheduling ──

/** Schedule daily challenge reminder for tomorrow at 9 AM */
export function scheduleDailyReminder(): void {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  scheduleNotification(
    'daily-reminder',
    tomorrow,
    '🌍 Nuevo desafío diario',
    '¡Las ciudades de hoy te esperan! No pierdas tu racha.',
  );
}

/** Schedule streak-at-risk warning for today at 8 PM */
export function scheduleStreakWarning(currentStreak: number): void {
  if (currentStreak < 2) return; // Only warn if streak worth protecting

  const today = new Date();
  today.setHours(20, 0, 0, 0);

  // Only schedule if it's before 8 PM
  if (Date.now() < today.getTime()) {
    scheduleNotification(
      'streak-warning',
      today,
      `🔥 Tu racha de ${currentStreak} días está en riesgo`,
      '¡Juega una partida antes de medianoche para mantenerla!',
    );
  }
}

/** Schedule lives-full notification */
export function scheduleLivesRegenerated(regenMs: number): void {
  if (regenMs <= 0) return;

  scheduleNotification(
    'lives-full',
    new Date(Date.now() + regenMs),
    '❤️ Vidas completas',
    '¡Tienes 5 vidas listas! Hora de jugar.',
  );
}

/** Initialize notification check loop (runs every 60s while app is open) */
let checkInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationLoop(): void {
  if (checkInterval) return;
  checkScheduledNotifications(); // Check immediately
  checkInterval = setInterval(checkScheduledNotifications, 60_000);
}

export function stopNotificationLoop(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
