import type { Difficulty, GameMode } from '@/data/cities';

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
};

export const DIFF_ART: Record<Difficulty, { emoji: string; art: [string, string?] }> = {
  basic:  { emoji: '🎒', art: ['🌍', '🎒'] },
  easy:   { emoji: '🧭', art: ['🧭'] },
  medium: { emoji: '⚡', art: ['🗺️', '⚡'] },
  hard:   { emoji: '🔥', art: ['🔥'] },
};

export const DIFF_ORDER: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];
