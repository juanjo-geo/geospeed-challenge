/**
 * Textos de la reseña del lugar (bloque R3): dos párrafos por lugar en español e inglés — "Lo curioso" y "Para
 * conocer" —, escritos por GeoSpeed con base en el artículo de Wikipedia de cada lugar (scripts/build-story-sources.mjs
 * reúne las fuentes; scripts/merge-stories.mjs valida y arma src/data/stories/<grupo>.json:
 * { id: [[es1, es2], [en1, en2], "es:Título"] }). Mundo + pack Colombia (1.281 lugares); los packs Pro todavía no.
 * Cada grupo se descarga aparte al abrir la primera reseña de ese grupo y queda guardado para jugar sin conexión.
 */
import { useEffect, useState } from 'react';

type Story = [es: [string, string], en: [string, string], wp: string | null];
type Stories = Record<string, Story>;
type Group = 'cities' | 'flags' | 'features' | 'monuments' | 'colombia';

const LOADERS: Record<Group, () => Promise<{ default: Stories }>> = {
  cities: () => import('@/data/stories/cities.json') as unknown as Promise<{ default: Stories }>,
  flags: () => import('@/data/stories/flags.json') as unknown as Promise<{ default: Stories }>,
  features: () => import('@/data/stories/features.json') as unknown as Promise<{ default: Stories }>,
  monuments: () => import('@/data/stories/monuments.json') as unknown as Promise<{ default: Stories }>,
  colombia: () => import('@/data/stories/colombia.json') as unknown as Promise<{ default: Stories }>,
};

/** Grupo de un id; null = sin textos (packs Pro) */
export function storyGroup(id: string): Group | null {
  if (id.startsWith('flag:')) return 'flags';
  if (id.startsWith('feat:')) return 'features';
  if (id.startsWith('mon:')) return 'monuments';
  if (id.startsWith('co:') || id.startsWith('div:co-')) return 'colombia';
  if (id.startsWith('ci:') || id.startsWith('div:')) return null;
  return 'cities';
}

const loaded = new Map<Group, Stories>();
const loading = new Map<Group, Promise<Stories>>();
function loadGroup(g: Group): Promise<Stories> {
  const done = loaded.get(g);
  if (done) return Promise.resolve(done);
  let p = loading.get(g);
  if (!p) {
    p = LOADERS[g]().then((m) => { loaded.set(g, m.default); return m.default; }).catch((e) => { loading.delete(g); throw e; });
    loading.set(g, p);
  }
  return p;
}

export interface PlaceStory { curious: string; visit: string; wikipediaUrl: string | null }

/** "es:Medellín" → enlace al artículo (para "Basado en Wikipedia") */
export function wikipediaUrl(wp: string | null): string | null {
  if (!wp) return null;
  const [lang, ...rest] = wp.split(':');
  const title = rest.join(':');
  return lang && title ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : null;
}

/** Los dos párrafos del lugar en el idioma del juego; null mientras llegan o si el lugar no tiene */
export function usePlaceStory(id: string | null | undefined, locale: string): PlaceStory | null {
  const g = id ? storyGroup(id) : null;
  const pick = (s: Story | undefined): PlaceStory | null => {
    if (!s) return null;
    const [a, b] = locale === 'en' ? s[1] : s[0];
    return { curious: a, visit: b, wikipediaUrl: wikipediaUrl(s[2]) };
  };
  const [story, setStory] = useState<PlaceStory | null>(() => (id && g ? pick(loaded.get(g)?.[id]) : null));
  useEffect(() => {
    if (!id || !g) { setStory(null); return; }
    let alive = true;
    setStory(pick(loaded.get(g)?.[id]));
    loadGroup(g).then((all) => { if (alive) setStory(pick(all[id])); }).catch(() => {});
    return () => { alive = false; };
  }, [id, g, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  return story;
}
