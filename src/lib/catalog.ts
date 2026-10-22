/**
 * Categorías del juego (Fase 6): qué se ubica en el mapa. Hoy ciudades y banderas; lugares geográficos y
 * monumentos vendrán después. Un ítem de cualquier categoría tiene la forma de `City` (kind lo distingue), así
 * que la partida, la revisión y la memoria de lugares no cambian de tipo.
 *
 * Decisiones de JuanJo (2026-10-22): las categorías nuevas van en Clásico, Entrenamiento y Retos (el Diario y
 * el Sprint siguen con ciudades); las banderas se puntúan por distancia al país (src/lib/flagScoring.ts).
 */
import { getRandomCities, type City, type Difficulty, type GameMode } from '@/data/cities';
import { FLAG_ITEMS } from '@/data/flagCatalog';
import { countryDisplayName, flagUrl } from '@/lib/flags';
import { continentName } from '@/lib/cityHints';

export type Category = 'cities' | 'flags';
export const CATEGORIES: Category[] = ['cities', 'flags'];
export const isCategory = (v: unknown): v is Category => v === 'cities' || v === 'flags';
export const isFlag = (item: Pick<City, 'kind'> | null | undefined) => item?.kind === 'flag';

/** Emoji e ilustración compuesta de cada categoría (hojas de selección, como REGION_ART / DIFF_ART) */
export const CATEGORY_ART: Record<Category, { emoji: string; art: [string, string?] }> = {
  cities: { emoji: '🏙️', art: ['🏙️', '📍'] },
  flags: { emoji: '🚩', art: ['🚩', '🗺️'] },
};

/** Clave i18n del nombre de la categoría */
export const CATEGORY_KEY: Record<Category, string> = { cities: 'cat_cities', flags: 'cat_flags' };

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

/** Banderas de una región (world = todas, incluida Oceanía) */
export const flagsByMode = (mode: GameMode): City[] => FLAG_ITEMS.filter((f) => mode === 'world' || f.region === mode);

/** Banderas al azar del nivel pedido; si la región no tiene suficientes de ese nivel, completa con los vecinos */
export function getRandomFlags(difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  const rng = rngFor(seed);
  const pool = flagsByMode(mode);
  let picked = shuffle(pool.filter((f) => f.difficulty === difficulty), rng);
  for (const tier of TIER_FILL[difficulty]) {
    if (picked.length >= count) break;
    picked = picked.concat(shuffle(pool.filter((f) => f.difficulty === tier), rng));
  }
  return picked.slice(0, count);
}

/** Ítems al azar de la categoría (misma semilla → misma lista, como getRandomCities) */
export function getRandomItems(category: Category, difficulty: Difficulty, count: number, mode: GameMode = 'world', seed?: number): City[] {
  return category === 'flags' ? getRandomFlags(difficulty, count, mode, seed) : getRandomCities(difficulty, count, mode, seed);
}

/** Categoría de una lista de ítems ya elegida ("Otra vez", revancha) */
export const categoryOf = (items: Pick<City, 'kind'>[]): Category => (items.some(isFlag) ? 'flags' : 'cities');

/** Ítem de una fila del servidor: el id de lugar `flag:XX` marca una bandera */
export function kindFromPlaceId(placeId: string | null | undefined): Pick<City, 'kind' | 'iso' | 'id'> {
  if (placeId && placeId.startsWith('flag:')) return { id: placeId, kind: 'flag', iso: placeId.slice(5) };
  return placeId ? { id: placeId } : {};
}

/** Nombre a mostrar: el de la ciudad, o el país en el idioma del juego para una bandera */
export const itemTitle = (item: Pick<City, 'name' | 'kind'>, locale: string): string =>
  isFlag(item) ? countryDisplayName(item.name, locale) : item.name;

/** Segunda línea: el país de la ciudad, o el continente de la bandera */
export const itemSubtitle = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon'>, locale: string): string =>
  isFlag(item) ? continentName(item.lat, item.lon, locale === 'en' ? 'en' : 'es') : item.country;

const appLang = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'es');
/** Igual que itemTitle / itemSubtitle con el idioma del juego (<html lang>, que I18nProvider mantiene al día) */
export const itemTitleAuto = (item: Pick<City, 'name' | 'kind'>) => itemTitle(item, appLang());
export const itemSubtitleAuto = (item: Pick<City, 'country' | 'kind' | 'lat' | 'lon'>) => itemSubtitle(item, appLang());

/** Imagen de la bandera de un ítem (banderas: por ISO; ciudades: la de su país) */
export const itemFlagUrl = (item: Pick<City, 'iso' | 'country'>): string | null =>
  item.iso ? `/flags/${item.iso}.svg` : flagUrl(item.country);
