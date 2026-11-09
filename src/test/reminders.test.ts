import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  cancel: vi.fn(async () => {}),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  schedule: vi.fn(async () => ({ notifications: [] })),
}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
vi.mock('@capacitor/core', async (original) => ({
  ...(await original<typeof import('@capacitor/core')>()),
  Capacitor: { isNativePlatform: () => true },
}));

import { syncStreakReminder } from '@/lib/streakReminder';
import { syncConquestReminders } from '@/lib/conquestReminders';

type Scheduled = { notifications: { isExactNotification?: boolean }[] };
const scheduled = () => (plugin.schedule.mock.calls as unknown as [Scheduled][]).flatMap(([a]) => a.notifications);

/**
 * La app no tiene SCHEDULE_EXACT_ALARM (Google lo reserva a apps de alarmas). Si una notificación pide alarma exacta, el
 * complemento abre la pantalla "Alarmas y recordatorios" del sistema cada vez que programa, en medio del juego.
 */
describe('recordatorios en la app nativa', () => {
  beforeEach(() => {
    plugin.schedule.mockClear();
    localStorage.clear();
  });

  it('la racha nunca pide alarma exacta', async () => {
    localStorage.setItem('geospeed_daily_status', JSON.stringify({ current_streak: 3 }));
    await syncStreakReminder();
    expect(scheduled().length).toBe(1);
    expect(scheduled().every((n) => n.isExactNotification === false)).toBe(true);
  });

  it('Conquista nunca pide alarma exacta', async () => {
    await syncConquestReminders([{ seasonId: 's1', groupId: 'g1', endsAt: new Date(Date.now() + 48 * 3_600_000).toISOString(), active: true, inRoster: true }]);
    expect(scheduled().length).toBe(2);
    expect(scheduled().every((n) => n.isExactNotification === false)).toBe(true);
  });
});
