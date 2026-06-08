/**
 * Traducciones de contenido del juego (niveles, badges, cosméticos, rarezas, Battle Pass).
 *
 * Estos textos viven en estructuras de datos (levelSystem, cosmetics) que originalmente
 * estaban solo en español. En vez de duplicar las estructuras, mapeamos por ID/clave
 * estable → texto por idioma. Si no hay traducción, se devuelve el fallback en español.
 */

import type { Locale } from '@/i18n';

type Bilingual = { es: string; en: string };

function pick(map: Bilingual | undefined, fallback: string, locale: Locale): string {
  if (!map) return fallback;
  return locale === 'en' ? map.en : map.es;
}

// ── Títulos de nivel (por título español estable, que es la "clave" en LEVELS) ──
const LEVEL_TITLES: Record<string, Bilingual> = {
  'Novato': { es: 'Novato', en: 'Rookie' },
  'Explorador': { es: 'Explorador', en: 'Explorer' },
  'Viajero': { es: 'Viajero', en: 'Traveler' },
  'Navegante': { es: 'Navegante', en: 'Navigator' },
  'Geógrafo': { es: 'Geógrafo', en: 'Geographer' },
  'Cartógrafo': { es: 'Cartógrafo', en: 'Cartographer' },
  'Maestro': { es: 'Maestro', en: 'Master' },
  'Leyenda': { es: 'Leyenda', en: 'Legend' },
  'Oráculo': { es: 'Oráculo', en: 'Oracle' },
  'Deidad Geo': { es: 'Deidad Geo', en: 'Geo Deity' },
};

export function tLevelTitle(title: string, locale: Locale): string {
  return pick(LEVEL_TITLES[title], title, locale);
}

// ── Badges (por id estable) ──
const BADGE_NAMES: Record<string, Bilingual> = {
  first: { es: 'Primera partida', en: 'First Game' },
  ten: { es: 'Veterano', en: 'Veteran' },
  fifty: { es: 'Adicto', en: 'Addict' },
  sniper: { es: 'Francotirador', en: 'Sniper' },
  score5k: { es: 'Aspirante', en: 'Contender' },
  score10k: { es: 'Élite', en: 'Elite' },
  daily: { es: 'Puntual', en: 'Punctual' },
  hard: { es: 'Valiente', en: 'Brave' },
  streak: { es: 'Consistente', en: 'Consistent' },
};

const BADGE_DESCS: Record<string, Bilingual> = {
  first: { es: 'Juega tu primera partida', en: 'Play your first game' },
  ten: { es: 'Juega 10 partidas', en: 'Play 10 games' },
  fifty: { es: 'Juega 50 partidas', en: 'Play 50 games' },
  sniper: { es: 'Dist. promedio < 200 km', en: 'Avg. distance < 200 km' },
  score5k: { es: 'Supera 5,000 pts', en: 'Beat 5,000 pts' },
  score10k: { es: 'Supera 10,000 pts', en: 'Beat 10,000 pts' },
  daily: { es: 'Completa un Desafío Diario', en: 'Complete a Daily Challenge' },
  hard: { es: 'Juega en dificultad Experto', en: 'Play on Expert difficulty' },
  streak: { es: '3 partidas seguidas', en: '3 games in a row' },
};

export function tBadgeName(id: string, fallback: string, locale: Locale): string {
  return pick(BADGE_NAMES[id], fallback, locale);
}
export function tBadgeDesc(id: string, fallback: string, locale: Locale): string {
  return pick(BADGE_DESCS[id], fallback, locale);
}

// ── Rarezas de cosméticos ──
const RARITY: Record<string, Bilingual> = {
  common: { es: 'Común', en: 'Common' },
  rare: { es: 'Raro', en: 'Rare' },
  epic: { es: 'Épico', en: 'Epic' },
  legendary: { es: 'Legendario', en: 'Legendary' },
};

export function tRarity(rarity: string, fallback: string, locale: Locale): string {
  return pick(RARITY[rarity], fallback, locale);
}

