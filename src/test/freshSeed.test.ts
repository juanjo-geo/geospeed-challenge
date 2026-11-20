/** Partidas nuevas sin repetir lugares de las anteriores (testers: "Rookie es muy pequeño y se repite") */
import { describe, it, expect, beforeEach } from 'vitest';
import { freshSeed, overlapCost } from '@/lib/freshSeed';
import { getRandomItems } from '@/lib/catalog';
import type { Difficulty, GameMode } from '@/data/cities';

const ids = (seed: number, difficulty: Difficulty, mode: GameMode) =>
  getRandomItems('cities', difficulty, 13, mode, seed).map((c) => c.id ?? c.name);
const shared = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length;

describe('freshSeed', () => {
  beforeEach(() => localStorage.clear());

  it('Rookie (mundo, 47 ciudades): ninguna ciudad de la partida anterior y casi ninguna de la de antes', () => {
    for (let run = 0; run < 5; run++) {
      localStorage.clear();
      const games = [0, 1, 2, 3].map(() => ids(freshSeed('cities', 'easy', 'world', 13, Infinity), 'easy', 'world'));
      for (let g = 1; g < games.length; g++) {
        expect(shared(games[g - 1], games[g])).toBe(0);
        if (g >= 2) expect(shared(games[g - 2], games[g])).toBeLessThanOrEqual(4);
      }
    }
  });

  it('sin la memoria, dos partidas al azar compartían varias ciudades (el problema que reportaron)', () => {
    let total = 0;
    for (let i = 0; i < 200; i++) total += shared(ids(i * 7919 + 1, 'easy', 'world'), ids(i * 104729 + 3, 'easy', 'world'));
    expect(total / 200).toBeGreaterThan(3);
  });

  it('Turista (20 ciudades): la partida siguiente solo repite lo inevitable (6) y usa las 7 que faltaban', () => {
    const a = ids(freshSeed('cities', 'basic', 'world', 13, Infinity), 'basic', 'world');
    const b = ids(freshSeed('cities', 'basic', 'world', 13, Infinity), 'basic', 'world');
    expect(shared(a, b)).toBe(6);
  });

  it('la semilla elegida reproduce la misma lista (Reta a un amigo comparte la semilla)', () => {
    const seed = freshSeed('cities', 'easy', 'europe');
    expect(ids(seed, 'easy', 'europe')).toEqual(ids(seed, 'easy', 'europe'));
  });

  it('cada mapa lleva su propia memoria', () => {
    freshSeed('cities', 'easy', 'world');
    const saved = JSON.parse(localStorage.getItem('geospeed_recent_items') ?? '{}');
    expect(Object.keys(saved)).toEqual(['world|easy|cities']);
    expect(saved['world|easy|cities']).toHaveLength(13);
  });

  it('lo visto hace poco pesa más que lo visto hace varias partidas', () => {
    const recent = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(overlapCost(['a'], recent, 2)).toBe(1000); // de la última partida
    expect(overlapCost(['c'], recent, 2)).toBeGreaterThan(overlapCost(['f'], recent, 2));
    expect(overlapCost(['c', 'd', 'e', 'f'], recent, 2)).toBeLessThan(overlapCost(['b'], recent, 2));
    expect(overlapCost(['x', 'y'], recent, 2)).toBe(0);
  });
});
