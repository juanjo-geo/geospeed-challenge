/**
 * Distancia del clic a un lugar geográfico (Fase 6b). Los contornos (src/data/featureShapes.json, generado por
 * scripts/build-features.mjs) se cargan aparte cuando empieza una partida con lugares: áreas (mares, lagos,
 * desiertos, cordilleras, islas…) y líneas (ríos). Los lugares puntuales (picos, cabos, cataratas) se miden al
 * punto, como las ciudades. Si los contornos aún no llegaron, se mide al punto representativo y el servidor
 * (que siempre tiene el contorno) corrige el puntaje al guardar.
 */
import type { City } from '@/data/cities';
import { shapeDistance, haversineKm, type CountryHit } from './flagScoring';

export type FeatureShape = { line: boolean; rings: number[][][] };
export type FeatureShapes = Record<string, FeatureShape>;

let shapes: FeatureShapes | null = null;
let loading: Promise<FeatureShapes> | null = null;

/** Descarga (una vez) los contornos de los lugares */
export function loadFeatureShapes(): Promise<FeatureShapes> {
  if (shapes) return Promise.resolve(shapes);
  if (!loading) {
    loading = import('@/data/featureShapes.json')
      .then((m) => { shapes = ((m as { default?: FeatureShapes }).default ?? (m as unknown as FeatureShapes)); return shapes; })
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}
export const getFeatureShapes = (): FeatureShapes | null => shapes;
export const featureShape = (id: string | undefined | null): FeatureShape | null => (id && shapes ? shapes[id] ?? null : null);
/** Solo pruebas: inyecta los contornos sin cargar el chunk */
export function __setFeatureShapes(s: FeatureShapes | null): void { shapes = s; loading = null; }

/** Distancia del clic al lugar: contorno si está cargado (0 dentro de un área); si no, al punto representativo */
export function featureDistance(item: Pick<City, 'id' | 'lat' | 'lon'>, lat: number, lon: number): CountryHit {
  const sh = item.id && shapes ? shapes[item.id] : null;
  if (sh) {
    const hit = shapeDistance(sh.rings, lat, lon, !sh.line);
    if (hit) return hit;
  }
  // Punto (o contorno ausente): sin redondeo, como las ciudades (el servidor hace geo_distance_km)
  return { km: haversineKm(lat, lon, item.lat, item.lon), inside: false, nearest: { lat: item.lat, lon: item.lon } };
}
