import type { MapBounds } from '@/data/cities';

export type FeedbackLayout = 'portrait' | 'compact' | 'wide' | 'medium';

/**
 * Fracción del mapa que tapa la tarjeta de respuesta en cada diseño de la partida (Clásico, 60s de Caos,
 * Mundial): abajo en vertical, a la derecha en los demás. La usan frameAnswer y las etiquetas del mapa.
 */
export function feedbackCover(layout: FeedbackLayout, mapW: number): { right?: number; bottom?: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : mapW;
  const clampPx = (min: number, pref: number, max: number) => Math.max(min, Math.min(pref, max));
  if (layout === 'portrait') return { bottom: 0.5 };
  if (layout === 'compact') return { right: clampPx(288, 0.48 * vw, 416) / mapW };
  if (layout === 'wide') return { right: clampPx(384, 0.36 * vw, 512) / mapW };
  return { right: clampPx(352, 0.40 * vw, 480) / mapW };
}

/** Esquina inferior izquierda que ocupa la leyenda de pines durante la respuesta (px) */
export const PIN_LEGEND_CORNER = { w: 196, h: 80 };

/**
 * Encuadre del mapa para la respuesta de una ronda (maquetas Feedback): acerca la vista a tu respuesta
 * y a la ciudad correcta, dejando libre la parte del mapa que tapa la tarjeta de resultado.
 *
 * @param mapW, mapH   tamaño del área del mapa en px
 * @param cover        fracción del mapa tapada por la tarjeta: a la derecha (`right`), arriba (`top`,
 *                     p.ej. el HUD del celular) o abajo (`bottom`, tarjeta en vertical)
 * @returns límites geográficos con la misma proporción que el mapa, o null si la vista del mundo
 *          ya es la mejor opción (respuestas muy lejanas o que cruzan el antimeridiano).
 */
export function frameAnswer(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  mapW: number,
  mapH: number,
  cover: { right?: number; top?: number; bottom?: number },
  world: MapBounds,
): MapBounds | null {
  if (mapW < 50 || mapH < 50) return null;
  const right = Math.min(0.6, cover.right ?? 0);
  const top = Math.min(0.4, cover.top ?? 0);
  const bottom = Math.min(0.6, cover.bottom ?? 0);

  // Caja de los dos puntos con margen y un tamaño mínimo (no acercar más de la cuenta)
  let lonMin = Math.min(a.lon, b.lon), lonMax = Math.max(a.lon, b.lon);
  let latMin = Math.min(a.lat, b.lat), latMax = Math.max(a.lat, b.lat);
  if (lonMax - lonMin > 180) return null; // cruza el antimeridiano: mejor el mundo completo
  const padLon = Math.max((lonMax - lonMin) * 0.35, 6);
  const padLat = Math.max((latMax - latMin) * 0.35, 4);
  lonMin -= padLon; lonMax += padLon; latMin -= padLat; latMax += padLat;
  const MIN_LON = 22, MIN_LAT = 14;
  if (lonMax - lonMin < MIN_LON) { const c = (lonMin + lonMax) / 2; lonMin = c - MIN_LON / 2; lonMax = c + MIN_LON / 2; }
  if (latMax - latMin < MIN_LAT) { const c = (latMin + latMax) / 2; latMin = c - MIN_LAT / 2; latMax = c + MIN_LAT / 2; }

  // Escala para que la caja quepa en la parte visible del mapa
  const visW = mapW * (1 - right);
  const visH = mapH * (1 - top - bottom);
  const scale = Math.min(visW / (lonMax - lonMin), visH / (latMax - latMin));

  // Si no acerca respecto a la vista del mundo, solo cambiamos el encuadre cuando la tarjeta
  // taparía alguno de los dos puntos (respuestas muy lejanas): entonces el mundo se aleja un poco
  // para que ambos queden en la zona libre.
  const worldScale = Math.min(mapW / (world.lonMax - world.lonMin), mapH / (world.latMax - world.latMin));
  if (scale <= worldScale * 1.15) {
    const ox = (mapW - (world.lonMax - world.lonMin) * worldScale) / 2;
    const oy = (mapH - (world.latMax - world.latMin) * worldScale) / 2;
    const margin = 28;
    const visible = (pt: { lat: number; lon: number }) => {
      const x = ox + (pt.lon - world.lonMin) * worldScale;
      const y = oy + (world.latMax - pt.lat) * worldScale;
      return x <= mapW * (1 - right) - margin && y >= mapH * top + margin && y <= mapH * (1 - bottom) - margin;
    };
    if (visible(a) && visible(b)) return null;
  }

  // Centro de la caja → centro de la zona visible
  const cLon = (lonMin + lonMax) / 2;
  const cLat = (latMin + latMax) / 2;
  const fullLon = mapW / scale;
  const fullLat = mapH / scale;
  const outLonMin = cLon - (visW / 2) / scale;
  const outLatMax = cLat + (mapH * top + visH / 2) / scale;
  return { lonMin: outLonMin, lonMax: outLonMin + fullLon, latMax: outLatMax, latMin: outLatMax - fullLat };
}
