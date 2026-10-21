import { describe, it, expect } from 'vitest';
import { gameDay, dailyNumber, dailyDay, nextRollover, dailySeed } from '@/lib/gameDay';
import { gridFromRounds, gridEmojis, dailyShareText, dailyLink, parseDailyInvite, shareName } from '@/lib/dailyChallenge';
import { readDailyQuery, inviteParams, dailyTexts, dailyDateLabel } from '../../api/_dailyMeta';

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

describe('vista previa del link (Fase 2b)', () => {
  it('el link lleva l=en solo si se juega en inglés', () => {
    const d = { dailyNo: 163, hits: 2, total: 13, timeMs: 42000, grid: 'GY', streak: 1, name: 'Ana' };
    expect(dailyLink(d)).not.toContain('l=');
    expect(dailyLink({ ...d, lang: 'en' })).toMatch(/&l=en$/);
  });
  it('limpia y acota lo que llega en la URL', () => {
    const q = readDailyQuery(new URL('https://x.app/api/og-daily?n=163&r=<b>Ana</b>&h=99&t=-3&g=GGZZYRXXXXXXXXXXXXXX'))!;
    expect(q.invite).toEqual({ dailyNo: 163, name: 'bAnab', hits: 13, timeS: 0, grid: 'GGYRXXXXXXXXX' });
    expect(inviteParams(q).toString()).toBe('r=bAnab&h=13&t=0&g=GGYRXXXXXXXXX');
    expect(readDailyQuery(new URL('https://x.app/api/og-daily?n=0'))).toBeNull();
    expect(readDailyQuery(new URL('https://x.app/api/og-daily?n=12.5'))).toBeNull();
  });
  it('textos y fecha del diario en los dos idiomas', () => {
    const es = readDailyQuery(new URL('https://x.app/?n=163&r=Juanjo&h=8&t=42'))!;
    expect(dailyTexts(es).title).toBe('Juanjo hizo 8/13 en el Diario #163 de GeoSpeed. ¿Le ganas?');
    expect(dailyTexts(es).did).toBe('hizo 8/13 en 42 s');
    expect(dailyDateLabel(163, 'es')).toBe('21 de octubre de 2026');
    expect(dailyDateLabel(163, 'en')).toBe('October 21, 2026');
    const plain = readDailyQuery(new URL('https://x.app/?n=163&l=en'))!;
    expect(dailyTexts(plain).title).toBe('GeoSpeed Daily #163: how well do you know the world?');
  });
});
