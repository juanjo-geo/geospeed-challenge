/**
 * Pistas "Para recordarla" de la Revisión de ciudad (EDU-01).
 *
 * Cada ciudad del catálogo tiene una pista escrita a mano (src/data/cityTips.ts, ES/EN): un ancla
 * del mapa (costa, río, isla, región del país, vecina conocida) para recordar DÓNDE está. Ese archivo
 * se descarga aparte (import dinámico, ~25 KB) cuando aparece la pantalla final o la revisión; mientras
 * llega, o para una ciudad sin pista, se genera una con datos del catálogo: país, continente,
 * hemisferio y la ciudad conocida más cercana con distancia y dirección.
 */
import { useEffect, useState } from 'react';
import { worldCities, europeCities, asiaCities, americasCities, africaCities, type City } from '@/data/cities';
import { haversineDistance } from '@/lib/gameUtils';
import { countryAdjacency } from '@/data/countryAdjacency';
import { countryDisplayName } from '@/lib/flags';
import { featureTypeLabel } from '@/lib/featureTypes';
import { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
import { PRO_PACK_META } from '@/data/proPackMeta';
import { countryIso } from '@/lib/flags';

type Lang = 'es' | 'en';

/** Pistas escritas a mano, cargadas bajo demanda. Clave: nombre de la ciudad tal como está en cities.ts. */
let TIPS: Record<string, { es: string; en: string }> | null = null;
let tipsPromise: Promise<void> | null = null;

/** Descarga las pistas escritas a mano (una vez). Llamarla al llegar a la pantalla final las deja listas. */
export function loadCityTips(): Promise<void> {
  if (!tipsPromise) {
    tipsPromise = import('@/data/cityTips')
      .then(m => { TIPS = m.CITY_TIPS; })
      .catch(() => { tipsPromise = null; });
  }
  return tipsPromise;
}

/** Re-renderiza el componente cuando llegan las pistas escritas a mano. */
export function useCityTips(): boolean {
  const [ready, setReady] = useState(() => TIPS !== null);
  useEffect(() => {
    if (TIPS) return;
    let alive = true;
    loadCityTips().then(() => { if (alive) setReady(TIPS !== null); });
    return () => { alive = false; };
  }, []);
  return ready;
}

// Catálogo completo sin duplicados; FAMOUS = las más conocidas (Turista y Rookie).
const ALL: City[] = (() => {
  const seen = new Set<string>();
  const out: City[] = [];
  for (const c of [...worldCities, ...europeCities, ...asiaCities, ...americasCities, ...africaCities]) {
    const k = `${c.name}|${c.country}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
})();
const FAMOUS = ALL.filter(c => c.difficulty === 'basic' || c.difficulty === 'easy');

function nearestOf(list: City[], city: Pick<City, 'name' | 'lat' | 'lon'>): { ref: City | null; km: number } {
  let ref: City | null = null;
  let km = Infinity;
  for (const c of list) {
    if (c.name === city.name) continue;
    const d = haversineDistance(c.lat, c.lon, city.lat, city.lon);
    if (d >= 40 && d < km) { km = d; ref = c; }
  }
  return { ref, km };
}

const CONTINENT: Record<string, Record<Lang, string>> = {
  europe: { es: 'Europa', en: 'Europe' },
  africa: { es: 'África', en: 'Africa' },
  northAmerica: { es: 'América del Norte', en: 'North America' },
  centralAmerica: { es: 'Centroamérica y el Caribe', en: 'Central America and the Caribbean' },
  southAmerica: { es: 'Sudamérica', en: 'South America' },
  middleEast: { es: 'Oriente Medio', en: 'the Middle East' },
  asia: { es: 'Asia', en: 'Asia' },
  oceania: { es: 'Oceanía', en: 'Oceania' },
};

/** Nombre del continente (aproximado por coordenadas) en el idioma pedido */
export const continentName = (lat: number, lon: number, lang: Lang): string => CONTINENT[continentKey(lat, lon)][lang];

/** Continente aproximado por coordenadas (suficiente para una pista). */
export function continentKey(lat: number, lon: number): keyof typeof CONTINENT {
  if (lon >= -170 && lon <= -30) {
    if (lat < 12 && lon > -82) return 'southAmerica';
    if (lat < 24) return 'centralAmerica';
    return 'northAmerica';
  }
  if (lat > 35 && lon >= -25 && lon <= 45) return 'europe';
  if (lat >= 12 && lat <= 42 && lon > 34 && lon <= 63) return 'middleEast';
  if (lat >= -38 && lat <= 37 && lon >= -25 && lon <= 52) return 'africa';
  if (lat < -10 && lon > 110) return 'oceania';
  if (lon > 160 || lon < -150) return 'oceania';
  return 'asia';
}

const DIRS: Record<Lang, string[]> = {
  es: ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'],
  en: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'],
};

/** Dirección (8 rumbos) en la que queda `to` vista desde `from`. */
function direction(from: { lat: number; lon: number }, to: { lat: number; lon: number }, lang: Lang): string {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lon - from.lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return DIRS[lang][Math.round(bearing / 45) % 8];
}

function roundKm(km: number): number {
  if (km < 100) return Math.round(km / 10) * 10;
  if (km < 1000) return Math.round(km / 50) * 50;
  return Math.round(km / 100) * 100;
}

/** Pista para una ciudad del catálogo. */
export function cityHint(city: Pick<City, 'name' | 'country' | 'lat' | 'lon'>, lang: Lang): string {
  const hand = TIPS?.[city.name];
  if (hand) return hand[lang];

  const cont = CONTINENT[continentKey(city.lat, city.lon)][lang];
  const south = city.lat < 0;

  // Primero una ciudad famosa cercana (mejor ancla para recordar); si no hay a menos de 800 km, la más cercana del catálogo
  let { ref: nearest, km: best } = nearestOf(FAMOUS, city);
  if (!nearest || best > 800) {
    const any = nearestOf(ALL, city);
    if (any.ref && any.km < best) { nearest = any.ref; best = any.km; }
  }

  const where = lang === 'es'
    ? `${city.name} está en ${city.country} (${cont}), en el hemisferio ${south ? 'sur' : 'norte'}.`
    : `${city.name} is in ${city.country} (${cont}), in the ${south ? 'southern' : 'northern'} hemisphere.`;
  if (!nearest || best > 2500) return where;

  const refName = nearest.country === city.country ? nearest.name : `${nearest.name} (${nearest.country})`;
  const dir = direction(nearest, city, lang);
  const km = roundKm(best).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US');
  const rel = lang === 'es'
    ? ` Queda a unos ${km} km al ${dir} de ${refName}.`
    : ` It lies about ${km} km ${dir} of ${refName}.`;
  return where + rel;
}

/** Pista de una bandera (Fase 6): el país, su continente y con quién limita (countryAdjacency, nombres del mapa). */
export function flagHint(item: Pick<City, 'name' | 'lat' | 'lon'>, lang: Lang): string {
  const country = countryDisplayName(item.name, lang);
  const cont = CONTINENT[continentKey(item.lat, item.lon)][lang];
  const nb = (countryAdjacency[item.name] ?? []).map((n) => countryDisplayName(n, lang));
  const list = nb.length === 0 ? '' : nb.length === 1 ? nb[0] : `${nb.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${nb[nb.length - 1]}`;
  if (lang === 'es') return nb.length ? `${country} está en ${cont}. Limita con ${list}.` : `${country} está en ${cont}; no tiene fronteras terrestres.`;
  return nb.length ? `${country} is in ${cont}. It borders ${list}.` : `${country} is in ${cont}; it has no land borders.`;
}

/** Nombre de un país por código ISO en el idioma pedido (Intl; el código si el navegador no lo conoce) */
function isoName(iso: string, lang: Lang): string {
  try { return new Intl.DisplayNames([lang === 'es' ? 'es' : 'en'], { type: 'region' }).of(iso) ?? iso; } catch { return iso; }
}
const joinList = (xs: string[], lang: Lang) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${xs[xs.length - 1]}`;

/** Pista de un lugar geográfico (Fase 6b): tipo, continente y los países que toca (ISO del catálogo). */
export function featureHint(item: Pick<City, 'name' | 'nameEn' | 'lat' | 'lon' | 'ftype' | 'isos' | 'geom'>, lang: Lang): string {
  const name = lang === 'en' && item.nameEn ? item.nameEn : item.name;
  const type = featureTypeLabel(item.ftype, lang).toLowerCase();
  const cont = CONTINENT[continentKey(item.lat, item.lon)][lang];
  const names = (item.isos ?? []).slice(0, 4).map((c) => isoName(c, lang));
  const where = lang === 'es' ? `${name}: ${type} de ${cont}.` : `${name}: ${type} in ${cont}.`;
  if (!names.length) return where;
  const water = item.ftype === 'sea' || item.ftype === 'gulf' || item.ftype === 'strait' || item.ftype === 'reef';
  if (lang === 'es') return `${where} ${water ? 'Baña' : names.length > 1 ? 'Abarca' : 'Está en'} ${joinList(names, lang)}.`;
  return `${where} ${water ? 'It washes' : names.length > 1 ? 'It spans' : 'It is in'} ${joinList(names, lang)}.`;
}

/** Pista de un monumento (Fase 6c): ciudad, país y continente. */
export function landmarkHint(item: Pick<City, 'name' | 'nameEn' | 'country' | 'city' | 'lat' | 'lon'>, lang: Lang): string {
  const name = lang === 'en' && item.nameEn ? item.nameEn : item.name;
  const cont = CONTINENT[continentKey(item.lat, item.lon)][lang];
  const country = lang === 'en' ? countryDisplayName(item.country, 'en') : item.country;
  const place = item.city && item.city !== country ? `${item.city}, ${country}` : country;
  return lang === 'es' ? `${name} está en ${place} (${cont}).` : `${name} is in ${place} (${cont}).`;
}

// ── Pack Colombia (Fase 7a) ──────────────────────────────────────────────────
const coCity = (name: string | undefined) => (name ? COLOMBIA_CITIES.find((c) => c.name === name) : undefined);
const BOGOTA = { lat: 4.711, lon: -74.072 };
const kmFrom = (from: { lat: number; lon: number }, to: { lat: number; lon: number }, lang: Lang) =>
  roundKm(haversineDistance(from.lat, from.lon, to.lat, to.lon)).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US');

/** Pista de un municipio del pack: su departamento y dónde queda respecto a la capital del departamento (o a Bogotá). */
export function packCityHint(item: Pick<City, 'name' | 'lat' | 'lon' | 'admin' | 'isCapital'>, lang: Lang): string {
  if (item.name === 'Bogotá') {
    return lang === 'es'
      ? 'Bogotá es la capital de Colombia: está en el centro del país, en el altiplano de la cordillera Oriental.'
      : 'Bogotá is the capital of Colombia: it sits in the middle of the country, on a high plateau of the Eastern Cordillera.';
  }
  if (item.isCapital) {
    return lang === 'es'
      ? `${item.name} es la capital de ${item.admin}; queda a unos ${kmFrom(BOGOTA, item, lang)} km al ${direction(BOGOTA, item, lang)} de Bogotá.`
      : `${item.name} is the capital of ${item.admin}; it lies about ${kmFrom(BOGOTA, item, lang)} km ${direction(BOGOTA, item, lang)} of Bogotá.`;
  }
  const division = COLOMBIA_DIVISIONS.find((d) => d.name === item.admin);
  const ref = coCity(division?.capital) ?? { name: 'Bogotá', ...BOGOTA };
  return lang === 'es'
    ? `${item.name} está en ${item.admin}; queda a unos ${kmFrom(ref, item, lang)} km al ${direction(ref, item, lang)} de ${ref.name}.`
    : `${item.name} is in ${item.admin}; it lies about ${kmFrom(ref, item, lang)} km ${direction(ref, item, lang)} of ${ref.name}.`;
}

/** Pista de un departamento: su capital (y dónde queda respecto a Bogotá) y con qué departamentos limita. */
export function divisionHint(item: Pick<City, 'name' | 'nameEn' | 'capital' | 'nb' | 'ftype'>, lang: Lang): string {
  const name = lang === 'en' && item.nameEn ? item.nameEn : item.name;
  const nb = item.nb ?? [];
  const list = nb.length > 5 ? [...nb.slice(0, 4), lang === 'es' ? 'otros' : 'others'] : nb;
  if (item.ftype === 'district') {
    return lang === 'es' ? `${name} es el distrito capital de Colombia; lo rodea Cundinamarca.` : `${name} is Colombia's capital district, surrounded by Cundinamarca.`;
  }
  const cap = coCity(item.capital);
  const where = cap
    ? (lang === 'es' ? `su capital, ${cap.name}, queda a unos ${kmFrom(BOGOTA, cap, lang)} km al ${direction(BOGOTA, cap, lang)} de Bogotá` : `its capital, ${cap.name}, lies about ${kmFrom(BOGOTA, cap, lang)} km ${direction(BOGOTA, cap, lang)} of Bogotá`)
    : (lang === 'es' ? `su capital es ${item.capital}` : `its capital is ${item.capital}`);
  if (!nb.length) {
    return lang === 'es' ? `${name} es un departamento de islas en el mar Caribe; ${where}.` : `${name} is a department of islands in the Caribbean Sea; ${where}.`;
  }
  return lang === 'es'
    ? `${name}: ${where}. Limita con ${joinList(list, lang)}.`
    : `${name}: ${where}. It borders ${joinList(list, lang)}.`;
}

// ── Packs Pro (Fase 7b): la referencia es la capital del país ────────────────
function nationalCapital(item: Pick<City, 'country' | 'region'>) {
  const meta = item.region && item.region in PRO_PACK_META ? PRO_PACK_META[item.region as keyof typeof PRO_PACK_META] : null;
  const iso = countryIso(item.country);
  return meta && iso ? meta.capitals[iso] ?? null : null;
}

/** Pista de una ciudad de un pack Pro: su división y país, y dónde queda respecto a la capital del país. */
export function proCityHint(item: Pick<City, 'name' | 'lat' | 'lon' | 'admin' | 'isCapital' | 'country' | 'region'>, lang: Lang): string {
  const cap = nationalCapital(item);
  const where = item.admin ? `${item.admin}, ${item.country}` : item.country;
  if (cap && cap.name === item.name) return lang === 'es' ? `${item.name} es la capital de ${item.country}.` : `${item.name} is the capital of ${item.country}.`;
  const rel = cap ? (lang === 'es' ? `; queda a unos ${kmFrom(cap, item, lang)} km al ${direction(cap, item, lang)} de ${cap.name}` : `; it lies about ${kmFrom(cap, item, lang)} km ${direction(cap, item, lang)} of ${cap.name}`) : '';
  if (item.isCapital) return lang === 'es' ? `${item.name} es la capital de ${where}${rel}.` : `${item.name} is the capital of ${where}${rel}.`;
  return lang === 'es' ? `${item.name} está en ${where}${rel}.` : `${item.name} is in ${where}${rel}.`;
}

/** Pista de una división de un pack Pro: tipo, país, capital y vecinos. */
export function proDivisionHint(item: Pick<City, 'name' | 'nameEn' | 'capital' | 'nb' | 'ftype' | 'country' | 'region'>, lang: Lang): string {
  const name = lang === 'en' && item.nameEn ? item.nameEn : item.name;
  const type = featureTypeLabel(item.ftype, lang).toLowerCase();
  const country = lang === 'en' ? countryDisplayName(item.country, 'en') : item.country;
  const nb = item.nb ?? [];
  const list = nb.length > 5 ? [...nb.slice(0, 4), lang === 'es' ? 'otros' : 'others'] : nb;
  const head = lang === 'es' ? `${name}: ${type} de ${country}` : `${name}: ${type} of ${country}`;
  const cap = item.capital ? (lang === 'es' ? `; su capital es ${item.capital}` : `; its capital is ${item.capital}`) : '';
  const tail = nb.length ? (lang === 'es' ? ` Limita con ${joinList(list, lang)}.` : ` It borders ${joinList(list, lang)}.`) : '';
  return `${head}${cap}.${tail}`;
}

/** Pista de cualquier ítem del catálogo según su tipo */
export const itemHint = (item: Pick<City, 'id' | 'name' | 'country' | 'lat' | 'lon' | 'kind' | 'nameEn' | 'ftype' | 'isos' | 'geom' | 'city' | 'admin' | 'isCapital' | 'capital' | 'nb' | 'region'>, lang: Lang): string =>
  item.kind === 'flag' ? flagHint(item, lang)
    : item.kind === 'feature' ? featureHint(item, lang)
      : item.kind === 'monument' ? landmarkHint(item, lang)
        : item.kind === 'division' ? (item.id?.startsWith('div:co-') ? divisionHint(item, lang) : proDivisionHint(item, lang))
          : item.id?.startsWith('ci:') ? proCityHint(item, lang)
          : item.admin ? packCityHint(item, lang)
            : cityHint(item, lang);

/** Pista del modo Mundial: el "lugar" es el país del futbolista. */
export function playerHint(player: string, country: string, lat: number, lon: number, lang: Lang): string {
  const cont = CONTINENT[continentKey(lat, lon)][lang];
  return lang === 'es'
    ? `${player} es de ${country}. Primero ubica el continente: ${cont}.`
    : `${player} is from ${country}. Find the continent first: ${cont}.`;
}
