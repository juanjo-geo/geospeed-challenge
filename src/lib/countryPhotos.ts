/**
 * Fotos de países (decisión D7: feedback por ronda, revisión de ciudad y tarjeta de Mundial).
 *
 * Las 195 fotos aprobadas (zip GeoSpeed_195_Paises_Aprobados, Wikimedia Commons) viven en `public/countries/`:
 *   public/countries/<ISO>.webp      → grande (≤ 960 px, WebP q74, ~80 KB): repaso de ciudad
 *   public/countries/<ISO>-sm.webp   → mediana (≤ 640 px, WebP q70, ~45 KB): tarjeta de respuesta, Mundial, retos
 *   public/countries/credits.json    → [{ iso, country, author, source, license, licenseUrl, url }]
 * Un país sin foto (no está en PHOTO_ISOS) no ocupa espacio; si un archivo falla, el recuadro se
 * cierra. Ver public/countries/README.md.
 */
import { countryIso } from '@/lib/flags';

export type PhotoSize = 'lg' | 'sm';

/** Países con foto en public/countries (regenerar esta lista si se agregan fotos, ver README). Saberlo
 *  sin pedir el archivo permite reservar el espacio de la foto desde el principio (la tarjeta no salta). */
const PHOTO_ISOS = new Set([
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT',
  'BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC',
  'EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU',
  'ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI',
  'LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ',
  'NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW',
  'SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN',
  'TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW',
].join(' ').split(' '));

export function hasCountryPhoto(country: string | null | undefined): boolean {
  const iso = countryIso(country);
  return !!iso && PHOTO_ISOS.has(iso);
}

export function countryPhotoUrl(country: string | null | undefined, size: PhotoSize = 'lg'): string | null {
  const iso = countryIso(country);
  if (!iso || !PHOTO_ISOS.has(iso)) return null;
  return `/countries/${iso}${size === 'sm' ? '-sm' : ''}.webp`;
}

/** Descarga la foto por adelantado (p.ej. al mostrar la ciudad) para que la tarjeta la tenga lista. */
export function preloadCountryPhoto(country: string | null | undefined, size: PhotoSize = 'sm'): void {
  const url = countryPhotoUrl(country, size);
  if (!url || missing.has(url) || typeof Image === 'undefined') return;
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
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
