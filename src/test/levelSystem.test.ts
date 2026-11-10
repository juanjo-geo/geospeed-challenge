import { beforeEach, describe, expect, it } from 'vitest';
import { addGameXP, calculateXP, getPlayerLevel, LEVELS, mergeServerXP } from '@/lib/levelSystem';
import { addBattlePassXP, BATTLE_PASS_LEVELS, getBattlePassLevel, getBattlePassState, getCosmeticState } from '@/lib/cosmetics';

const setHistory = (scores: number[]) =>
  localStorage.setItem('geospeed_history', JSON.stringify(scores.map((score) => ({ date: '2026-11-01', score, rounds: 13, difficulty: 'basic', mode: 'world', avgDistance: 500 }))));

/** Puntos de una partida de Clásico promedio con el Puntaje v2 */
const AVERAGE_GAME = 14_000;

describe('niveles de experiencia', () => {
  beforeEach(() => localStorage.clear());

  it('un jugador nuevo es Novato y solo tiene abierto el nivel 1', () => {
    expect(getPlayerLevel()).toMatchObject({ level: 1, title: 'Novato', xp: 0, unlockLevel: 1 });
  });

  it('diez partidas muy buenas no llegan a los últimos rangos', () => {
    getPlayerLevel();
    for (let i = 0; i < 10; i++) addGameXP(30_000);
    expect(getPlayerLevel()).toMatchObject({ xp: 300_000, title: 'Maestro' });
  });

  it('Deidad Geo pide muchísimas partidas', () => {
    getPlayerLevel();
    for (let i = 0; i < 100; i++) addGameXP(AVERAGE_GAME);
    expect(getPlayerLevel().level).toBeLessThan(LEVELS.length);
    mergeServerXP(2_500_000);
    expect(getPlayerLevel()).toMatchObject({ level: LEVELS.length, title: 'Deidad Geo', progress: 100 });
  });

  it('la experiencia no baja cuando el historial descarta partidas viejas', () => {
    setHistory(Array(20).fill(10_000));
    expect(calculateXP()).toBe(200_000);
    setHistory(Array(20).fill(1_000));
    addGameXP(1_000);
    expect(calculateXP()).toBe(201_000);
  });

  it('el servidor solo sube el acumulado', () => {
    addGameXP(50_000);
    mergeServerXP(10_000);
    expect(calculateXP()).toBe(50_000);
    mergeServerXP(80_000);
    expect(calculateXP()).toBe(80_000);
  });

  it('quien ya tenía candados abiertos con la escala anterior los conserva', () => {
    setHistory([13_000]);
    expect(getPlayerLevel()).toMatchObject({ level: 3, unlockLevel: 6 });
  });

  it('un jugador nuevo abre regiones a medida que sube', () => {
    expect(getPlayerLevel().unlockLevel).toBe(1);
    addGameXP(8_000);
    expect(getPlayerLevel()).toMatchObject({ level: 3, unlockLevel: 3 });
  });

  it('una partida negativa o con decimales no descuadra el contador', () => {
    addGameXP(-500);
    expect(calculateXP()).toBe(0);
    addGameXP(1234.6);
    expect(calculateXP()).toBe(1235);
  });
});

describe('pase de batalla', () => {
  beforeEach(() => localStorage.clear());

  it('una partida promedio no llena el pase: el nivel 1 llega a la segunda', () => {
    addBattlePassXP(AVERAGE_GAME);
    expect(getBattlePassLevel().level).toBe(0);
    addBattlePassXP(AVERAGE_GAME);
    expect(getBattlePassLevel().level).toBe(1);
  });

  it('completarlo pide unas 60 partidas promedio', () => {
    for (let i = 0; i < 40; i++) addBattlePassXP(AVERAGE_GAME);
    expect(getBattlePassLevel().level).toBeLessThan(BATTLE_PASS_LEVELS.length);
    for (let i = 0; i < 30; i++) addBattlePassXP(AVERAGE_GAME);
    expect(getBattlePassLevel().level).toBe(BATTLE_PASS_LEVELS.length);
  });

  it('el progreso del mes con la escala anterior se convierte una sola vez', () => {
    const { seasonId } = getBattlePassState();
    localStorage.setItem('geospeed_battlepass', JSON.stringify({ seasonId, currentXP: 90_000, claimedFree: [1], claimedPremium: [] }));
    expect(getBattlePassState().currentXP).toBe(3_000);
    expect(getBattlePassState().currentXP).toBe(3_000);
    expect(getBattlePassState().claimedFree).toEqual([1]);
  });

  it('las recompensas gratis se siguen entregando al alcanzar su nivel', () => {
    addBattlePassXP(AVERAGE_GAME * 2);
    expect(getCosmeticState().unlockedIds).toContain(BATTLE_PASS_LEVELS[0].freeReward);
  });
});
