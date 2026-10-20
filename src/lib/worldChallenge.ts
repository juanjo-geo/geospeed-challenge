import { countries } from '@/data/countries';
import { countryAdjacency } from '@/data/countryAdjacency';
import { scoreRound, type Quality } from '@/lib/scoring';

/**
 * Motor de evaluación territorial del módulo "Desafío Mundial".
 *
 * A diferencia del modo ciudades (puntuación por DISTANCIA), aquí se evalúa por
 * TERRITORIO: qué país tocó el jugador respecto al país correcto del futbolista.
 *
 * Bandas (base 1000, coherente con ciudades), luego puntaje v2 como en ciudades (src/lib/scoring.ts):
 * × rapidez × combo (el Mundial no usa el multiplicador de dificultad):
 *   🎯 Exacto           → país correcto                → 1000
 *   🟢 Vecino           → comparte frontera (adyacencia)→ 600
 *   🟡 Mismo continente → otro país del continente      → 300
 *   🔴 Lejos            → otro continente               → 50
 *   ⚫ Océano           → fuera de territorio / timeout  → 0
 *
 * Combo (puntaje v2, Temporada 1): Exacto (1.000) es acierto bueno y lo sube; Vecino (600) es regular y lo
 * mantiene; Mismo continente, Lejos y Océano (< 400) lo rompen.
 */
export type TerritoryBand = 'exact' | 'neighbor' | 'continent' | 'far' | 'ocean';

export interface TerritoryEval {
  band: TerritoryBand;
  /** País que contiene el punto tocado (null si océano/fuera de territorio). */
  tappedCountry: string | null;
  /** Puntos base de la banda, antes de multiplicador y racha. */
  basePoints: number;
}

export interface WorldRoundResult extends TerritoryEval {
  /** Rapidez (×0,4–×2,2) */
  multiplier: number;
  /** Multiplicador de combo aplicado (×1,0–×2,5); `streakBonus` es el nombre antiguo */
  comboMult: number;
  streakBonus: number;
  comboLevel: number;
  quality: Quality;
  brokeCombo: boolean;
  totalPoints: number;
  /** Aciertos buenos seguidos tras la ronda (combo) */
  newStreak: number;
  timeUsed: number;
}

const BAND_POINTS: Record<TerritoryBand, number> = {
  exact: 1000,
  neighbor: 600,
  continent: 300,
  far: 50,
  ocean: 0,
};

