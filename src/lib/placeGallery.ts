/**
 * Galería de la reseña del lugar (bloque R2): de 2 a 4 fotos de Wikimedia Commons por lugar, elegidas por
 * scripts/build-place-gallery.mjs (src/data/gallery/<grupo>.json: [archivo, hash, autor, licencia]). No viajan con el
 * juego: el teléfono pide la miniatura a upload.wikimedia.org al abrir "Conoce X" (permitido en la CSP de vercel.json).
 * Wikimedia solo sirve miniaturas de tamaños estándar (500, 960…; 640 da error 400).
 * Cada grupo se descarga aparte y una sola vez, al abrir la primera reseña de ese grupo.
 */
import { useEffect, useState } from 'react';

export type GalleryEntry = [file: string, hash: string, author: string, license: string];
type Gallery = Record<string, GalleryEntry[]>;
type Group = 'cities' | 'flags' | 'features' | 'monuments' | 'colombia' | 'pro';

const LOADERS: Record<Group, () => Promise<{ default: Gallery }>> = {
  cities: () => import('@/data/gallery/cities.json') as unknown as Promise<{ default: Gallery }>,
  flags: () => import('@/data/gallery/flags.json') as unknown as Promise<{ default: Gallery }>,
  features: () => import('@/data/gallery/features.json') as unknown as Promise<{ default: Gallery }>,
  monuments: () => import('@/data/gallery/monuments.json') as unknown as Promise<{ default: Gallery }>,
  colombia: () => import('@/data/gallery/colombia.json') as unknown as Promise<{ default: Gallery }>,
  pro: () => import('@/data/gallery/pro.json') as unknown as Promise<{ default: Gallery }>,
};

/** Grupo de un id del catálogo (el mismo reparto que hace el script) */
export function galleryGroup(id: string): Group {
  if (id.startsWith('flag:')) return 'flags';
  if (id.startsWith('feat:')) return 'features';
  if (id.startsWith('mon:')) return 'monuments';
  if (id.startsWith('co:') || id.startsWith('div:co-')) return 'colombia';
  if (id.startsWith('ci:') || id.startsWith('div:')) return 'pro';
  return 'cities';
}

const loaded = new Map<Group, Gallery>();
const loading = new Map<Group, Promise<Gallery>>();
function loadGroup(g: Group): Promise<Gallery> {
  const done = loaded.get(g);
  if (done) return Promise.resolve(done);
  let p = loading.get(g);
  if (!p) {
    p = LOADERS[g]().then((m) => { loaded.set(g, m.default); return m.default; }).catch((e) => { loading.delete(g); throw e; });
    loading.set(g, p);
  }
  return p;
}

/** Fotos de la galería de un lugar; [] mientras llegan, sin conexión o si no tiene */
export function useGallery(id: string | null | undefined): GalleryEntry[] {
  const g = id ? galleryGroup(id) : null;
  const [entries, setEntries] = useState<GalleryEntry[]>(() => (id && g ? loaded.get(g)?.[id] ?? [] : []));
  useEffect(() => {
    if (!id || !g) { setEntries([]); return; }
    let alive = true;
    setEntries(loaded.get(g)?.[id] ?? []);
    loadGroup(g).then((gal) => { if (alive) setEntries(gal[id] ?? []); }).catch(() => {});
    return () => { alive = false; };
  }, [id, g]);
  return entries;
}

const enc = (file: string) => encodeURIComponent(file);
/** Miniatura de Commons en un tamaño estándar */
export const commonsThumb = (file: string, hash: string, width: 500 | 960) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash}/${enc(file)}/${width}px-${enc(file)}`;
/** Página del archivo en Commons (autor, licencia y original) */
export const commonsPage = (file: string) => `https://commons.wikimedia.org/wiki/File:${enc(file)}`;