// ── Categorías de cosméticos ──
const CATEGORY: Record<string, Bilingual> = {
  pin: { es: '📍 Pins', en: '📍 Pins' },
  trail: { es: '〰️ Estelas', en: '〰️ Trails' },
  frame: { es: '🖼️ Marcos', en: '🖼️ Frames' },
  mapTheme: { es: '🗺️ Mapas', en: '🗺️ Maps' },
};

export function tCategory(cat: string, fallback: string, locale: Locale): string {
  return pick(CATEGORY[cat], fallback, locale);
}

// ── Cosméticos (por id estable): nombre + descripción ──
const COSMETIC_NAMES: Record<string, Bilingual> = {
  pin_classic: { es: 'Clásico', en: 'Classic' },
  pin_gold: { es: 'Oro Puro', en: 'Pure Gold' },
  pin_fire: { es: 'Fuego', en: 'Fire' },
  pin_diamond: { es: 'Diamante', en: 'Diamond' },
  pin_neon: { es: 'Neón', en: 'Neon' },
  pin_ghost: { es: 'Fantasma', en: 'Ghost' },
  trail_classic: { es: 'Clásico', en: 'Classic' },
  trail_rainbow: { es: 'Arcoíris', en: 'Rainbow' },
  trail_lightning: { es: 'Rayo', en: 'Lightning' },
  trail_fire: { es: 'Llama', en: 'Flame' },
  trail_gold: { es: 'Dorado', en: 'Golden' },
  frame_classic: { es: 'Clásico', en: 'Classic' },
  frame_gold: { es: 'Marco Dorado', en: 'Gold Frame' },
  frame_neon: { es: 'Neón', en: 'Neon' },
  frame_fire: { es: 'Inferno', en: 'Inferno' },
  map_neon: { es: 'Neon Velocity', en: 'Neon Velocity' },
  map_vintage: { es: 'Atlas Vintage', en: 'Vintage Atlas' },
  map_ice: { es: 'Glaciar', en: 'Glacier' },
  map_sunset: { es: 'Atardecer', en: 'Sunset' },
};

const COSMETIC_DESCS: Record<string, Bilingual> = {
  pin_classic: { es: 'El pin original de GeoSpeed', en: 'The original GeoSpeed pin' },
  pin_gold: { es: 'Pin de oro brillante', en: 'Shiny gold pin' },
  pin_fire: { es: 'Pin ardiente con aura de fuego', en: 'Burning pin with a fiery aura' },
  pin_diamond: { es: 'Brillo de diamante imposible de ignorar', en: 'Diamond shine impossible to ignore' },
  pin_neon: { es: 'Pin electrizante con resplandor neón', en: 'Electrifying pin with neon glow' },
  pin_ghost: { es: 'Pin translúcido y misterioso', en: 'Translucent, mysterious pin' },
  trail_classic: { es: 'El arco naranja original', en: 'The original orange arc' },
  trail_rainbow: { es: 'Un arco de todos los colores', en: 'An arc of every color' },
  trail_lightning: { es: 'Descarga eléctrica entre los puntos', en: 'Electric discharge between points' },
  trail_fire: { es: 'Estela de fuego ardiente', en: 'Trail of burning fire' },
  trail_gold: { es: 'Estela dorada brillante', en: 'Bright golden trail' },
  frame_classic: { es: 'El marco por defecto', en: 'The default frame' },
  frame_gold: { es: 'Borde dorado premium', en: 'Premium gold border' },
  frame_neon: { es: 'Borde neón brillante', en: 'Bright neon border' },
  frame_fire: { es: 'Borde de fuego animado', en: 'Animated fire border' },
  map_neon: { es: 'El tema original de GeoSpeed', en: 'The original GeoSpeed theme' },
  map_vintage: { es: 'Mapa clásico con tonos tierra', en: 'Classic map with earth tones' },
  map_ice: { es: 'Mundo congelado en tonos azules', en: 'Frozen world in blue tones' },
  map_sunset: { es: 'Cielos púrpura y tierras cálidas', en: 'Purple skies and warm lands' },
};

export function tCosmeticName(id: string, fallback: string, locale: Locale): string {
  return pick(COSMETIC_NAMES[id], fallback, locale);
}
export function tCosmeticDesc(id: string, fallback: string, locale: Locale): string {
  return pick(COSMETIC_DESCS[id], fallback, locale);
}