// Mapa país → continente (nombres de countries.ts; cubre los 177 territorios con polígono).
export const COUNTRY_CONTINENT: Record<string, string> = {
  'Afghanistan': 'Asia',
  'Albania': 'Europe',
  'Algeria': 'Africa',
  'Angola': 'Africa',
  'Argentina': 'Americas',
  'Armenia': 'Asia',
  'Australia': 'Oceania',
  'Austria': 'Europe',
  'Azerbaijan': 'Asia',
  'Bahamas': 'Americas',
  'Bangladesh': 'Asia',
  'Belarus': 'Europe',
  'Belgium': 'Europe',
  'Belize': 'Americas',
  'Benin': 'Africa',
  'Bhutan': 'Asia',
  'Bolivia': 'Americas',
  'Bosnia and Herz.': 'Europe',
  'Botswana': 'Africa',
  'Brazil': 'Americas',
  'Brunei': 'Asia',
  'Bulgaria': 'Europe',
  'Burkina Faso': 'Africa',
  'Burundi': 'Africa',
  'Cambodia': 'Asia',
  'Cameroon': 'Africa',
  'Canada': 'Americas',
  'Central African Rep.': 'Africa',
  'Chad': 'Africa',
  'Chile': 'Americas',
  'China': 'Asia',
  'Colombia': 'Americas',
  'Congo': 'Africa',
  'Costa Rica': 'Americas',
  'Croatia': 'Europe',
  'Cuba': 'Americas',
  'Cyprus': 'Europe',
  'Czechia': 'Europe',
  'Côte d\'Ivoire': 'Africa',
  'Dem. Rep. Congo': 'Africa',
  'Denmark': 'Europe',
  'Djibouti': 'Africa',
  'Dominican Rep.': 'Americas',
  'Ecuador': 'Americas',
  'Egypt': 'Africa',
  'El Salvador': 'Americas',
  'Eq. Guinea': 'Africa',
  'Eritrea': 'Africa',
  'Estonia': 'Europe',
  'Ethiopia': 'Africa',
  'Falkland Is.': 'Americas',
  'Fiji': 'Oceania',
  'Finland': 'Europe',
  'France': 'Europe',
  'Gabon': 'Africa',
  'Gambia': 'Africa',
  'Georgia': 'Asia',
  'Germany': 'Europe',
  'Ghana': 'Africa',
  'Greece': 'Europe',
  'Greenland': 'Americas',
  'Guatemala': 'Americas',
  'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa',
  'Guyana': 'Americas',
  'Haiti': 'Americas',
  'Honduras': 'Americas',
  'Hungary': 'Europe',
  'Iceland': 'Europe',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Iran': 'Asia',
  'Iraq': 'Asia',
  'Ireland': 'Europe',
  'Israel': 'Asia',
  'Italy': 'Europe',
  'Jamaica': 'Americas',
  'Japan': 'Asia',
  'Jordan': 'Asia',
  'Kazakhstan': 'Asia',
  'Kenya': 'Africa',
  'Kosovo': 'Europe',
  'Kuwait': 'Asia',
  'Kyrgyzstan': 'Asia',
  'Laos': 'Asia',
  'Latvia': 'Europe',
  'Lebanon': 'Asia',
  'Lesotho': 'Africa',
  'Liberia': 'Africa',
  'Libya': 'Africa',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Macedonia': 'Europe',
  'Madagascar': 'Africa',
  'Malawi': 'Africa',
  'Malaysia': 'Asia',
  'Mali': 'Africa',
  'Mauritania': 'Africa',
  'Mexico': 'Americas',
  'Moldova': 'Europe',
  'Mongolia': 'Asia',
  'Montenegro': 'Europe',
  'Morocco': 'Africa',
  'Mozambique': 'Africa',
  'Myanmar': 'Asia',
  'N. Cyprus': 'Europe',
  'Namibia': 'Africa',
  'Nepal': 'Asia',
  'Netherlands': 'Europe',
  'New Caledonia': 'Oceania',
  'New Zealand': 'Oceania',
  'Nicaragua': 'Americas',
  'Niger': 'Africa',
  'Nigeria': 'Africa',
  'North Korea': 'Asia',
  'Norway': 'Europe',
  'Oman': 'Asia',
  'Pakistan': 'Asia',
  'Palestine': 'Asia',
  'Panama': 'Americas',
  'Papua New Guinea': 'Oceania',
  'Paraguay': 'Americas',
  'Peru': 'Americas',
  'Philippines': 'Asia',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Puerto Rico': 'Americas',
  'Qatar': 'Asia',
  'Romania': 'Europe',
  'Russia': 'Europe',
  'Rwanda': 'Africa',
  'S. Sudan': 'Africa',
  'Saudi Arabia': 'Asia',
  'Senegal': 'Africa',
  'Serbia': 'Europe',
  'Sierra Leone': 'Africa',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Solomon Is.': 'Oceania',
  'Somalia': 'Africa',
  'Somaliland': 'Africa',
  'South Africa': 'Africa',
  'South Korea': 'Asia',
  'Spain': 'Europe',
  'Sri Lanka': 'Asia',
  'Sudan': 'Africa',
  'Suriname': 'Americas',
  'Sweden': 'Europe',
  'Switzerland': 'Europe',
  'Syria': 'Asia',
  'Taiwan': 'Asia',
  'Tajikistan': 'Asia',
  'Tanzania': 'Africa',
  'Thailand': 'Asia',
  'Timor-Leste': 'Asia',
  'Togo': 'Africa',
  'Trinidad and Tobago': 'Americas',
  'Tunisia': 'Africa',
  'Turkey': 'Asia',
  'Turkmenistan': 'Asia',
  'Uganda': 'Africa',
  'Ukraine': 'Europe',
  'United Arab Emirates': 'Asia',
  'United Kingdom': 'Europe',
  'United States of America': 'Americas',
  'Uruguay': 'Americas',
  'Uzbekistan': 'Asia',
  'Vanuatu': 'Oceania',
  'Venezuela': 'Americas',
  'Vietnam': 'Asia',
  'W. Sahara': 'Africa',
  'Yemen': 'Asia',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'eSwatini': 'Africa',};

