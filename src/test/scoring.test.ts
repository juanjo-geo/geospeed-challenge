import { describe, it, expect } from 'vitest';
import { closeness, speedMilli, toTenths, qualityOf, comboLevelOf, nextComboCount, scoreRound, scaleForMode, difficultyHundredths } from '@/lib/scoring';

describe('puntaje v2 (Temporada 1)', () => {
  it('cercanía: 1.000 a menos de 25 km y curva exponencial por escala', () => {
    expect(closeness(0, 1500)).toBe(1000);
    expect(closeness(24.9, 1500)).toBe(1000);
    expect(closeness(500, 1500)).toBe(717);
    expect(closeness(1500, 1500)).toBe(368);
    expect(closeness(300, 600)).toBe(607);
    expect(closeness(NaN, 1500)).toBe(0);
  });

  it('rapidez: misma curva que antes (×2,2 − 0,13/s, mínimo ×0,4)', () => {
    expect(speedMilli(toTenths(0))).toBe(2200);
    expect(speedMilli(toTenths(1))).toBe(2070);
    expect(speedMilli(toTenths(5))).toBe(1550);
    expect(speedMilli(toTenths(10))).toBe(900);
    expect(speedMilli(toTenths(14))).toBe(400);
    expect(speedMilli(toTenths(4.7))).toBe(1589);
  });

  it('calidad y combo con perdón', () => {
    expect(qualityOf(800)).toBe('good');
    expect(qualityOf(799)).toBe('regular');
    expect(qualityOf(399)).toBe('miss');
    expect(nextComboCount(3, 'good')).toBe(4);
    expect(nextComboCount(3, 'regular')).toBe(3);
    expect(nextComboCount(3, 'miss')).toBe(0);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 12].map(comboLevelOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('ronda: cercanía × rapidez × combo × dificultad en enteros', () => {
    // 1.000 × 2,07 × 1,0 × 1,0
    expect(scoreRound(1000, 1, 0).points).toBe(2070);
    // Segundo acierto bueno seguido: ×1,2
    const r = scoreRound(900, 2, 1, 150);
    expect(r.combo).toBe(2);
    expect(r.comboMult).toBe(1.2);
    expect(r.points).toBe(Math.round(900 * 1.94 * 1.2 * 1.5)); // 3143
    // Regular mantiene el multiplicador del combo actual
    const reg = scoreRound(600, 3, 5);
    expect(reg.combo).toBe(5);
    expect(reg.comboMult).toBe(1.5);
    // Fallo rompe el combo
    const miss = scoreRound(300, 3, 5);
    expect(miss.combo).toBe(0);
    expect(miss.comboMult).toBe(1);
    expect(miss.broke).toBe(true);
    // Máximo: 1.000 × 2,2 × 2,5 × 1,5
    expect(scoreRound(1000, 0, 9, 150).points).toBe(8250);
  });

  it('redondeo mitad hacia arriba, igual que el servidor', () => {
    // 1.000 × 1,589 × 1,0 × 1,1 = 1.747,9 → 1.748
    expect(scoreRound(1000, 4.7, 0, 110).points).toBe(1748);
    // 5 × 2,2 × 1,0 × 1,0 = 11 (sin decimales raros)
    expect(scoreRound(5, 0, 0).points).toBe(11);
  });

  it('escala por modo y dificultad', () => {
    expect(scaleForMode('world')).toBe(1500);
    expect(scaleForMode('mundial')).toBe(1500);
    expect(scaleForMode('europe')).toBe(600);
    expect(difficultyHundredths('hard')).toBe(150);
    expect(difficultyHundredths('hard', false)).toBe(100);
    expect(difficultyHundredths('otra')).toBe(100);
  });
});
