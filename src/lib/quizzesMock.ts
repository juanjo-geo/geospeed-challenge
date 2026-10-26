/**
 * Simulador local de quizzes y favoritos para probar la UI sin el servidor (solo en desarrollo:
 * localStorage.geospeed_mock_quizzes = '1'). Imita quiz_save / my_quizzes / quiz_get / quiz_delete y los favoritos.
 */
import type { Quiz, QuizDraft } from '@/lib/quizzes';
import type { Favorite, FavType } from '@/lib/favorites';

export const isMockQuizzes = (): boolean => {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_quizzes') === '1'; } catch { return false; }
};
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio */ } };
const QK = 'geospeed_mock_quizzes_db';
const FK = 'geospeed_mock_favorites_db';

export const mockQuizzes = {
  list: (): Quiz[] => read<Quiz[]>(QK, []),
  save(d: QuizDraft): Quiz | 'limit' {
    const all = mockQuizzes.list();
    if (d.id) {
      const i = all.findIndex((q) => q.id === d.id);
      if (i < 0) return mockQuizzes.save({ ...d, id: undefined });
      const changed = all[i].item_ids.join() !== d.item_ids.join() || all[i].settings.clock !== d.settings.clock || all[i].settings.rounds !== d.settings.rounds;
      all[i] = { ...all[i], ...d, id: all[i].id, top: changed ? [] : all[i].top, my_best: changed ? null : all[i].my_best } as Quiz;
      write(QK, all);
      return all[i];
    }
    if (all.length >= 3) return 'limit';
    const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
    const q: Quiz = { ...d, id: crypto.randomUUID(), code, plays: 0, mine: true, owner_name: 'Yo', top: [], my_best: null } as Quiz;
    write(QK, [q, ...all]);
    return q;
  },
  get: (code: string): Quiz | null => mockQuizzes.list().find((q) => q.code === code.toUpperCase()) ?? null,
  remove(id: string) { write(QK, mockQuizzes.list().filter((q) => q.id !== id)); },
  record(code: string, score: number, timeMs: number) {
    const all = mockQuizzes.list();
    const q = all.find((x) => x.code === code);
    if (!q) return;
    q.plays += 1;
    if (!q.my_best || score > q.my_best.score) {
      q.my_best = { score, time_ms: timeMs, rank: 1, players: 1 };
      q.top = [{ rank: 1, score, time_ms: timeMs, name: 'Yo', avatar: 'mascot', me: true }];
    }
    write(QK, all);
  },
};

export const mockFavorites = {
  list: (): Favorite[] => read<Favorite[]>(FK, []),
  toggle(type: FavType, id: string): boolean {
    const all = mockFavorites.list();
    const on = !all.some((f) => f.type === type && f.id === id);
    write(FK, on ? [{ type, id, used: new Date().toISOString() }, ...all] : all.filter((f) => !(f.type === type && f.id === id)));
    return on;
  },
  touch(type: FavType, id: string) {
    write(FK, mockFavorites.list().map((f) => (f.type === type && f.id === id ? { ...f, used: new Date().toISOString() } : f)));
  },
};
