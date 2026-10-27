import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACHIEVEMENTS, FRAMES, TITLES, achievementBadge, achievementTier, diffUnlocks, medalCounts, medalMaps, totalMedalSlots,
  type Progression,
} from '@/lib/progression';
import { FRAME_STYLE, TITLE_KEY } from '@/lib/dailyChallenge';

const sql = readFileSync(join(__dirname, '../../supabase/migrations/20261102120000_progression.sql'), 'utf8');
// La versión vigente de _cosmetic_badge es la última que la redefine (Conquista agregó el título "conquistador")
const cosmeticSql = readFileSync(join(__dirname, '../../supabase/migrations/20261108120000_conquest.sql'), 'utf8');
const stats = (o: Partial<Progression['stats']> = {}): Progression['stats'] => ({
  games: 0, perfects: 0, fast: 0, combo: 0, golds: 0, regions: 0, categories: 0, dominated: 0, flags: 0, challenges: 0, sprint: 0, mundial: 0, daily: 0, ...o,
});

describe('progresión (Fase 9)', () => {
  it('los umbrales de los logros son los mismos del servidor', () => {
    for (const a of ACHIEVEMENTS.filter((x) => x.id !== 'daily')) {
      const m = sql.match(new RegExp(`\\('${a.id}', (\\d+), (\\d+), (\\d+)\\)`));
      expect(m, a.id).not.toBeNull();
      expect([Number(m![1]), Number(m![2]), Number(m![3])]).toEqual(a.tiers);
    }
  });

  it('cada título y marco pide la misma insignia que en el servidor, y tiene nombre y color', () => {
    for (const x of TITLES) {
      expect(cosmeticSql).toContain(`when '${x.id}' then '${x.badge}'`);
      expect(TITLE_KEY[x.id]).toBe(`title_${x.id}`);
    }
    for (const x of FRAMES) {
      expect(cosmeticSql).toContain(`when '${x.id}' then '${x.badge}'`);
      expect(FRAME_STYLE[x.id]).toBeTruthy();
    }
    // Los premios que anuncian los logros existen como título o marco
    for (const a of ACHIEVEMENTS) for (const n of [1, 2, 3] as const) {
      const r = a.rewards?.[n];
      if (r?.title) expect(TITLES.find((x) => x.id === r.title)?.badge).toBe(achievementBadge(a, n));
      if (r?.frame) expect(FRAMES.find((x) => x.id === r.frame)?.badge).toBe(achievementBadge(a, n));
    }
  });

  it('niveles por cifra', () => {
    const golds = ACHIEVEMENTS.find((a) => a.id === 'golds')!;
    expect([0, 4, 5, 24, 25, 99, 100, 500].map((v) => achievementTier(golds, v))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('hay unas 150 medallas posibles (región × categoría × dificultad)', () => {
    expect(medalMaps().length).toBeGreaterThan(30);
    expect(totalMedalSlots()).toBeGreaterThanOrEqual(130);
    expect(totalMedalSlots()).toBeLessThanOrEqual(160);
  });

  it('anuncia solo lo que mejoró y los logros sin ver', () => {
    const prev: Progression = { medals: [{ mode: 'world', difficulty: 'basic', category: 'cities', medal: 1, hits: 6 }], stats: stats({ games: 20 }), badges: [{ id: 'ach_games_1', at: '', seen: true }] };
    const next: Progression = {
      medals: [
        { mode: 'world', difficulty: 'basic', category: 'cities', medal: 3, hits: 12 },
        { mode: 'europe', difficulty: 'easy', category: 'flags', medal: 0, hits: 4 },
      ],
      stats: stats({ games: 21 }),
      badges: [{ id: 'ach_games_1', at: '', seen: true }, { id: 'ach_combo_1', at: '', seen: false }, { id: 'streak_7', at: '', seen: false }],
    };
    const u = diffUnlocks(prev, next);
    expect(u).toHaveLength(2);
    expect(u[0]).toMatchObject({ kind: 'medal', mode: 'world', medal: 3 });
    expect(u[1]).toMatchObject({ kind: 'achievement', badge: 'ach_combo_1', tier: 1 });
    // Un veterano sin caché no recibe todas sus medallas viejas de golpe; alguien nuevo sí
    expect(diffUnlocks(null, { ...next, stats: stats({ games: 40 }) }).filter((x) => x.kind === 'medal')).toHaveLength(0);
    expect(diffUnlocks(null, { ...next, stats: stats({ games: 1 }) }).filter((x) => x.kind === 'medal')).toHaveLength(1);
    expect(medalCounts(next)).toEqual({ gold: 1, silver: 0, bronze: 0 });
  });
});
