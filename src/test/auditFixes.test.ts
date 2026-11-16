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
    expect(failed.filter((id) => ids.has(id)).length).toBe(5);
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
