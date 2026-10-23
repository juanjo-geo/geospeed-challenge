/**
 * Categorías del juego (Fase 6): qué se ubica en el mapa. Ciudades, banderas y lugares geográficos; los
 * monumentos vendrán después. Un ítem de cualquier categoría tiene la forma de `City` (kind lo distingue), así
 * que la partida, la revisión y la memoria de lugares no cambian de tipo.
 *
 * Decisiones de JuanJo (2026-10-22): las categorías nuevas van en Clásico, Entrenamiento y Retos (el Diario y
 * el Sprint siguen con ciudades); banderas y lugares se puntúan por distancia al contorno (src/lib/flagScoring.ts,
 * src/lib/featureScoring.ts).
 */
import { getRandomCities, type City, type Difficulty, type GameMode } from '@/data/cities';
import { FLAG_ITEMS } from '@/data/flagCatalog';
import { FEATURE_ITEMS } from '@/data/featureCatalog';
import { LANDMARK_ITEMS } from '@/data/landmarkCatalog';
import { countryDisplayName, flagUrl } from '@/lib/flags';
import { continentName } from '@/lib/cityHints';
import { featureTypeLabel } from '@/lib/featureTypes';
import { loadFeatureShapes } from '@/lib/featureScoring';
import { countryPhotoUrl, hasCountryPhoto, type PhotoSize } from '@/lib/countryPhotos';
import { landmarkPhotoUrl } from '@/lib/landmarkPhotos';

export type Category = 'cities' | 'flags' | 'features' | 'monuments';
export const CATEGORIES: Category[] = ['cities', 'flags', 'features', 'monuments'];
export const isCategory = (v: unknown): v is Category => v === 'cities' || v === 'flags' || v === 'features' || v === 'monuments';
export const isFlag = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'flag';
export const isFeature = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'feature';
export const isMonument = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'monument';
/** Ítems que se muestran con un nombre propio (no "¿Dónde está? ciudad"): título y subtítulo vienen de itemTitle/itemSubtitle */
export const isSpecial = (item: Pick<City, 'kind'> | null | undefined) => isFlag(item) || isFeature(item) || isMonument(item);
/** Banderas y lugares: la respuesta se mide a un contorno (dentro = 0 km) o a un trazo, no a un punto */
export const hasShape = (item: Pick<City, 'kind' | 'geom'> | null | undefined) => isFlag(item) || (isFeature(item) && item?.geom !== 'point');

/** Emoji e ilustración compuesta de cada categoría (hojas de selección, como REGION_ART / DIFF_ART) */
export const CATEGORY_ART: Record<Category, { emoji: string; art: [string, string?] }> = {
  cities: { emoji: '🏙️', art: ['🏙️', '📍'] },
  flags: { emoji: '🚩', art: ['🚩', '🗺️'] },
  features: { emoji: '🏔️', art: ['🏔️', '🌊'] },
  monuments: { emoji: '🗼', art: ['🗼', '📸'] },
};

/** Clave i18n del nombre de la categoría */
export const CATEGORY_KEY: Record<Category, string> = { cities: 'cat_cities', flags: 'cat_flags', features: 'cat_features', monuments: 'cat_monuments' };

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

/** Banderas de una región (world = todas, incluida Oceanía) */
export const flagsByMode = (mode: GameMode): City[] => FLAG_ITEMS.filter((f) => mode === 'world' || f.region === mode);
/** Lugares geográficos de una región (world = todos) */
export const featuresByMode = (mode: GameMode): City[] => FEATURE_ITEMS.filter((f) => mode === 'world' || f.region === mode);

export function getRandomFlags(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(flagsByMode(mode), difficulty, count, seed);
}
export function getRandomFeatures(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(featuresByMode(mode), difficulty, count, seed);
}
/** Monumentos de una región (world = todos) */
export const landmarksByMode = (mode: GameMode): City[] => LANDMARK_ITEMS.filter((f) => mode === 'world' || f.region === mode);
export function getRandomLandmarks(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return pickFromPool(landmarksByMode(mode), difficulty, count, seed);
}

