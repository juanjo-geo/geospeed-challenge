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
import { countryDisplayName, flagUrl } from '@/lib/flags';
import { continentName } from '@/lib/cityHints';
import { featureTypeLabel } from '@/lib/featureTypes';
import { loadFeatureShapes } from '@/lib/featureScoring';

export type Category = 'cities' | 'flags' | 'features';
export const CATEGORIES: Category[] = ['cities', 'flags', 'features'];
export const isCategory = (v: unknown): v is Category => v === 'cities' || v === 'flags' || v === 'features';
export const isFlag = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'flag';
export const isFeature = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'feature';
/** Banderas y lugares: la respuesta se mide a un contorno (dentro = 0 km) o a un trazo, no a un punto */
export const hasShape = (item: Pick<City, 'kind' | 'geom'> | null | undefined) => isFlag(item) || (isFeature(item) && item?.geom !== 'point');

/** Emoji e ilustración compuesta de cada categoría (hojas de selección, como REGION_ART / DIFF_ART) */
export const CATEGORY_ART: Record<Category, { emoji: string; art: [string, string?] }> = {
  cities: { emoji: '🏙️', art: ['🏙️', '📍'] },
  flags: { emoji: '🚩', art: ['🚩', '🗺️'] },
  features: { emoji: '🏔️', art: ['🏔️', '🌊'] },
};

/** Clave i18n del nombre de la categoría */
export const CATEGORY_KEY: Record<Category, string> = { cities: 'cat_cities', flags: 'cat_flags', features: 'cat_features' };

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

/** Ítems al azar de la categoría (misma semilla → misma lista, como getRandomCities) */
export function getRandomItems(category: Category, difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  if (category === 'flags') return getRandomFlags(difficulty, count, mode, seed);
  if (category === 'features') {
    // Los contornos se descargan aparte: que estén listos antes del primer toque (la cuenta regresiva da tiempo)
    loadFeatureShapes().catch(() => {});
    return getRandomFeatures(difficulty, count, mode, seed);
  }
  return getRandomCities(difficulty, count, mode, seed);
}

/** Categoría de una lista de ítems ya elegida ("Otra vez", revancha) */
export const categoryOf = (items: Pick<City, 'kind'>[]): Category =>
  items.some(isFeature) ? 'features' : items.some(isFlag) ? 'flags' : 'cities';

/** Ítem de una fila del servidor: el id de lugar `flag:XX` marca una bandera y `feat:<slug>` un lugar geográfico */
export function kindFromPlaceId(placeId: string | null | undefined): Partial<City> {
  if (placeId && placeId.startsWith('flag:')) return { id: placeId, kind: 'flag', iso: placeId.slice(5) };
  if (placeId && placeId.startsWith('feat:')) {
    const it = FEATURE_ITEMS.find((f) => f.id === placeId);
    return it ? { id: placeId, kind: 'feature', ftype: it.ftype, geom: it.geom, nameEn: it.nameEn, isos: it.isos, region: it.region } : { id: placeId, kind: 'feature' };
  }
  return placeId ? { id: placeId } : {};
}

/** Nombre a mostrar: el de la ciudad, el país en el idioma del juego para una bandera, o el lugar (ES/EN) */
export const itemTitle = (item: Pick<City, 'name' | 'kind' | 'nameEn'>, locale: string): string =>
  isFlag(item) ? countryDisplayName(item.name, locale) : isFeature(item) && locale === 'en' && item.nameEn ? item.nameEn : item.name;

/** Segunda línea: el país de la ciudad, el continente de la bandera, o "tipo · continente" del lugar */
export const itemSubtitle = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype'>, locale: string): string => {
  const lang = locale === 'en' ? 'en' : 'es';
  if (isFlag(item)) return continentName(item.lat, item.lon, lang);
  if (isFeature(item)) return `${featureTypeLabel(item.ftype, lang)} · ${continentName(item.lat, item.lon, lang)}`;
  return item.country;
};

const appLang = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es');
/** Igual que itemTitle / itemSubtitle con el idioma del juego (<html lang>, que I18nProvider mantiene al día) */
export const itemTitleAuto = (item: Pick<City, 'name' | 'kind' | 'nameEn'>) => itemTitle(item, appLang());
export const itemSubtitleAuto = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon' | 'ftype'>) => itemSubtitle(item, appLang());

/** Imagen de la bandera de un ítem (banderas: por ISO; ciudades: la de su país; lugares: ninguna) */
export const itemFlagUrl = (item: Pick<City, 'iso' | 'country' | 'kind'>): string | null =>
  item.iso ? `/flags/${item.iso}.svg` : isFeature(item) ? null : flagUrl(item.country);
