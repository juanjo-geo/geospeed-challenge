/** Monumentos (Fase 6c): catálogo, selección por categoría y textos. */
import { describe, it, expect } from 'vitest';
import { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
import { getRandomItems, categoryOf, itemTitle, itemSubtitle, kindFromPlaceId, isMonument, itemPhotoUrl } from '@/lib/catalog';
import { landmarkHint } from '@/lib/cityHints';
import { countryIso } from '@/lib/flags';

const byId = (id: string) => LANDMARK_ITEMS.find((f) => f.id === id)!;

describe('catálogo de monumentos', () => {
  it('ids únicos con prefijo mon:, país conocido del catálogo y coordenadas válidas', () => {
    const ids = LANDMARK_ITEMS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LANDMARK_ITEMS.length).toBeGreaterThan(150);
    for (const f of LANDMARK_ITEMS) {
      expect(f.id).toMatch(/^mon:[a-z0-9-]+$/);
      expect(f.kind).toBe('monument');
      expect(f.nameEn).toBeTruthy();
      expect(f.city).toBeTruthy();
      expect(countryIso(f.country), `${f.id}: país sin ISO "${f.country}"`).toBeTruthy();
      expect(Math.abs(f.lat)).toBeLessThanOrEqual(85);
      expect(Math.abs(f.lon)).toBeLessThanOrEqual(180);
      expect(['basic', 'easy', 'medium', 'hard']).toContain(f.difficulty);
    }
    expect(LANDMARK_ITEMS.filter((f) => f.photo).length / LANDMARK_ITEMS.length).toBeGreaterThan(0.9);
  });
  it('cada región tiene de sobra para una partida', () => {
    for (const region of ['americas', 'europe', 'asia'] as const) {
      expect(LANDMARK_ITEMS.filter((f) => f.region === region).length).toBeGreaterThanOrEqual(30);
    }
    expect(LANDMARK_ITEMS.filter((f) => f.region === 'africa').length).toBeGreaterThanOrEqual(13);
  });
});

describe('selección y textos', () => {
  it('getRandomItems elige monumentos del nivel y la región, de forma determinista con semilla', () => {
    const a = getRandomItems('monuments', 'basic', 13, 'world', 9);
    const b = getRandomItems('monuments', 'basic', 13, 'world', 9);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(new Set(a.map((x) => x.id)).size).toBe(13);
    expect(a.every(isMonument)).toBe(true);
    expect(getRandomItems('monuments', 'medium', 13, 'europe', 2).every((x) => x.region === 'europe')).toBe(true);
    expect(categoryOf(a)).toBe('monuments');
  });
  it('título, subtítulo, foto, pista y reconstrucción desde el id del servidor', () => {
    const eiffel = byId('mon:torre-eiffel');
    expect(itemTitle(eiffel, 'es')).toBe('Torre Eiffel');
    expect(itemTitle(eiffel, 'en')).toBe('Eiffel Tower');
    expect(itemSubtitle(eiffel, 'es')).toBe('París · Francia');
    expect(itemSubtitle(eiffel, 'en')).toBe('París · France');
    expect(itemPhotoUrl(eiffel, 'sm')).toBe('/landmarks/torre-eiffel-sm.webp');
    expect(landmarkHint(eiffel, 'es')).toBe('Torre Eiffel está en París, Francia (Europa).');
    const back = kindFromPlaceId('mon:torre-eiffel');
    expect(back.kind).toBe('monument');
    expect(back.city).toBe('París');
    expect(back.photo).toBe(true);
    expect(kindFromPlaceId('mon:no-existe')).toEqual({ id: 'mon:no-existe', kind: 'monument' });
  });
});
