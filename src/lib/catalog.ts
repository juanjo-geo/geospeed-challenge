/**
 * Categorías del juego (Fase 6): qué se ubica en el mapa. Ciudades, banderas, lugares geográficos y monumentos; en
 * los packs de país (Fase 7) las banderas dan paso a sus divisiones (departamentos de Colombia). Un ítem de cualquier
 * categoría tiene la forma de `City` (kind lo distingue), así que la partida, la revisión y la memoria de lugares no
 * cambian de tipo.
 *
 * Decisiones de JuanJo (2026-10-22/23): las categorías nuevas van en Clásico, Entrenamiento y Retos (el Diario y
 * el Sprint siguen con ciudades del mundo); banderas, lugares y departamentos se puntúan por distancia al contorno
 * (src/lib/flagScoring.ts, src/lib/featureScoring.ts); el pack Colombia se elige en Región.
 */
import { getRandomCities, getCitiesByMode, isPackMode, type City, type Difficulty, type GameMode } from '@/data/cities';
import { FLAG_ITEMS } from '@/data/flagCatalog';
import { FEATURE_ITEMS } from '@/data/featureCatalog';
import { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
import { COLOMBIA_CITIES, COLOMBIA_DIVISIONS } from '@/data/colombiaCatalog';
import { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from '@/data/proPackCatalog';
import { PRO_PACK_META } from '@/data/proPackMeta';
import { countryDisplayName, countryIso, flagUrl } from '@/lib/flags';
import { continentName } from '@/lib/cityHints';
import { featureTypeLabel } from '@/lib/featureTypes';
import { loadFeatureShapes, loadPackShapes } from '@/lib/featureScoring';
import { isProPack } from '@/lib/packAccess';
import { countryPhotoUrl, hasCountryPhoto, type PhotoSize } from '@/lib/countryPhotos';
import { landmarkPhotoUrl } from '@/lib/landmarkPhotos';

export type Category = 'cities' | 'flags' | 'features' | 'monuments' | 'divisions';
/** Todas las categorías (para validar lo guardado); las que se ofrecen dependen de la región: categoriesForMode */
export const CATEGORIES: Category[] = ['cities', 'flags', 'features', 'monuments', 'divisions'];
export const isCategory = (v: unknown): v is Category => CATEGORIES.includes(v as Category);
/** Mínimo de ítems para ofrecer una categoría en una región (una partida del Clásico tiene 13 rondas) */
const MIN_POOL = 13;
/**
 * Categorías de una región: en los packs, divisiones (departamentos, estados, provincias…) en vez de banderas; en los
 * packs Pro solo las que tienen al menos 13 ítems (p. ej. el Caribe no tiene 13 monumentos en el catálogo).
 */
export function categoriesForMode(mode: GameMode | string): Category[] {
  if (!isPackMode(mode)) return ['cities', 'flags', 'features', 'monuments'];
  const all: Category[] = ['cities', 'divisions', 'features', 'monuments'];
  if (!isProPack(mode)) return all;
  return all.filter((c) => poolForCategory(c, mode as GameMode).length >= MIN_POOL);
}
/** La categoría elegida, válida para la región (banderas ↔ departamentos son la misma idea a otra escala) */
export function categoryForMode(category: Category, mode: GameMode | string): Category {
  const allowed = categoriesForMode(mode);
  if (allowed.includes(category)) return category;
  if (category === 'flags' || category === 'divisions') return isPackMode(mode) ? 'divisions' : 'flags';
  return 'cities';
}

export const isFlag = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'flag';
export const isFeature = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'feature';
export const isMonument = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'monument';
export const isDivision = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'division';
/** Ítems que se muestran con un nombre propio (no "¿Dónde está? ciudad"): título y subtítulo vienen de itemTitle/itemSubtitle */
export const isSpecial = (item: Pick<City, 'kind'> | null | undefined) => isFlag(item) || isFeature(item) || isMonument(item) || isDivision(item);
/** Lugares y departamentos: su contorno sale de featureShapes/packShapes (las banderas usan countries.ts) */
export const usesShapeFile = (item: Pick<City, 'kind'> | null | undefined) => isFeature(item) || isDivision(item);
/** La respuesta se mide a un contorno (dentro = 0 km) o a un trazo, no a un punto */
export const hasShape = (item: Pick<City, 'kind' | 'geom'> | null | undefined) => isFlag(item) || (usesShapeFile(item) && item?.geom !== 'point');

/** Emoji e ilustración compuesta de cada categoría (hojas de selección, como REGION_ART / DIFF_ART) */
export const CATEGORY_ART: Record<Category, { emoji: string; art: [string, string?] }> = {
  cities: { emoji: '🏙️', art: ['🏙️', '📍'] },
  flags: { emoji: '🚩', art: ['🚩', '🗺️'] },
  features: { emoji: '🏔️', art: ['🏔️', '🌊'] },
  monuments: { emoji: '🗼', art: ['🗼', '📸'] },
  divisions: { emoji: '🗺️', art: ['🗺️', '📍'] },
};

/** Clave i18n del nombre de la categoría */
export const CATEGORY_KEY: Record<Category, string> = { cities: 'cat_cities', flags: 'cat_flags', features: 'cat_features', monuments: 'cat_monuments', divisions: 'cat_divisions' };

/** Clave i18n del nombre de una categoría en una región: en los packs Pro las divisiones son "Estados y provincias" */
export const categoryLabelKey = (cat: Category, mode: GameMode | string): string =>
  cat === 'divisions' && isProPack(mode) ? 'cat_divisionsPro' : CATEGORY_KEY[cat];

export { FEATURE_TYPE, featureTypeLabel, featureTypeEmoji } from '@/lib/featureTypes';

const TIER_FILL: Record<Difficulty, Difficulty[]> = {
  basic: ['easy', 'medium', 'hard'],
  easy: ['basic', 'medium', 'hard'],
  medium: ['easy', 'hard', 'basic'],
  hard: ['medium', 'easy', 'basic'],
};

function rngFor(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}
function shuffle<T>(list: T[], rng: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Ítems al azar del nivel pedido dentro de un catálogo; si la región no tiene suficientes de ese nivel, completa con los vecinos */
function pickFromPool(pool: City[], difficulty: Difficulty, count: number, seed?: number): City[] {
  const rng = rngFor(seed);
  let picked = shuffle(pool.filter((f) => f.difficulty === difficulty), rng);
  for (const tier of TIER_FILL[difficulty]) {
    if (picked.length >= count) break;
    picked = picked.concat(shuffle(pool.filter((f) => f.difficulty === tier), rng));
  }
  return picked.slice(0, count);
}

/**
 * Ítems de un catálogo para una región: en un pack, los que declaran ese pack (con el nivel que tienen ahí); en el
 * mundo y los continentes, los que no son exclusivos de un pack.
 */
function byMode(items: City[], mode: GameMode): City[] {
  if (isProPack(mode)) {
    // Packs Pro: los lugares y monumentos del catálogo (no exclusivos de otro pack) que están en sus países, con su nivel del mundo
    const isos = new Set(PRO_PACK_META[mode as keyof typeof PRO_PACK_META].isos);
    return items.filter((f) => !f.packOnly && ((f.isos ?? []).some((i) => isos.has(i)) || isos.has(countryIso(f.country) ?? '')));
  }
  if (isPackMode(mode)) return items.filter((f) => f.packs?.[mode]).map((f) => ({ ...f, difficulty: f.packs![mode]! }));
  return items.filter((f) => !f.packOnly && (mode === 'world' || f.region === mode));
}

/** Ciudades de una región (en los packs Pro vienen de proPackCatalog.ts) */
const packCities = (mode: GameMode): City[] => (isProPack(mode) ? PRO_PACK_CITIES.filter((c) => c.region === mode) : getCitiesByMode(mode));

/** Todos los ítems de una categoría en una región (para elegir y para saber si alcanza para una partida) */
function poolForCategory(cat: Category, mode: GameMode): City[] {
  if (cat === 'flags') return flagsByMode(mode);
  if (cat === 'features') return featuresByMode(mode);
  if (cat === 'monuments') return landmarksByMode(mode);
  if (cat === 'divisions') return divisionsByMode(mode);
  return packCities(mode);
}

/** Banderas de una región (world = todas, incluida Oceanía) */
export const flagsByMode = (mode: GameMode): City[] => FLAG_ITEMS.filter((f) => mode === 'world' || f.region === mode);
/** Lugares geográficos de una región (world = todos los que no son exclusivos de un pack) */
export const featuresByMode = (mode: GameMode): City[] => byMode(FEATURE_ITEMS, mode);
/** Monumentos de una región */
export const landmarksByMode = (mode: GameMode): City[] => byMode(LANDMARK_ITEMS, mode);
/** Divisiones (departamentos) de un pack */
export const divisionsByMode = (mode: GameMode): City[] =>
  mode === 'colombia' ? COLOMBIA_DIVISIONS : isProPack(mode) ? PRO_PACK_DIVISIONS.filter((d) => d.region === mode) : [];

export function getRandomFlags(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(flagsByMode(mode), difficulty, count, seed);
}
export function getRandomFeatures(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(featuresByMode(mode), difficulty, count, seed);
}
export function getRandomLandmarks(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(landmarksByMode(mode), difficulty, count, seed);
}

/** Ítems al azar de la categoría (misma semilla → misma lista, como getRandomCities) */
export function getRandomItems(category: Category, difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  const cat = categoryForMode(category, mode);
  // Los contornos se descargan aparte: que estén listos antes del primer toque (la cuenta regresiva da tiempo)
  if (cat === 'features') loadFeatureShapes().catch(() => {});
  if (isPackMode(mode)) loadPackShapes(mode).catch(() => {});
  if (cat === 'flags') return getRandomFlags(difficulty, count, mode, seed);
  if (cat === 'features') return getRandomFeatures(difficulty, count, mode, seed);
  if (cat === 'monuments') return getRandomLandmarks(difficulty, count, mode, seed);
  if (cat === 'divisions') return pickFromPool(divisionsByMode(mode), difficulty, count, seed);
  // Ciudades de un pack: con relleno por niveles vecinos (el catálogo del mundo tiene sus propias listas por región)
  if (isPackMode(mode)) return pickFromPool(packCities(mode), difficulty, count, seed);
  return getRandomCities(difficulty, count, mode, seed);
}

/** Categoría de una lista de ítems ya elegida ("Otra vez", revancha) */
export const categoryOf = (items: Pick<City, 'kind'>[]): Category =>
  items.some(isDivision) ? 'divisions' : items.some(isMonument) ? 'monuments' : items.some(isFeature) ? 'features' : items.some(isFlag) ? 'flags' : 'cities';

/** Todos los ítems de los catálogos, por id (memoria de lugares, filas del servidor) */
let catalogIndex: Map<string, City> | null = null;
export function catalogItem(id: string | null | undefined): City | undefined {
  if (!id) return undefined;
  if (!catalogIndex) {
    catalogIndex = new Map();
    for (const list of [FLAG_ITEMS, FEATURE_ITEMS, LANDMARK_ITEMS, COLOMBIA_CITIES, COLOMBIA_DIVISIONS, PRO_PACK_CITIES, PRO_PACK_DIVISIONS]) for (const it of list) if (it.id) catalogIndex.set(it.id, it);
  }
  return catalogIndex.get(id);
}

/**
 * Ítem de una fila del servidor: `flag:XX` marca una bandera, `feat:<slug>` un lugar, `mon:<slug>` un monumento,
 * `co:<slug>` un municipio y `div:co-<slug>` un departamento de Colombia. Devuelve los campos que no viajan en la fila.
 */
export function kindFromPlaceId(placeId: string | null | undefined): Partial<City> {
  if (!placeId) return {};
  if (placeId.startsWith('flag:')) return { id: placeId, kind: 'flag', iso: placeId.slice(5) };
  const it = catalogItem(placeId);
  if (placeId.startsWith('feat:')) return it ? { id: placeId, kind: 'feature', ftype: it.ftype, geom: it.geom, nameEn: it.nameEn, isos: it.isos, region: it.region } : { id: placeId, kind: 'feature' };
  if (placeId.startsWith('mon:')) return it ? { id: placeId, kind: 'monument', nameEn: it.nameEn, city: it.city, photo: it.photo, region: it.region } : { id: placeId, kind: 'monument' };
  if (placeId.startsWith('div:')) return it ? { id: placeId, kind: 'division', geom: 'area', ftype: it.ftype, nameEn: it.nameEn, capital: it.capital, nb: it.nb, region: it.region } : { id: placeId, kind: 'division', geom: 'area' };
  if (placeId.startsWith('co:') || placeId.startsWith('ci:')) return it ? { id: placeId, admin: it.admin, isCapital: it.isCapital, region: it.region } : { id: placeId };
  return { id: placeId };
}

/** Nombre a mostrar: el de la ciudad, el país en el idioma del juego para una bandera, o el lugar/monumento/departamento (ES/EN) */
export const itemTitle = (item: Pick<City, 'name' | 'kind' | 'nameEn'>, locale: string): string =>
  isFlag(item) ? countryDisplayName(item.name, locale) : (isFeature(item) || isMonument(item) || isDivision(item)) && locale === 'en' && item.nameEn ? item.nameEn : item.name;

/**
 * Segunda línea: el país de la ciudad (o "departamento · país" en un pack), el continente de la bandera,
 * "tipo · continente" del lugar, "ciudad · país" del monumento o "Departamento · Colombia".
 */
export const itemSubtitle = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype' | 'city' | 'admin'>, locale: string): string => {
  const lang = locale === 'en' ? 'en' : 'es';
  const country = lang === 'en' ? countryDisplayName(item.country, 'en') : item.country;
  if (isFlag(item)) return continentName(item.lat, item.lon, lang);
  if (isDivision(item)) return `${featureTypeLabel(item.ftype, lang)} · ${country}`;
  if (isFeature(item)) return `${featureTypeLabel(item.ftype, lang)} · ${continentName(item.lat, item.lon, lang)}`;
  if (isMonument(item)) return item.city && item.city !== country ? `${item.city} · ${country}` : country;
  if (item.admin && item.admin !== item.country) return `${item.admin} · ${country}`;
  return item.country;
};

const appLang = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es');
/** Igual que itemTitle / itemSubtitle con el idioma del juego (<html lang>, que I18nProvider mantiene al día) */
export const itemTitleAuto = (item: Pick<City, 'name' | 'kind' | 'nameEn'>) => itemTitle(item, appLang());
export const itemSubtitleAuto = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype' | 'city' | 'admin'>) => itemSubtitle(item, appLang());

/** Imagen de la bandera de un ítem (banderas: por ISO; ciudades, monumentos y departamentos: la de su país; lugares: ninguna) */
export const itemFlagUrl = (item: Pick<City, 'iso' | 'country' | 'kind'>): string | null =>
  item.iso ? `/flags/${item.iso}.svg` : isFeature(item) ? null : flagUrl(item.country);

/** Foto que acompaña al ítem: la del monumento si la tiene; si no, la de su país (ciudades, banderas). null = ninguna */
export const itemPhotoUrl = (item: Pick<City, 'id' | 'kind' | 'country' | 'photo'>, size: PhotoSize = 'lg'): string | null =>
  isMonument(item) ? landmarkPhotoUrl(item, size) : isFeature(item) || !hasCountryPhoto(item.country) ? null : countryPhotoUrl(item.country, size);
