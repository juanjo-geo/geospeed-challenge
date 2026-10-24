/**
 * Distancia del clic a un lugar geográfico (Fase 6b) o a un departamento de un pack (Fase 7). Los contornos se
 * cargan aparte cuando hacen falta:
 *  · src/data/featureShapes.json (scripts/build-features.mjs): áreas (mares, lagos, desiertos, cordilleras, islas…)
 *    y líneas (ríos) de los lugares;
 *  · src/data/packShapes.json (scripts/build-colombia.mjs): departamentos (`div:co-…`, con un tono para el mapa) y las
 *    fronteras internas del pack Colombia (`borders:colombia`, solo para dibujar);
 *  · src/data/proPackShapes.json (scripts/build-pro-packs.mjs): divisiones de los packs Pro (`div:ve-…`, `div:mx-…`…)
 *    y sus fronteras internas (`borders:andes`, …).
 * Los lugares puntuales (picos, cabos, cataratas) se miden al punto, como las ciudades. Si un contorno aún no llegó,
 * se mide al punto representativo y el servidor (que siempre tiene el contorno) corrige el puntaje al guardar.
 */
import type { City } from '@/data/cities';
import { shapeDistance, haversineKm, type CountryHit } from './flagScoring';

export type FeatureShape = { line: boolean; rings: number[][][]; tone?: number };
export type FeatureShapes = Record<string, FeatureShape>;

type JsonModule = { default?: FeatureShapes };
function makeLoader(importer: () => Promise<unknown>) {
  let value: FeatureShapes | null = null;
  let loading: Promise<FeatureShapes> | null = null;
  return {
    get: () => value,
    set: (v: FeatureShapes | null) => { value = v; loading = null; },
    load(): Promise<FeatureShapes> {
      if (value) return Promise.resolve(value);
      if (!loading) {
        loading = importer()
          .then((m) => { value = (m as JsonModule).default ?? (m as FeatureShapes); return value; })
          .catch((e) => { loading = null; throw e; });
      }
      return loading;
    },
  };
}
const features = makeLoader(() => import('@/data/featureShapes.json'));
const packs = makeLoader(() => import('@/data/packShapes.json'));
const proPacks = makeLoader(() => import('@/data/proPackShapes.json'));

/** Archivo de contornos de un pack o de una división por su id: Colombia (`colombia`, `div:co-…`) o los packs Pro */
export type PackSet = 'colombia' | 'pro';
export const packSetOf = (modeOrId: string | null | undefined): PackSet | null =>
  !modeOrId ? null : modeOrId === 'colombia' || modeOrId.startsWith('div:co-') ? 'colombia' : modeOrId.startsWith('div:') || ['andes', 'conosur', 'mexcam', 'caribe'].includes(modeOrId) ? 'pro' : null;
const loaderOf = (set: PackSet) => (set === 'colombia' ? packs : proPacks);

/** Descarga (una vez) los contornos de los lugares */
export const loadFeatureShapes = (): Promise<FeatureShapes> => features.load();
/** Descarga (una vez) las divisiones y fronteras internas de un pack (por modo o por id de división) */
export const loadPackShapes = (modeOrId: string = 'colombia'): Promise<FeatureShapes> => loaderOf(packSetOf(modeOrId) ?? 'colombia').load();
export const getFeatureShapes = (): FeatureShapes | null => features.get();
export const getPackShapes = (modeOrId: string = 'colombia'): FeatureShapes | null => loaderOf(packSetOf(modeOrId) ?? 'colombia').get();
/** Contorno de un lugar o de un departamento, si ya está cargado */
export const featureShape = (id: string | undefined | null): FeatureShape | null =>
  (id ? (id.startsWith('div:') ? loaderOf(packSetOf(id)!).get()?.[id] : features.get()?.[id]) ?? null : null);
/** Solo pruebas: inyecta los contornos sin cargar los chunks */
export function __setFeatureShapes(s: FeatureShapes | null): void { features.set(s); }
export function __setPackShapes(s: FeatureShapes | null, set: PackSet = 'colombia'): void { loaderOf(set).set(s); }

/** Distancia del clic al lugar: contorno si está cargado (0 dentro de un área); si no, al punto representativo */
export function featureDistance(item: Pick<City, 'id' | 'lat' | 'lon'>, lat: number, lon: number): CountryHit {
  const sh = featureShape(item.id);
  if (sh) {
    const hit = shapeDistance(sh.rings, lat, lon, !sh.line);
    if (hit) return hit;
  }
  // Punto (o contorno ausente): sin redondeo, como las ciudades (el servidor hace geo_distance_km)
  return { km: haversineKm(lat, lon, item.lat, item.lon), inside: false, nearest: { lat: item.lat, lon: item.lon } };
}
