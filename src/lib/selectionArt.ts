import { isPackMode, type Difficulty, type GameMode } from '@/data/cities';
import type { SelectorGroup } from '@/components/game/SelectorSheet';

/**
 * Emoji e ilustración compuesta de cada región y dificultad (hojas de selección, maquetas Región /
 * Dificultad). Compartido por el Inicio y "Crea un reto".
 */
export const REGION_ART: Record<GameMode, { emoji: string; art: [string, string?] }> = {
  world:    { emoji: '🌍', art: ['🌍'] },
  europe:   { emoji: '🏰', art: ['🗼', '🏛️'] },
  asia:     { emoji: '⛩️', art: ['🗻', '⛩️'] },
  americas: { emoji: '🗽', art: ['🗽', '🌴'] },
  africa:   { emoji: '🏜️', art: ['🐪', '🌳'] },
  // Pack Colombia (Fase 7a): la bandera se dibuja como imagen donde hay espacio (los emojis de bandera no se ven en Windows)
  colombia: { emoji: '☕', art: ['🦜', '☕'] },
  // Packs Pro (Fase 7b)
  andes:    { emoji: '🦙', art: ['🏔️', '🦙'] },
  conosur:  { emoji: '🧉', art: ['🐧', '🧉'] },
  mexcam:   { emoji: '🌮', art: ['🌋', '🌮'] },
  caribe:   { emoji: '🏝️', art: ['🏝️', '🌴'] },
};

/** Regiones que se muestran con la bandera (imagen SVG) en vez del emoji: los packs de país */
export const REGION_FLAG: Partial<Record<GameMode, string>> = { colombia: '/flags/CO.svg' };

/** Hojas de región (Inicio, Historial, Ranking): Colombia y los packs Pro van juntos en una fila "Packs de países"
 *  para que la lista no sea tan larga. `regionGroup(mode)` va en cada opción y `packGroups(t)` en la hoja. */
export const regionGroup = (mode: string): string | undefined => (isPackMode(mode) ? 'packs' : undefined);
export const packGroups = (t: (key: never) => string): Record<string, SelectorGroup> => ({
  packs: { label: t('region_packsGroup' as never), desc: t('region_packsGroupDesc' as never), emoji: '🧭', art: ['🗺️', '🧭'], backLabel: t('region_backToAll' as never) },
});

export const DIFF_ART: Record<Difficulty, { emoji: string; art: [string, string?] }> = {
  basic:  { emoji: '🎒', art: ['🌍', '🎒'] },
  easy:   { emoji: '🧭', art: ['🧭'] },
  medium: { emoji: '⚡', art: ['🗺️', '⚡'] },
  hard:   { emoji: '🔥', art: ['🔥'] },
};

export const DIFF_ORDER: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];

/** Nivel del jugador que desbloquea cada región y dificultad (decisión D12: se muestran con candado) */
export const REGION_UNLOCK_LEVEL: Record<GameMode, number> = {
  world: 1, europe: 2, asia: 3, americas: 4, africa: 5,
  // Packs: Colombia es gratis; los Pro no tienen nivel (sin Pro, una partida de prueba al día, src/lib/packAccess.ts)
  colombia: 1, andes: 1, conosur: 1, mexcam: 1, caribe: 1,
};
export const DIFF_UNLOCK_LEVEL: Record<Difficulty, number> = { basic: 1, easy: 2, medium: 4, hard: 6 };
/** Nivel que pide un mapa (región × dificultad) */
export const mapUnlockLevel = (mode: GameMode, difficulty: Difficulty) => Math.max(REGION_UNLOCK_LEVEL[mode] ?? 1, DIFF_UNLOCK_LEVEL[difficulty] ?? 1);
