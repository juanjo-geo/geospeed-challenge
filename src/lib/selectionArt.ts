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
