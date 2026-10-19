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

/** Pista del modo Mundial: el "lugar" es el país del futbolista. */
export function playerHint(player: string, country: string, lat: number, lon: number, lang: Lang): string {
  const cont = CONTINENT[continentKey(lat, lon)][lang];
  return lang === 'es'
    ? `${player} es de ${country}. Primero ubica el continente: ${cont}.`
    : `${player} is from ${country}. Find the continent first: ${cont}.`;
}