/** Ítems al azar de la categoría (misma semilla → misma lista, como getRandomCities) */
export function getRandomItems(category: Category, difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  if (category === 'flags') return getRandomFlags(difficulty, count, mode, seed);
  if (category === 'features') {
    // Los contornos se descargan aparte: que estén listos antes del primer toque (la cuenta regresiva da tiempo)
    loadFeatureShapes().catch(() => {});
    return getRandomFeatures(difficulty, count, mode, seed);
  }
  if (category === 'monuments') return getRandomLandmarks(difficulty, count, mode, seed);
  return getRandomCities(difficulty, count, mode, seed);
}

/** Categoría de una lista de ítems ya elegida ("Otra vez", revancha) */
export const categoryOf = (items: Pick<City, 'kind'>[]): Category =>
  items.some(isMonument) ? 'monuments' : items.some(isFeature) ? 'features' : items.some(isFlag) ? 'flags' : 'cities';

/** Ítem de una fila del servidor: `flag:XX` marca una bandera, `feat:<slug>` un lugar geográfico y `mon:<slug>` un monumento */
export function kindFromPlaceId(placeId: string | null | undefined): Partial<City> {
  if (placeId && placeId.startsWith('flag:')) return { id: placeId, kind: 'flag', iso: placeId.slice(5) };
  if (placeId && placeId.startsWith('feat:')) {
    const it = FEATURE_ITEMS.find((f) => f.id === placeId);
    return it ? { id: placeId, kind: 'feature', ftype: it.ftype, geom: it.geom, nameEn: it.nameEn, isos: it.isos, region: it.region } : { id: placeId, kind: 'feature' };
  }
  if (placeId && placeId.startsWith('mon:')) {
    const it = LANDMARK_ITEMS.find((f) => f.id === placeId);
    return it ? { id: placeId, kind: 'monument', nameEn: it.nameEn, city: it.city, photo: it.photo, region: it.region } : { id: placeId, kind: 'monument' };
  }
  return placeId ? { id: placeId } : {};
}

/** Nombre a mostrar: el de la ciudad, el país en el idioma del juego para una bandera, o el lugar/monumento (ES/EN) */
export const itemTitle = (item: Pick<City, 'name' | 'kind' | 'nameEn'>, locale: string): string =>
  isFlag(item) ? countryDisplayName(item.name, locale) : (isFeature(item) || isMonument(item)) && locale === 'en' && item.nameEn ? item.nameEn : item.name;

/** Segunda línea: el país de la ciudad, el continente de la bandera, "tipo · continente" del lugar, o "ciudad · país" del monumento */
export const itemSubtitle = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype' | 'city'>, locale: string): string => {
  const lang = locale === 'en' ? 'en' : 'es';
  if (isFlag(item)) return continentName(item.lat, item.lon, lang);
  if (isFeature(item)) return `${featureTypeLabel(item.ftype, lang)} · ${continentName(item.lat, item.lon, lang)}`;
  if (isMonument(item)) {
    const country = lang === 'en' ? countryDisplayName(item.country, 'en') : item.country;
    return item.city && item.city !== country ? `${item.city} · ${country}` : country;
  }
  return item.country;
};

const appLang = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es');
/** Igual que itemTitle / itemSubtitle con el idioma del juego (<html lang>, que I18nProvider mantiene al día) */
export const itemTitleAuto = (item: Pick<City, 'name' | 'kind' | 'nameEn'>) => itemTitle(item, appLang());
export const itemSubtitleAuto = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype' | 'city'>) => itemSubtitle(item, appLang());

/** Imagen de la bandera de un ítem (banderas: por ISO; ciudades y monumentos: la de su país; lugares: ninguna) */
export const itemFlagUrl = (item: Pick<City, 'iso' | 'country' | 'kind'>): string | null =>
  item.iso ? `/flags/${item.iso}.svg` : isFeature(item) ? null : flagUrl(item.country);

/** Foto que acompaña al ítem: la del monumento si la tiene; si no, la de su país (ciudades, banderas). null = ninguna */
export const itemPhotoUrl = (item: Pick<City, 'id' | 'kind' | 'country' | 'photo'>, size: PhotoSize = 'lg'): string | null =>
  isMonument(item) ? landmarkPhotoUrl(item, size) : isFeature(item) || !hasCountryPhoto(item.country) ? null : countryPhotoUrl(item.country, size);
