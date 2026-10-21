import { describe, it, expect } from 'vitest';
import { gameDay, dailyNumber, dailyDay, nextRollover, dailySeed } from '@/lib/gameDay';
import { gridFromRounds, gridEmojis, dailyShareText, dailyLink, parseDailyInvite, shareName } from '@/lib/dailyChallenge';

describe('día de juego (medianoche de Colombia)', () => {
  it('cambia a las 05:00 UTC', () => {
    expect(gameDay(new Date('2026-10-21T04:59:59Z'))).toBe('2026-10-20');
    expect(gameDay(new Date('2026-10-21T05:00:00Z'))).toBe('2026-10-21');
  });
  it('numera los diarios desde el 12-05-2026 (igual que el servidor)', () => {
    expect(dailyNumber('2026-05-12')).toBe(1);
    expect(dailyNumber('2026-10-21')).toBe(163);
    expect(dailyDay(163)).toBe('2026-10-21');
  });
  it('próximo cambio y semilla estable', () => {
    expect(nextRollover(new Date('2026-10-20T23:00:00Z')).toISOString()).toBe('2026-10-21T05:00:00.000Z');
    expect(dailySeed('2026-10-21')).toBe(dailySeed('2026-10-21'));
    expect(dailySeed('2026-10-21')).not.toBe(dailySeed('2026-10-22'));
  });
});

describe('compartir el diario', () => {
  const rounds = [
    { basePoints: 900, timeExact: 1.4, timeUsed: 1 },
    { basePoints: 650, timeExact: 4.2, timeUsed: 4 },
    { basePoints: 120, timeExact: 2.0, timeUsed: 2 },
  ];
  it('cuadritos: rápido, lento, fallo y sin jugar', () => {
    const g = gridFromRounds(rounds, 5);
    expect(g).toBe('GYRXX');
    expect(gridEmojis(g)).toBe('🟩🟨🟥⬛⬛');
  });
  it('el texto no revela ciudades y lleva el link con el resultado', () => {
    const t = (k: string, v?: Record<string, string | number>) => `${k}${v ? JSON.stringify(v) : ''}`;
    const d = { dailyNo: 163, hits: 2, total: 13, timeMs: 42000, grid: 'GYRXXXXXXXXXX', streak: 12, name: 'Juan José' };
    const text = dailyShareText(d, t);
    expect(text).toContain('2/13 · 42 s');
    expect(text).toContain('🟩🟨🟥');
    expect(text).toContain('/d/163?r=JuanJose&h=2&t=42&g=GYRXXXXXXXXXX');
    expect(dailyLink(d)).toMatch(/^https:\/\/geospeed-challenge\.vercel\.app\/d\/163\?/);
  });
  it('el link de un amigo se lee y se limpia', () => {
    expect(parseDailyInvite(163, '?r=Juanjo<script>&h=8&t=42&g=GGY%3CZ')).toEqual({ dailyNo: 163, name: 'Juanjoscript', hits: 8, timeS: 42, grid: 'GGY' });
    expect(parseDailyInvite(163, '?h=8')).toBeNull();
    expect(shareName('  María José!! ')).toBe('MariaJose');
  });
});
