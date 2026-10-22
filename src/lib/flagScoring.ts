/**
 * Distancia del clic a un país (categoría Banderas, Fase 6). Decisión de JuanJo: se puntúa por distancia
 * como las ciudades — dentro del país = cercanía perfecta; fuera, la distancia a la frontera más cercana.
 *
 * El servidor hace EXACTAMENTE lo mismo (shape_distance_km en la migración de banderas) con los mismos
 * contornos (countries.ts → place_shapes): el punto está dentro si cae en cualquier anillo (rayo horizontal,
 * par/impar); si no, para cada lado del contorno se busca el punto más cercano en un plano local
 * equirectangular alrededor del clic y se mide con haversine. El resultado se redondea a décimas de km en
 * los dos lados antes de calcular la cercanía. Cambiar algo aquí obliga a cambiarlo allá (prueba de paridad:
 * scripts/test-flags-sql.mjs).
 */
import { countries } from '@/data/countries';

export interface CountryHit {
  /** km a la frontera más cercana (0 dentro del país), redondeados a 0,1 */
  km: number;
  inside: boolean;
  /** Punto más cercano del contorno (el propio clic si está dentro) */
  nearest: { lat: number; lon: number };
}

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const wrap = (d: number) => (d > 180 ? d - 360 : d < -180 ? d + 360 : d);

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distancia del punto al contorno del país `name` (nombre de countries.ts); null si el país no existe. */
export function countryDistance(name: string, lat: number, lon: number): CountryHit | null {
  const c = countries.find((x) => x.name === name);
  if (!c) return null;
  for (const ring of c.polygons) {
    if (ring.length >= 3 && pointInRing(lon, lat, ring)) return { km: 0, inside: true, nearest: { lat, lon } };
  }
  const k = Math.max(Math.cos(rad(lat)), 1e-6);
  let best = Infinity;
  let nearest = { lat, lon };
  for (const ring of c.polygons) {
    for (let i = 0; i + 1 < ring.length; i++) {
      // El segundo extremo se mide desde el primero (no se "envuelve" cada uno): un lado del contorno nunca
      // debe partirse por el meridiano opuesto al clic (daba distancias falsas a países al otro lado del mundo)
      const w1 = wrap(ring[i][0] - lon);
      const ax = w1 * k, ay = ring[i][1] - lat;
      const bx = (w1 + (ring[i + 1][0] - ring[i][0])) * k, by = ring[i + 1][1] - lat;
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy;
      let t = l2 > 0 ? -(ax * dx + ay * dy) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const nlat = lat + ay + t * dy;
      const nlon = lon + (ax + t * dx) / k;
      const d = haversine(lat, lon, nlat, nlon);
      if (d < best) { best = d; nearest = { lat: nlat, lon: nlon }; }
    }
  }
  if (!Number.isFinite(best)) return null;
  return { km: Math.floor(best * 10 + 0.5) / 10, inside: false, nearest };
}
