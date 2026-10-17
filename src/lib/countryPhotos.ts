/**
 * Fotos de países (decisión D7: feedback por ronda, revisión de ciudad y tarjeta de Mundial).
 *
 * Las 195 fotos viven FUERA del código, en `public/countries/` (tarea de contenido C4):
 *   public/countries/<ISO>.webp      → tamaño grande (≤ 1280 px de ancho, ~120 KB)
 *   public/countries/<ISO>-sm.webp   → miniatura (≤ 480 px, ~25 KB) para tarjetas y listas
 *   public/countries/credits.json    → [{ "iso": "FR", "author": "…", "source": "…", "license": "…", "url": "…" }]
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

export interface PhotoCredit { iso: string; author?: string; source?: string; license?: string; url?: string }

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
