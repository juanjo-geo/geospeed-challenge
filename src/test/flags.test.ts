import { describe, it, expect } from 'vitest';
import { FLAG_ITEMS } from '@/data/flagCatalog';
import { getRandomFlags, getRandomItems, itemTitle, itemSubtitle, kindFromPlaceId, categoryOf, flagsByMode } from '@/lib/catalog';
import { countryDistance } from '@/lib/flagScoring';
import { flagHint } from '@/lib/cityHints';

describe('banderas (Fase 6)', () => {
  it('el catálogo tiene más de 100 banderas con id, ISO y región válidos', () => {
    expect(FLAG_ITEMS.length).toBeGreaterThan(150);
    for (const f of FLAG_ITEMS) {
      expect(f.id).toBe(`flag:${f.iso}`);
      expect(f.kind).toBe('flag');
      expect(['europe', 'asia', 'americas', 'africa', null]).toContain(f.region);
    }
    expect(FLAG_ITEMS.filter((f) => f.difficulty === 'basic').length).toBeGreaterThanOrEqual(13);
  });

  it('13 banderas de América en Turista: completa con Rookie cuando no alcanzan', () => {
    const picked = getRandomFlags('basic', 13, 'americas', 7);
    expect(picked).toHaveLength(13);
    expect(new Set(picked.map((f) => f.id)).size).toBe(13);
    expect(picked.every((f) => f.region === 'americas')).toBe(true);
    expect(getRandomFlags('basic', 13, 'americas', 7).map((f) => f.id)).toEqual(picked.map((f) => f.id)); // misma semilla
    expect(flagsByMode('world').length).toBe(FLAG_ITEMS.length);
  });

  it('getRandomItems elige ciudades o banderas según la categoría', () => {
    expect(getRandomItems('cities', 'basic', 5, 'world', 1).every((c) => !c.kind)).toBe(true);
    expect(getRandomItems('flags', 'hard', 5, 'europe', 1).every((c) => c.kind === 'flag')).toBe(true);
    expect(categoryOf(getRandomItems('flags', 'easy', 3, 'world', 2))).toBe('flags');
  });

  it('distancia al país: dentro = 0, fuera = km a la frontera', () => {
    const bogota = countryDistance('Colombia', 4.71, -74.07)!;
    expect(bogota.inside).toBe(true);
    expect(bogota.km).toBe(0);
    const fromBogotaToVenezuela = countryDistance('Venezuela', 4.71, -74.07)!;
    expect(fromBogotaToVenezuela.inside).toBe(false);
    expect(fromBogotaToVenezuela.km).toBeGreaterThan(200);
    expect(fromBogotaToVenezuela.km).toBeLessThan(450);
    expect(countryDistance('Japan', 37.57, 126.98)!.km).toBeGreaterThan(150);
    expect(countryDistance('Narnia', 0, 0)).toBeNull();
  });

  it('nombres traducidos, subtítulo por continente y tipo desde el id del lugar', () => {
    const us = FLAG_ITEMS.find((f) => f.iso === 'US')!;
    expect(itemTitle(us, 'es')).toBe('Estados Unidos');
    expect(itemTitle(us, 'en')).toBe('United States');
    expect(itemSubtitle(us, 'es')).toBe('América del Norte');
    expect(kindFromPlaceId('flag:BR')).toEqual({ id: 'flag:BR', kind: 'flag', iso: 'BR' });
    expect(kindFromPlaceId('bogota')).toEqual({ id: 'bogota' });
    expect(flagHint(FLAG_ITEMS.find((f) => f.iso === 'CO')!, 'es')).toMatch(/Colombia está en .*Limita con/);
  });
});
