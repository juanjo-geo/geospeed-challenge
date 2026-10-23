/** Lugares geográficos (Fase 6b): catálogo, contornos, puntaje por distancia y selección por categoría. */
import { describe, it, expect } from 'vitest';
import { FEATURE_ITEMS } from '@/data/featureCatalog';
import shapesJson from '@/data/featureShapes.json';
import { __setFeatureShapes, featureDistance, type FeatureShapes } from '@/lib/featureScoring';
import { getRandomItems, categoryOf, itemTitle, itemSubtitle, kindFromPlaceId, isFeature } from '@/lib/catalog';
import { featureHint } from '@/lib/cityHints';

const shapes = shapesJson as unknown as FeatureShapes;
const byId = (id: string) => FEATURE_ITEMS.find((f) => f.id === id)!;

describe('catálogo de lugares', () => {
  it('ids únicos con prefijo feat:, tipo y geometría válidos', () => {
    const ids = FEATURE_ITEMS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FEATURE_ITEMS.length).toBeGreaterThan(300);
    for (const f of FEATURE_ITEMS) {
      expect(f.id).toMatch(/^feat:[a-z0-9-]+$/);
      expect(f.kind).toBe('feature');
      expect(['area', 'line', 'point']).toContain(f.geom);
      expect(f.ftype).toBeTruthy();
      expect(f.nameEn).toBeTruthy();
      expect(['basic', 'easy', 'medium', 'hard']).toContain(f.difficulty);
    }
  });
  it('cada área y cada línea tiene contorno, y las líneas van marcadas', () => {
    for (const f of FEATURE_ITEMS) {
      if (f.geom === 'point') { expect(shapes[f.id!]).toBeUndefined(); continue; }
      const sh = shapes[f.id!];
      expect(sh, f.id).toBeTruthy();
      expect(sh.line).toBe(f.geom === 'line');
      expect(sh.rings.length).toBeGreaterThan(0);
      for (const ring of sh.rings) expect(ring.length).toBeGreaterThanOrEqual(f.geom === 'line' ? 2 : 4);
    }
  });
  it('cada región tiene de sobra para una partida y el mundo tiene los cuatro niveles', () => {
    for (const region of ['americas', 'europe', 'asia', 'africa'] as const) {
      expect(FEATURE_ITEMS.filter((f) => f.region === region).length).toBeGreaterThanOrEqual(30);
    }
    for (const tier of ['basic', 'easy', 'medium', 'hard']) expect(FEATURE_ITEMS.filter((f) => f.difficulty === tier).length).toBeGreaterThanOrEqual(13);
  });
});

describe('distancia a un lugar', () => {
  it('sin contornos mide al punto representativo; con contornos, al área, al trazo o al punto', () => {
    __setFeatureShapes(null);
    const sahara = byId('feat:sahara');
    const noShape = featureDistance(sahara, sahara.lat + 1, sahara.lon);
    expect(noShape.inside).toBe(false);
    expect(noShape.km).toBeGreaterThan(100);

    __setFeatureShapes(shapes);
    // Dentro del Sahara: 0 km
    const inside = featureDistance(sahara, 23, 10);
    expect(inside).toEqual({ km: 0, inside: true, nearest: { lat: 23, lon: 10 } });
    // Fuera (Madrid): distancia al borde, en décimas
    const madrid = featureDistance(sahara, 40.42, -3.7);
    expect(madrid.inside).toBe(false);
    expect(madrid.km).toBeGreaterThan(500);
    expect(madrid.km).toBe(Math.floor(madrid.km * 10 + 0.5) / 10);
    // Sobre el Nilo (un vértice del trazo): 0 km pero nunca "dentro"
    const nilo = byId('feat:nilo');
    const v = shapes['feat:nilo'].rings[0][0];
    const onRiver = featureDistance(nilo, v[1], v[0]);
    expect(onRiver.km).toBe(0);
    expect(onRiver.inside).toBe(false);
    // Un pico: al punto exacto, 0; sin redondeo a décimas en los demás casos
    const everest = byId('feat:everest');
    expect(featureDistance(everest, everest.lat, everest.lon).km).toBe(0);
    const far = featureDistance(everest, 4.71, -74.07);
    expect(far.km).toBeGreaterThan(15000);
    // Mediterráneo: dentro desde el mar, fuera desde tierra
    const med = byId('feat:mediterraneo');
    expect(featureDistance(med, 35, 18).inside).toBe(true);
    expect(featureDistance(med, 48.85, 2.35).inside).toBe(false);
  });
});

describe('selección y textos', () => {
  it('getRandomItems elige lugares del nivel y la región, de forma determinista con semilla', () => {
    const a = getRandomItems('features', 'basic', 13, 'world', 7);
    const b = getRandomItems('features', 'basic', 13, 'world', 7);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(new Set(a.map((x) => x.id)).size).toBe(13);
    expect(a.every(isFeature)).toBe(true);
    const africa = getRandomItems('features', 'hard', 13, 'africa', 3);
    expect(africa.length).toBe(13);
    expect(africa.every((x) => x.region === 'africa')).toBe(true);
    expect(categoryOf(a)).toBe('features');
  });
  it('título, subtítulo, pista y reconstrucción desde el id del servidor', () => {
    const amazonas = byId('feat:amazonas');
    expect(itemTitle(amazonas, 'es')).toBe('Río Amazonas');
    expect(itemTitle(amazonas, 'en')).toBe('Amazon River');
    expect(itemSubtitle(amazonas, 'es')).toContain('Río');
    expect(itemSubtitle(amazonas, 'en')).toContain('River');
    expect(featureHint(amazonas, 'es')).toMatch(/^Río Amazonas: río de Sudamérica\./);
    expect(featureHint(amazonas, 'es')).toMatch(/Brasil|Perú|Colombia/);
    const back = kindFromPlaceId('feat:amazonas');
    expect(back.kind).toBe('feature');
    expect(back.geom).toBe('line');
    expect(back.nameEn).toBe('Amazon River');
    expect(kindFromPlaceId('feat:no-existe')).toEqual({ id: 'feat:no-existe', kind: 'feature' });
  });
});
