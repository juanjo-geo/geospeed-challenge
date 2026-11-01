/**
 * Textos de la reseña del lugar (bloque R3): dos párrafos por lugar en español e inglés — "Lo curioso" y "Para
 * conocer" —, escritos por GeoSpeed con base en el artículo de Wikipedia de cada lugar (scripts/build-story-sources.mjs
 * reúne las fuentes; scripts/merge-stories.mjs valida y arma src/data/stories/<grupo>.json:
 * { id: [[es1, es2], [en1, en2], "es:Título"] }). Mundo + pack Colombia (1.281 lugares) y, desde el punto 11
 * (2026-10-29), los cuatro packs Pro en un archivo por pack (andes, conosur, mexcam, caribe; las ciudades que también
 * están en el catálogo del mundo llevan copiada la reseña del mundo).
 * Cada grupo se descarga aparte al abrir la primera reseña de ese grupo y queda guardado para jugar sin conexión.
 */
import { useEffect, useState } from 'react';
import { PRO_PACK_META } from '@/data/proPackMeta';

type Story = [es: [string, string], en: [string, string], wp: string | null];
type Stories = Record<string, Story>;
type Pack = keyof typeof PRO_PACK_META;
type Group = 'cities' | 'flags' | 'features' | 'monuments' | 'colombia' | Pack;

const LOADERS: Record<Group, () => Promise<{ default: Stories }>> = {
  cities: () => import('@/data/stories/cities.json') as unknown as Promise<{ default: Stories }>,
  flags: () => import('@/data/stories/flags.json') as unknown as Promise<{ default: Stories }>,
  features: () => import('@/data/stories/features.json') as unknown as Promise<{ default: Stories }>,
  monuments: () => import('@/data/stories/monuments.json') as unknown as Promise<{ default: Stories }>,
  colombia: () => import('@/data/stories/colombia.json') as unknown as Promise<{ default: Stories }>,
  andes: () => import('@/data/stories/andes.json') as unknown as Promise<{ default: Stories }>,
  conosur: () => import('@/data/stories/conosur.json') as unknown as Promise<{ default: Stories }>,
  mexcam: () => import('@/data/stories/mexcam.json') as unknown as Promise<{ default: Stories }>,
  caribe: () => import('@/data/stories/caribe.json') as unknown as Promise<{ default: Stories }>,
};

let packByIso: Record<string, Pack> | null = null;
/** País (ISO en minúscula, como en los ids `ci:pe-…` / `div:pe-…`) → pack Pro */
function packOfIso(iso: string): Pack | null {
  if (!packByIso) {
    packByIso = {};
    for (const pack of Object.keys(PRO_PACK_META) as Pack[]) for (const i of PRO_PACK_META[pack].isos) packByIso[i.toLowerCase()] = pack;
  }
  return packByIso[iso.toLowerCase()] ?? null;
}

/** Grupo de un id; null = sin textos (un país que no está en ningún pack) */
export function storyGroup(id: string): Group | null {
  if (id.startsWith('flag:')) return 'flags';
  if (id.startsWith('feat:')) return 'features';
  if (id.startsWith('mon:')) return 'monuments';
  if (id.startsWith('co:') || id.startsWith('div:co-')) return 'colombia';
  const pack = id.match(/^(?:ci|div):([a-z]{2})-/);
  if (pack) return packOfIso(pack[1]);
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
