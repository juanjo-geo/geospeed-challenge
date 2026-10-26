import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { quizNameOk, quizPool, quizRun, cleanName, QUIZ_MAX } from '@/lib/quizzes';
import { scoreRound } from '@/lib/scoring';

const sql = readFileSync(join(__dirname, '../../supabase/migrations/20261103120000_quizzes.sql'), 'utf8');

describe('quizzes (Fase 10)', () => {
  it('el filtro de nombres es el mismo del servidor', () => {
    const m = sql.match(/~ ' \(([a-z|]+)\) '/);
    expect(m).not.toBeNull();
    for (const w of m![1].split('|')) expect(quizNameOk(`Quiz ${w}`), w).toBe(false);
    expect(quizNameOk('Capitales de África')).toBe(true);
    expect(quizNameOk('Cono Sur')).toBe(true);
    expect(quizNameOk('Quiz de MIERDA')).toBe(false);
    expect(cleanName('  muchos   espacios  ')).toBe('muchos espacios');
  });

  it('lugares de la región y las categorías, sin repetir', () => {
    const world = quizPool(['cities'], 'world');
    expect(world.length).toBeGreaterThan(240);
    expect(new Set(world.map((c) => c.id)).size).toBe(world.length);
    const co = quizPool(['cities', 'divisions'], 'colombia');
    expect(co.some((c) => c.id?.startsWith('div:co-'))).toBe(true);
    // Las divisiones solo existen en Colombia
    expect(quizPool(['divisions'], 'europe')).toHaveLength(0);
    expect(quizPool(['flags', 'monuments'], 'europe').every((c) => c.kind === 'flag' || c.kind === 'monument')).toBe(true);
  });

  it('las rondas respetan el orden fijo y el número elegido', () => {
    const ids = quizPool(['cities'], 'europe').slice(0, 8).map((c) => c.id!);
    const fixed = quizRun({ item_ids: ids, settings: { clock: true, rounds: 5, order: 'fixed' } });
    expect(fixed.map((c) => c.id)).toEqual(ids.slice(0, 5));
    const random = quizRun({ item_ids: ids, settings: { clock: true, rounds: 8, order: 'random' } }, 42);
    expect(new Set(random.map((c) => c.id))).toEqual(new Set(ids));
    expect(QUIZ_MAX).toBe(50);
  });

  it('sin reloj la rapidez vale ×1,0 (como el servidor con quiz_free)', () => {
    expect(scoreRound(1000, 12, 0, 100, true).points).toBe(1000);
    expect(scoreRound(1000, 12, 0, 100, false).points).toBe(640); // 12 s → ×0,64
    expect(sql).toContain("when p_game_type = 'quiz_free' then 1000");
  });
});
