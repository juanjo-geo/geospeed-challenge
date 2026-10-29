/**
 * Distancia del clic a un contorno (banderas y lugares geográficos, Fase 6). Decisión de JuanJo: se puntúa
 * por distancia como las ciudades — dentro del país/área = cercanía perfecta; fuera, la distancia al borde
 * más cercano; en una línea (río), la distancia al punto más cercano del trazo.
 *
 * El servidor hace EXACTAMENTE lo mismo (shape_distance_km, migraciones de banderas y lugares) con los
 * mismos contornos (countries.ts → place_shapes; featureShapes.json → place_shapes con is_line): el punto
 * está dentro si cae en cualquier anillo cerrado (rayo horizontal, par/impar); si no, para cada lado del
 * contorno se busca el punto más cercano en un plano local equirectangular alrededor del clic y se mide con
 * haversine. El resultado se redondea a décimas de km en los dos lados antes de calcular la cercanía.
 * Cambiar algo aquí obliga a cambiarlo allá (pruebas de paridad: scripts/test-flags-sql.mjs y
 * scripts/test-features-sql.mjs).
 *
 * Va aparte de flagScoring.ts (que usa los polígonos de countries.ts) para que el catálogo, que se carga al
 * abrir la app, no arrastre el mapa del mundo a la carga inicial.
 */
export interface CountryHit {
  /** km al borde más cercano (0 dentro del área), redondeados a 0,1 */
  km: number;
  inside: boolean;
  /** Punto más cercano del contorno (el propio clic si está dentro) */
  nearest: { lat: number; lon: number };
}

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
/** Distancia haversine en km (misma fórmula que geo_distance_km en el servidor) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Distancia del punto a un contorno hecho de anillos ([lon, lat][]). `closed` = áreas (dentro vale 0);
 * false = líneas (ríos): solo la distancia al trazo. null si el contorno está vacío.
 */
export function shapeDistance(rings: number[][][], lat: number, lon: number, closed = true): CountryHit | null {
  if (closed) {
    for (const ring of rings) {
      if (ring.length >= 3 && pointInRing(lon, lat, ring)) return { km: 0, inside: true, nearest: { lat, lon } };
    }
  }
  const k = Math.max(Math.cos(rad(lat)), 1e-6);
  let best = Infinity;
  let nearest = { lat, lon };
  for (const ring of rings) {
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
      const d = haversineKm(lat, lon, nlat, nlon);
      if (d < best) { best = d; nearest = { lat: nlat, lon: nlon }; }
    }
  }
  if (!Number.isFinite(best)) return null;
  return { km: Math.floor(best * 10 + 0.5) / 10, inside: false, nearest };
}
