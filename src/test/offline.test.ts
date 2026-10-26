import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const pro = { value: false };
const flags = { offline_pro_only: true };
vi.mock('@/lib/premiumSystem', () => ({ isPro: () => pro.value }));
vi.mock('@/lib/featureFlags', () => ({ getFlag: (k: keyof typeof flags) => flags[k] }));

import { canPlayOffline, isOffline } from '@/lib/offline';
import { saveQuiz, cachedMyQuizzes, fetchQuiz, deleteQuiz, quizPool } from '@/lib/quizzes';
import { buildSavePayload } from '@/lib/gameResults';

const setOnline = (on: boolean) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => on });

describe('juego sin conexión (Fase 11)', () => {
  beforeEach(() => { localStorage.clear(); pro.value = false; flags.offline_pro_only = true; });
  afterEach(() => setOnline(true));

  it('sin conexión juega Pro; el flag lo abre a todos', () => {
    expect(canPlayOffline()).toBe(false);
    pro.value = true;
    expect(canPlayOffline()).toBe(true);
    pro.value = false;
    flags.offline_pro_only = false;
    expect(canPlayOffline()).toBe(true);
  });

  it('un quiz creado sin conexión queda en el teléfono, se puede abrir y borrar', async () => {
    setOnline(false);
    expect(isOffline()).toBe(true);
    const ids = quizPool(['cities'], 'europe').slice(0, 5).map((c) => c.id!);
    const r = await saveQuiz({ name: 'En el avión', region: 'europe', categories: ['cities'], item_ids: ids, settings: { clock: false, rounds: 5, order: 'random' } });
    expect('quiz' in r && r.quiz.pending).toBe(true);
    const q = 'quiz' in r ? r.quiz : null;
    expect(q!.code.startsWith('LOCAL')).toBe(true);
    expect(cachedMyQuizzes().map((x) => x.name)).toContain('En el avión');
    expect((await fetchQuiz(q!.code))?.name).toBe('En el avión');
    // Editar sin conexión no se puede (solo crear)
    expect(await saveQuiz({ id: 'x', name: 'Otro', region: 'europe', categories: ['cities'], item_ids: ids, settings: { clock: false, rounds: 5, order: 'random' } })).toEqual({ error: 'offline' });
    expect(await deleteQuiz(q!.code)).toBe(true);
    expect(cachedMyQuizzes()).toHaveLength(0);
  });

  it('la partida guardada sin señal va marcada offline (no cuenta para los rankings)', () => {
    const input = { gameType: 'classic' as const, mode: 'world', difficulty: 'basic', score: 100, roundsPlayed: 1, roundsTotal: 13, endReason: 'complete' as const, rounds: [] };
    setOnline(false);
    expect((buildSavePayload(input) as Record<string, unknown>).offline).toBe(true);
    setOnline(true);
    expect((buildSavePayload(input) as Record<string, unknown>).offline).toBe(false);
  });
});
