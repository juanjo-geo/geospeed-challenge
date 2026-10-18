/**
 * Fotos de países (decisión D7: feedback por ronda, revisión de ciudad y tarjeta de Mundial).
 *
 * Las 195 fotos aprobadas (zip GeoSpeed_195_Paises_Aprobados, Wikimedia Commons) viven en `public/countries/`:
 *   public/countries/<ISO>.webp      → grande (≤ 960 px, WebP q74, ~80 KB): repaso de ciudad
 *   public/countries/<ISO>-sm.webp   → mediana (≤ 640 px, WebP q70, ~45 KB): tarjeta de respuesta, Mundial, retos
 *   public/countries/credits.json    → [{ iso, country, author, source, license, licenseUrl, url }]
 * Mientras una foto no exista, `CountryPhoto` no ocupa espacio (el <img> falla y se oculta), así que
 * el juego funciona igual con 0, 50 o 195 fotos. Ver public/countries/README.md.
 */
import { countryIso } from '@/lib/flags';

export type PhotoSize = 'lg' | 'sm';

export function countryPhotoUrl(country: string | null | undefined, size: PhotoSize = 'lg'): string | null {
  const iso = countryIso(country);
  if (!iso) return null;
  return `/countries/${iso}${size === 'sm' ? '-sm' : ''}.webp`;
}

export interface PhotoCredit { iso: string; country?: string; author?: string; source?: string; license?: string; licenseUrl?: string; url?: string }

let creditsCache: Promise<PhotoCredit[]> | null = null;
/** Créditos de las fotos (para la página de Soporte). Lista vacía si el archivo no existe. */
export function fetchPhotoCredits(): Promise<PhotoCredit[]> {
  if (!creditsCache) {
    creditsCache = fetch('/countries/credits.json', { cache: 'force-cache' })
      .then(r => (r.ok ? r.json() : []))
      .then(j => (Array.isArray(j) ? j as PhotoCredit[] : []))
      .catch(() => []);
  }
  return creditsCache;
}

// Memoria de fotos que ya fallaron: evita volver a pedir un archivo que no existe en la misma sesión
const missing = new Set<string>();
export const photoKnownMissing = (url: string) => missing.has(url);
export const markPhotoMissing = (url: string) => { missing.add(url); };
