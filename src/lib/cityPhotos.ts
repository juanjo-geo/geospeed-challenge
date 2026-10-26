/**
 * Foto propia de cada ciudad (pedido de JuanJo, 2026-10-25): la imagen principal de la ciudad en Wikidata (P18, o su
 * collage P2716) con licencia libre de Wikimedia Commons, convertida a WebP de 640 px por
 * scripts/build-city-photos.mjs + scripts/convert-city-photos.py → public/cities/<slug>.webp y credits.json.
 * 797 de las 825 ciudades del juego tienen foto; las demás (sin imagen libre) siguen usando la del país.
 */
import { CITY_PHOTO_IDS } from '@/data/cityPhotoIds';

export const hasCityPhoto = (id: string | null | undefined): id is string => !!id && CITY_PHOTO_IDS.has(id);
/** Una sola medida (640 px): sirve para la tarjeta de respuesta y para la revisión */
export const cityPhotoUrl = (id: string) => `/cities/${id.replace(/:/g, '-')}.webp`;

/** Descarga una foto antes de que haga falta (la tarjeta de respuesta sale unos segundos después) */
export function preloadPhoto(url: string | null | undefined): void {
  if (!url || typeof Image === 'undefined') return;
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

export interface CityPhotoCredit { id: string; name: string; author: string | null; source: string | null; license: string | null; licenseUrl: string | null; url: string | null }
let credits: Promise<CityPhotoCredit[]> | null = null;
export const fetchCityPhotoCredits = (): Promise<CityPhotoCredit[]> =>
  (credits ??= fetch('/cities/credits.json').then((r) => (r.ok ? r.json() : [])).catch(() => []));
