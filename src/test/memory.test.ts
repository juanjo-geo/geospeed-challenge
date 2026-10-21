import { describe, it, expect } from 'vitest';
import { getCitiesByMode, placeIdOf } from '@/data/cities';
import { reviewCities, regionMastery, memorySummary, nextReviewDay, cityById, REVIEW_MAX, type MemoryItem } from '@/lib/itemMemory';
import { readTrainingCfg, shuffled } from '@/lib/training';

const europe = getCitiesByMode('europe').map(placeIdOf);
const item = (id: string, p: Partial<MemoryItem> = {}): MemoryItem => ({
  item_id: id, box: 1, next_review_on: null, fails: 0, successes: 0, streak: 0, mastered: false, dominated: false, due: false, ...p,
});

describe('memoria de lugares (Fase 4)', () => {
  it('el repaso del día trae solo lo que toca hoy, las cajas bajas primero y máximo 10', () => {
    const items = [
      ...europe.slice(0, 12).map((id, i) => item(id, { fails: 1, box: (i % 5) + 1, due: true, next_review_on: '2026-10-20' })),
      item(europe[12], { fails: 1, box: 1, due: false, next_review_on: '2026-10-30' }),
      item('lugar-que-no-existe', { fails: 1, due: true }),
    ];
    const r = reviewCities(items);
    expect(r).toHaveLength(REVIEW_MAX);
    expect(r.map(placeIdOf)).not.toContain(europe[12]);
    const boxes = r.map((c) => items.find((m) => m.item_id === placeIdOf(c))!.box);
    expect(boxes).toEqual([...boxes].sort((a, b) => a - b));
  });

  it('porcentaje dominado por región sobre todas las ciudades de esa región', () => {
    const items = europe.slice(0, 10).map((id) => item(id, { dominated: true }));
    const m = regionMastery(items, 'europe');
    expect(m.total).toBe(new Set(europe).size);
    expect(m.dominated).toBe(10);
    expect(m.pct).toBe(Math.round((10 / m.total) * 100));
  });

  it('resumen: por aprender (cajas 1–2) · en repaso (3–5) · dominadas', () => {
    const s = memorySummary([
      item('a', { fails: 1, box: 1 }), item('b', { fails: 2, box: 2 }), item('c', { fails: 1, box: 4 }),
      item('d', { dominated: true, mastered: true, fails: 1, box: 5 }), item('e', { dominated: true, streak: 3 }), item('f', { streak: 1 }),
    ]);
    expect(s).toMatchObject({ toLearn: 2, reviewing: 1, dominated: 2 });
  });

  it('próximo repaso y ciudades por id', () => {
    expect(nextReviewDay([item('a', { fails: 1, next_review_on: '2026-11-02' }), item('b', { fails: 1, next_review_on: '2026-10-25' })])).toBe('2026-10-25');
    expect(cityById(europe[0])?.name).toBeTruthy();
  });

  it('configuración del entrenamiento por defecto y mezcla', () => {
    expect(readTrainingCfg()).toMatchObject({ mode: 'world', size: 10, clock: false });
    expect(shuffled([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
  });
});
