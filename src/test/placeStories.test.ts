/** Reseña del lugar (bloque R3): textos propios — grupos, enlace a Wikipedia y forma de los datos. */
import { describe, it, expect } from 'vitest';
import cities from '@/data/stories/cities.json';
import flags from '@/data/stories/flags.json';
import features from '@/data/stories/features.json';
import monuments from '@/data/stories/monuments.json';
import colombia from '@/data/stories/colombia.json';
import andes from '@/data/stories/andes.json';
import conosur from '@/data/stories/conosur.json';
import mexcam from '@/data/stories/mexcam.json';
import caribe from '@/data/stories/caribe.json';
import { storyGroup, wikipediaUrl } from '@/lib/placeStories';
import { worldCities } from '@/data/cities';
import { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from '@/data/proPackCatalog';

type Story = [[string, string], [string, string], string | null];
const ALL = { cities, flags, features, monuments, colombia, andes, conosur, mexcam, caribe } as unknown as Record<string, Record<string, Story>>;
const words = (s: string) => s.trim().split(/\s+/).length;

describe('reseña: textos propios', () => {
  it('reparte los ids como la galería; los packs Pro van por pack', () => {
    expect(storyGroup('medellin')).toBe('cities');
    expect(storyGroup('flag:CO')).toBe('flags');
    expect(storyGroup('feat:amazonas')).toBe('features');
    expect(storyGroup('mon:torre-eiffel')).toBe('monuments');
    expect(storyGroup('co:guatape')).toBe('colombia');
    expect(storyGroup('div:co-antioquia')).toBe('colombia');
    expect(storyGroup('ci:pe-cusco')).toBe('andes');
    expect(storyGroup('div:pe-cusco')).toBe('andes');
    expect(storyGroup('ci:ar-rosario')).toBe('conosur');
    expect(storyGroup('div:mx-jalisco')).toBe('mexcam');
    expect(storyGroup('ci:cu-la-habana')).toBe('caribe');
    expect(storyGroup('ci:xx-nada')).toBeNull();
  });

  it('el pack de cada id coincide con la región del catálogo', () => {
    for (const c of [...PRO_PACK_CITIES, ...PRO_PACK_DIVISIONS]) expect(storyGroup(c.id!), c.id).toBe(c.region);
  });

  it('arma el enlace al artículo de Wikipedia', () => {
    expect(wikipediaUrl('es:Medellín')).toBe('https://es.wikipedia.org/wiki/Medell%C3%ADn');
    expect(wikipediaUrl('en:Río de la Plata')).toBe('https://en.wikipedia.org/wiki/R%C3%ADo_de_la_Plata');
    expect(wikipediaUrl(null)).toBeNull();
    expect(wikipediaUrl('es:')).toBeNull();
  });

  it('cada lugar trae dos párrafos en español y dos en inglés, de 30 a 120 palabras', () => {
    for (const [group, data] of Object.entries(ALL)) {
      for (const [id, [es, en, wp]] of Object.entries(data)) {
        expect(storyGroup(id), id).toBe(group);
        for (const p of [...es, ...en]) {
          expect(words(p), id).toBeGreaterThanOrEqual(30);
          expect(words(p), id).toBeLessThanOrEqual(120);
        }
        expect(es[0]).not.toBe(en[0]);
        if (wp) expect(wp).toMatch(/^(es|en):.+/);
      }
    }
  });

  it('las 253 ciudades del mundo tienen su reseña', () => {
    const missing = [...new Set(worldCities.map((c) => c.id))].filter((id) => !ALL.cities[id]);
    expect(missing).toEqual([]);
  });

  it('todo el catálogo de los packs Pro tiene su reseña (propia o copiada del mundo)', () => {
    const missing = [...PRO_PACK_CITIES, ...PRO_PACK_DIVISIONS].map((c) => c.id!).filter((id) => !ALL[storyGroup(id)!]?.[id]);
    expect(missing).toEqual([]);
  });

  it('las ciudades de los packs que también están en el mundo llevan la misma reseña', () => {
    expect(ALL.andes['ci:pe-lima']).toBeDefined();
    expect(ALL.andes['ci:pe-lima']?.[0]).toEqual(ALL.cities['lima'][0]);
    expect(ALL.conosur['ci:ar-buenos-aires']?.[1]).toEqual(ALL.cities['buenos-aires'][1]);
  });
});