/** Ray-casting point-in-polygon sobre un anillo de pares [lon, lat]. */
function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Devuelve el nombre del país que contiene el punto (lat, lon), o null si es océano.
 * Cada `polygons` es un arreglo de anillos independientes (islas/partes); el punto
 * pertenece al país si cae dentro de cualquiera de sus anillos.
 */
export function getCountryAt(lat: number, lon: number): string | null {
  for (const country of countries) {
    for (const ring of country.polygons) {
      if (ring.length >= 3 && pointInRing(lon, lat, ring)) {
        return country.name;
      }
    }
  }
  return null;
}

function sameContinent(a: string, b: string): boolean {
  const ca = COUNTRY_CONTINENT[a];
  const cb = COUNTRY_CONTINENT[b];
  return !!ca && !!cb && ca === cb;
}

function areNeighbors(correct: string, tapped: string): boolean {
  const list = countryAdjacency[correct];
  if (list && list.includes(tapped)) return true;
  // Simétrico por si solo el otro lado está poblado en la tabla.
  const rev = countryAdjacency[tapped];
  return !!rev && rev.includes(correct);
}

/**
 * Evalúa la banda territorial dado el país correcto y el punto tocado.
 * Si `tappedCountry` ya se conoce, se puede pasar para evitar re-calcular.
 */
export function evaluateTerritory(
  correctCountry: string,
  lat: number,
  lon: number,
  tappedCountryOverride?: string | null,
): TerritoryEval {
  const tappedCountry = tappedCountryOverride !== undefined
    ? tappedCountryOverride
    : getCountryAt(lat, lon);

  let band: TerritoryBand;
  if (tappedCountry == null) band = 'ocean';
  else if (tappedCountry === correctCountry) band = 'exact';
  else if (areNeighbors(correctCountry, tappedCountry)) band = 'neighbor';
  else if (sameContinent(correctCountry, tappedCountry)) band = 'continent';
  else band = 'far';

  return { band, tappedCountry, basePoints: BAND_POINTS[band] };
}

/** Combo según la banda (puntaje v2): exacto sube, vecino mantiene, el resto lo rompe. */
export function nextStreak(band: TerritoryBand, currentStreak: number): number {
  if (band === 'exact') return currentStreak + 1;
  if (band === 'neighbor') return currentStreak;
  return 0;
}

/**
 * Puntúa una ronda completa del Desafío Mundial con el puntaje v2 (como el modo ciudades):
 *   total = puntos de la banda × rapidez × combo (sin multiplicador de dificultad).
 * `timeUsedSeconds` admite decimales (se puntúa en décimas, igual que el servidor).
 */
export function scoreWorldRound(
  correctCountry: string,
  lat: number,
  lon: number,
  timeUsedSeconds: number,
  currentStreak: number,
  tappedCountryOverride?: string | null,
): WorldRoundResult {
  const evalRes = evaluateTerritory(correctCountry, lat, lon, tappedCountryOverride);
  const sc = scoreRound(evalRes.basePoints, timeUsedSeconds, currentStreak, 100);

  return {
    ...evalRes,
    multiplier: sc.speed,
    comboMult: sc.comboMult,
    streakBonus: sc.comboMult,
    comboLevel: sc.comboLevel,
    quality: sc.quality,
    brokeCombo: sc.broke,
    totalPoints: sc.points,
    newStreak: sc.combo,
    timeUsed: timeUsedSeconds,
  };
}

/**
 * Centroide aproximado de un país (promedio de los vértices del anillo más grande).
 * Sirve para colocar un marcador "aquí estaba" en el feedback del mapa.
 * Devuelve {lat, lon} o null si el país no existe en countries.ts.
 */
export function getCountryCentroid(name: string): { lat: number; lon: number } | null {
  const country = countries.find((c) => c.name === name);
  if (!country || country.polygons.length === 0) return null;
  let biggest = country.polygons[0];
  for (const ring of country.polygons) {
    if (ring.length > biggest.length) biggest = ring;
  }
  let sx = 0, sy = 0;
  for (const [lon, lat] of biggest) { sx += lon; sy += lat; }
  const n = biggest.length || 1;
  return { lat: sy / n, lon: sx / n };
}
