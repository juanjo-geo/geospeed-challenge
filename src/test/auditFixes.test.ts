import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { loadCatalogs, catalogPool } from '../lib/catalog';
import { trainingCities } from '../lib/training';
import { getBestFor, setBestFor } from '../lib/gameUtils';
import type { MemoryItem } from '../lib/itemMemory';

// Auditoría de promesas 2026-11-16 (docs/GeoSpeed_Auditoria_Promesas.md)
beforeAll(() => loadCatalogs());
beforeEach(() => localStorage.clear());

const due = (id: string, box = 1): MemoryItem => ({ item_id: id, box, next_review_on: null, due: true } as unknown as MemoryItem);

describe('E8: lo fallado en un pack vuelve al entrenar ese pack', () => {
  it('las falladas de Colombia entran primero (hasta la mitad de la tanda)', () => {
    const pool = catalogPool('cities', 'colombia').map((c) => c.id!);
    const failed = pool.slice(0, 8);
    const run = trainingCities({ mode: 'colombia', difficulty: 'basic', size: 10, clock: false, category: 'cities' }, failed.map((id) => due(id)));
    expect(run).toHaveLength(10);
    const ids = new Set(run.map((c) => c.id));
    // al menos la mitad son repaso (la parte nueva, al azar, puede traer otra fallada)
    expect(failed.filter((id) => ids.has(id)).length).toBeGreaterThanOrEqual(5);
    expect(ids.size).toBe(10); // sin repetidos
  });
  it('fuera de un pack la tanda no cambia (esas van al Repaso del día)', () => {
    const run = trainingCities({ mode: 'world', difficulty: 'basic', size: 6, clock: false, category: 'cities' }, [due('co:mitu')]);
    expect(run.some((c) => c.id === 'co:mitu')).toBe(false);
  });
});

describe('E7: el récord se compara con partidas del mismo mapa', () => {
  it('un Imposible no tapa el récord del Clásico', () => {
    setBestFor('imposible:world:basic:cities', 35000);
    setBestFor('classic:world:basic:cities', 9000);
    expect(getBestFor('classic:world:basic:cities')).toBe(9000);
    setBestFor('classic:world:basic:cities', 8000); // un puntaje menor no baja el récord
    expect(getBestFor('classic:world:basic:cities')).toBe(9000);
    expect(getBestFor('classic:europe:basic:cities')).toBe(0);
  });
});

describe('P1: Pro desbloquea todo', () => {
  it('con Pro, regiones, dificultades e Imposible quedan abiertos desde el nivel 1', async () => {
    const { getPlayerLevel, PRO_UNLOCK_LEVEL } = await import('../lib/levelSystem');
    expect(getPlayerLevel().unlockLevel).toBe(1);
    localStorage.setItem('geospeed_premium', JSON.stringify({ isPro: true, proSource: 'lifetime', proExpiresAt: null }));
    expect(getPlayerLevel().unlockLevel).toBe(PRO_UNLOCK_LEVEL);
    const { REGION_UNLOCK_LEVEL, DIFF_UNLOCK_LEVEL } = await import('../lib/selectionArt');
    expect(Math.max(...Object.values(REGION_UNLOCK_LEVEL), ...Object.values(DIFF_UNLOCK_LEVEL))).toBeLessThanOrEqual(PRO_UNLOCK_LEVEL);
  });
});
