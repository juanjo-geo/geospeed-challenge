/** Pack Colombia (Fase 7a): catálogo, categorías por región, selección, escala y textos. */
import { describe, it, expect } from 'vitest';
import { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
import packShapesJson from '@/data/packShapes.json';
import { getMapBounds, getCitiesByMode, isPackMode, type City } from '@/data/cities';
import { getRandomItems, categoriesForMode, categoryForMode, featuresByMode, landmarksByMode, itemTitle, itemSubtitle, kindFromPlaceId, catalogItem } from '@/lib/catalog';
import { __setPackShapes, featureDistance, type FeatureShapes } from '@/lib/featureScoring';
import { scaleForMode, closeness } from '@/lib/scoring';
import { itemHint } from '@/lib/cityHints';

const packShapes = packShapesJson as unknown as FeatureShapes;
const city = (id: string) => COLOMBIA_CITIES.find((c) => c.id === id)!;
const dept = (id: string) => COLOMBIA_DIVISIONS.find((c) => c.id === id)!;
const inBounds = (c: City) => {
  const b = getMapBounds('colombia');
  return c.lat >= b.latMin && c.lat <= b.latMax && c.lon >= b.lonMin && c.lon <= b.lonMax;
};

describe('catálogo del pack Colombia', () => {
  it('municipios y departamentos con ids únicos, dentro del mapa del pack y con los cuatro niveles', () => {
    const ids = [...COLOMBIA_CITIES, ...COLOMBIA_DIVISIONS].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(COLOMBIA_DIVISIONS).toHaveLength(33);
    expect(COLOMBIA_CITIES.length).toBeGreaterThan(140);
    for (const c of [...COLOMBIA_CITIES, ...COLOMBIA_DIVISIONS]) expect(inBounds(c), c.id).toBe(true);
    for (const tier of ['basic', 'easy', 'medium', 'hard']) expect(COLOMBIA_CITIES.filter((c) => c.difficulty === tier).length).toBeGreaterThanOrEqual(13);
    // Cada departamento tiene contorno; cada capital es un municipio del catálogo
    for (const d of COLOMBIA_DIVISIONS) {
      expect(packShapes[d.id!]?.rings.length, d.id).toBeGreaterThan(0);
      expect(COLOMBIA_CITIES.some((c) => c.name === d.capital), `${d.id}: capital ${d.capital}`).toBe(true);
    }
    expect(packShapes['borders:colombia'].line).toBe(true);
    expect(dept('div:co-boyaca').nb).toContain('Santander');
  });
  it('lugares y monumentos del pack: los del mundo con su nivel local y los exclusivos fuera del mundo', () => {
    const f = featuresByMode('colombia');
    const m = landmarksByMode('colombia');
    expect(f.length).toBeGreaterThan(40);
    expect(m.length).toBeGreaterThan(35);
    expect(f.find((x) => x.id === 'feat:magdalena')?.difficulty).toBe('basic');
    expect(featuresByMode('world').some((x) => x.id === 'feat:tayrona')).toBe(false);
    expect(landmarksByMode('americas').some((x) => x.id === 'mon:plaza-botero')).toBe(false);
    expect(landmarksByMode('world').some((x) => x.id === 'mon:catedral-sal')).toBe(true);
  });
});

describe('región Colombia', () => {
  it('es un pack: categorías con departamentos en vez de banderas, y la escala de 150 km', () => {
    expect(isPackMode('colombia')).toBe(true);
    expect(isPackMode('world')).toBe(false);
    expect(categoriesForMode('colombia')).toEqual(['cities', 'divisions', 'features', 'monuments']);
    expect(categoryForMode('flags', 'colombia')).toBe('divisions');
    expect(categoryForMode('divisions', 'europe')).toBe('flags');
    expect(categoryForMode('monuments', 'colombia')).toBe('monuments');
    expect(scaleForMode('colombia')).toBe(150);
    expect(closeness(100, scaleForMode('colombia'))).toBe(513);
    expect(getCitiesByMode('colombia')).toBe(COLOMBIA_CITIES);
  });
  it('getRandomItems del pack: 13 ítems del pack por categoría, deterministas con semilla', () => {
    for (const cat of ['cities', 'divisions', 'features', 'monuments'] as const) {
      const a = getRandomItems(cat, 'basic', 13, 'colombia', 5);
      expect(a.map((x) => x.id)).toEqual(getRandomItems(cat, 'basic', 13, 'colombia', 5).map((x) => x.id));
      expect(new Set(a.map((x) => x.id)).size).toBe(13);
      // Los lugares del mundo que cruzan Colombia (Amazonas, Orinoco, Llanos) tienen su punto representativo fuera
      if (cat === 'features') expect(a.every((x) => x.packs?.colombia || x.region === 'colombia')).toBe(true);
      else expect(a.every(inBounds), cat).toBe(true);
    }
    // Banderas pedidas en Colombia se vuelven departamentos
    expect(getRandomItems('flags', 'hard', 13, 'colombia', 1).every((x) => x.kind === 'division')).toBe(true);
  });
  it('distancia a un departamento: 0 dentro, al borde fuera', () => {
    __setPackShapes(packShapes);
    const tunja = city('co:tunja');
    expect(featureDistance(dept('div:co-boyaca'), tunja.lat, tunja.lon)).toMatchObject({ km: 0, inside: true });
    const med = city('co:medellin');
    const hit = featureDistance(dept('div:co-boyaca'), med.lat, med.lon);
    expect(hit.inside).toBe(false);
    expect(hit.km).toBeGreaterThan(20);
    expect(hit.km).toBeLessThan(200);
  });
});

describe('textos del pack', () => {
  it('título, subtítulo, pista y reconstrucción desde el id del servidor', () => {
    const guatape = city('co:guatape');
    expect(itemSubtitle(guatape, 'es')).toBe('Antioquia · Colombia');
    expect(itemHint(guatape, 'es')).toMatch(/^Guatapé está en Antioquia; queda a unos \d+ km al \w+ de Medellín\.$/);
    expect(itemHint(city('co:pasto'), 'es')).toMatch(/^Pasto es la capital de Nariño; queda a unos [\d.]+ km al suroeste de Bogotá\.$/);
    const boy = dept('div:co-boyaca');
    expect(itemTitle(boy, 'en')).toBe('Boyacá');
    expect(itemSubtitle(boy, 'es')).toBe('Departamento · Colombia');
    expect(itemHint(boy, 'es')).toMatch(/^Boyacá: su capital, Tunja, queda a unos [\d.]+ km al \w+ de Bogotá\. Limita con /);
    expect(itemHint(dept('div:co-san-andres'), 'es')).toMatch(/islas en el mar Caribe/);
    expect(kindFromPlaceId('div:co-boyaca')).toMatchObject({ kind: 'division', geom: 'area', capital: 'Tunja' });
    expect(kindFromPlaceId('co:guatape')).toMatchObject({ admin: 'Antioquia' });
    expect(catalogItem('co:bogota')?.isCapital).toBe(true);
  });
});
