/** Conquista — fase C1: banco de 12 ciudades por país, encuadre del mapa y semilla del servidor. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONQUEST_COUNTRIES, CONQUEST_CITIES } from '@/data/conquestCatalog';
import { CONQUEST_COUNTRIES_SPEC } from '@/data/conquestTiers';
import { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
import { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
import { PRO_PACK_CITIES } from '@/data/proPackCatalog';
import { catalogItem, kindFromPlaceId, itemTitle } from '@/lib/catalog';

const byId = new Map<string, { lat: number; lon: number; name: string }>();
for (const l of [worldCities, europeCities, asiaCities, americasCities, africaCities, COLOMBIA_CITIES, PRO_PACK_CITIES, CONQUEST_CITIES]) {
  for (const c of l) if (c.id && !byId.has(c.id)) byId.set(c.id, c);
}

describe('Conquista: banco de ciudades', () => {
  it('los diez países aprobados, con 12 ciudades distintas cada uno', () => {
    expect(CONQUEST_COUNTRIES.map((k) => k.iso)).toEqual(['CO', 'PE', 'EC', 'CL', 'AR', 'BR', 'MX', 'ES', 'FR', 'IT']);
    const all = CONQUEST_COUNTRIES.flatMap((k) => k.cityIds);
    for (const k of CONQUEST_COUNTRIES) expect(new Set(k.cityIds).size).toBe(12);
    expect(new Set(all).size).toBe(120);
    expect(CONQUEST_COUNTRIES_SPEC.every((k) => k.cities.length === 12)).toBe(true);
  });

  it('cada id es una ciudad del juego con coordenadas, dentro del encuadre de su país', () => {
    for (const k of CONQUEST_COUNTRIES) {
      const [x0, y0, x1, y1] = k.bounds;
      expect(x1 - x0).toBeGreaterThan(2);
      expect(x1 - x0).toBeLessThan(60);
      for (const id of k.cityIds) {
        const c = byId.get(id);
        expect(c, id).toBeTruthy();
        expect(c!.lon).toBeGreaterThanOrEqual(x0);
        expect(c!.lon).toBeLessThanOrEqual(x1);
        expect(c!.lat).toBeGreaterThanOrEqual(y0);
        expect(c!.lat).toBeLessThanOrEqual(y1);
      }
    }
  });

  it('las ciudades nuevas usan cq:, se resuelven desde el servidor y tienen nombre en inglés', () => {
    expect(CONQUEST_CITIES.length).toBeGreaterThan(20);
    for (const c of CONQUEST_CITIES) {
      expect(c.id).toMatch(/^cq:[a-z]{2}-[a-z0-9-]+$/);
      expect(c.nameEn).toBeTruthy();
      expect(catalogItem(c.id)).toBe(c);
      expect(kindFromPlaceId(c.id).kind).toBe('city');
    }
    const burdeos = CONQUEST_CITIES.find((c) => c.id === 'cq:fr-burdeos')!;
    expect(itemTitle(burdeos, 'es')).toBe('Burdeos');
    expect(itemTitle(burdeos, 'en')).toBe('Bordeaux');
  });

  it('la semilla del servidor trae las ciudades nuevas, las reutilizadas y las 120 filas del banco', () => {
    const sql = readFileSync('supabase/seed/conquest_bank.sql', 'utf8');
    const bank = sql.slice(sql.indexOf('insert into public.conq_bank'));
    expect(bank.match(/^ {2}\('[A-Z]{2}', /gm)?.length).toBe(120);
    for (const c of CONQUEST_CITIES) expect(sql).toContain(`('${c.id}', 'city'`);
  });
});
