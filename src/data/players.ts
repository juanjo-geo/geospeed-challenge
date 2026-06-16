import type { Difficulty } from './cities';

/**
 * Módulo "Desafío Mundial" — base de datos de jugadores.
 *
 * El jugador debe ubicar en el mapa el PAÍS DE ORIGEN del futbolista.
 * Se muestra SOLO el nombre en texto (sin fotos, escudos ni marcas) → 100% seguro legalmente.
 *
 * IMPORTANTE: `country` debe coincidir EXACTAMENTE con un `name` de `countries.ts`
 * (nombres en inglés estilo Natural Earth) para poder resaltar y evaluar el territorio.
 * Nota: el dataset agrupa todo el Reino Unido como "United Kingdom" (no existe England/Wales
 * por separado), y usa "United States of America", "Côte d'Ivoire", "Bosnia and Herz.", etc.
 *
 * Clasificación por FAMA / qué tan obvio es el país, NO por geografía:
 *   basic  🌍 Turista  — íconos globales que casi todos ubican
 *   easy   🧭 Rookie   — muy conocidos, país relativamente claro
 *   medium ⚡ Crack    — requiere saber su origen específico
 *   hard   🔥 Leyenda  — selecciones menos mediáticas, leyendas o país sorprendente
 */
export interface Player {
  /** Nombre mostrado en texto. NO se traduce (nombre propio). */
  name: string;
  /** País de origen — debe matchear un name de countries.ts. */
  country: string;
  difficulty: Difficulty;
  /** Opcional: pista corta sin datos licenciados (ej. "Delantero · 2000s"). */
  hint?: string;
  era?: 'historico' | 'actual';
}

export const worldChallengePlayers: Player[] = [
  // ====================== BASIC 🌍 Turista (20) ======================
  { name: 'Lionel Messi', country: 'Argentina', difficulty: 'basic', era: 'actual' },
  { name: 'Cristiano Ronaldo', country: 'Portugal', difficulty: 'basic', era: 'actual' },
  { name: 'Pelé', country: 'Brazil', difficulty: 'basic', era: 'historico' },
  { name: 'Diego Maradona', country: 'Argentina', difficulty: 'basic', era: 'historico' },
  { name: 'Kylian Mbappé', country: 'France', difficulty: 'basic', era: 'actual' },
  { name: 'Neymar', country: 'Brazil', difficulty: 'basic', era: 'actual' },
  { name: 'Ronaldinho', country: 'Brazil', difficulty: 'basic', era: 'historico' },
  { name: 'Zinedine Zidane', country: 'France', difficulty: 'basic', era: 'historico' },
  { name: 'David Beckham', country: 'United Kingdom', difficulty: 'basic', era: 'historico' },
  { name: 'Ronaldo Nazário', country: 'Brazil', difficulty: 'basic', era: 'historico' },
  { name: 'Andrés Iniesta', country: 'Spain', difficulty: 'basic', era: 'historico' },
  { name: 'Sergio Ramos', country: 'Spain', difficulty: 'basic', era: 'actual' },
  { name: 'Robert Lewandowski', country: 'Poland', difficulty: 'basic', era: 'actual' },
  { name: 'Erling Haaland', country: 'Norway', difficulty: 'basic', era: 'actual' },
  { name: 'Luka Modrić', country: 'Croatia', difficulty: 'basic', era: 'actual' },
  { name: 'Mohamed Salah', country: 'Egypt', difficulty: 'basic', era: 'actual' },
  { name: 'Manuel Neuer', country: 'Germany', difficulty: 'basic', era: 'actual' },
  { name: 'Karim Benzema', country: 'France', difficulty: 'basic', era: 'actual' },
  { name: 'Luis Suárez', country: 'Uruguay', difficulty: 'basic', era: 'actual' },
  { name: 'Gareth Bale', country: 'United Kingdom', difficulty: 'basic', era: 'actual' },

  // ====================== EASY 🧭 Rookie (20) ======================
  { name: 'Vinícius Júnior', country: 'Brazil', difficulty: 'easy', era: 'actual' },
  { name: 'Harry Kane', country: 'United Kingdom', difficulty: 'easy', era: 'actual' },
  { name: 'Kevin De Bruyne', country: 'Belgium', difficulty: 'easy', era: 'actual' },
  { name: 'Virgil van Dijk', country: 'Netherlands', difficulty: 'easy', era: 'actual' },
  { name: 'Toni Kroos', country: 'Germany', difficulty: 'easy', era: 'actual' },
  { name: 'Thomas Müller', country: 'Germany', difficulty: 'easy', era: 'actual' },
  { name: 'Antoine Griezmann', country: 'France', difficulty: 'easy', era: 'actual' },
  { name: 'Sergio Agüero', country: 'Argentina', difficulty: 'easy', era: 'historico' },
  { name: 'Ángel Di María', country: 'Argentina', difficulty: 'easy', era: 'actual' },
  { name: 'Gerard Piqué', country: 'Spain', difficulty: 'easy', era: 'historico' },
  { name: 'Zlatan Ibrahimović', country: 'Sweden', difficulty: 'easy', era: 'historico' },
  { name: 'Eden Hazard', country: 'Belgium', difficulty: 'easy', era: 'historico' },
  { name: 'Paul Pogba', country: 'France', difficulty: 'easy', era: 'actual' },
  { name: 'Marcelo', country: 'Brazil', difficulty: 'easy', era: 'historico' },
  { name: 'James Rodríguez', country: 'Colombia', difficulty: 'easy', era: 'actual' },
  { name: 'Radamel Falcao', country: 'Colombia', difficulty: 'easy', era: 'actual' },
  { name: 'Arturo Vidal', country: 'Chile', difficulty: 'easy', era: 'actual' },
  { name: 'Alexis Sánchez', country: 'Chile', difficulty: 'easy', era: 'actual' },
  { name: 'Edinson Cavani', country: 'Uruguay', difficulty: 'easy', era: 'actual' },
  { name: 'Andrea Pirlo', country: 'Italy', difficulty: 'easy', era: 'historico' },

  // ====================== MEDIUM ⚡ Crack (20) ======================
  { name: 'Heung-min Son', country: 'South Korea', difficulty: 'medium', era: 'actual' },
  { name: 'Sadio Mané', country: 'Senegal', difficulty: 'medium', era: 'actual' },
  { name: 'Riyad Mahrez', country: 'Algeria', difficulty: 'medium', era: 'actual' },
  { name: 'Achraf Hakimi', country: 'Morocco', difficulty: 'medium', era: 'actual' },
  { name: 'Khvicha Kvaratskhelia', country: 'Georgia', difficulty: 'medium', era: 'actual' },
  { name: 'Takefusa Kubo', country: 'Japan', difficulty: 'medium', era: 'actual' },
  { name: 'Aleksandar Mitrović', country: 'Serbia', difficulty: 'medium', era: 'actual' },
  { name: 'Dušan Vlahović', country: 'Serbia', difficulty: 'medium', era: 'actual' },
  { name: 'Wilfried Zaha', country: "Côte d'Ivoire", difficulty: 'medium', era: 'actual' },
  { name: 'Pierre-Emerick Aubameyang', country: 'Gabon', difficulty: 'medium', era: 'actual' },
  { name: 'Thomas Partey', country: 'Ghana', difficulty: 'medium', era: 'actual' },
  { name: 'Mohammed Kudus', country: 'Ghana', difficulty: 'medium', era: 'actual' },
  { name: 'Yassine Bono', country: 'Morocco', difficulty: 'medium', era: 'actual' },
  { name: 'Hirving Lozano', country: 'Mexico', difficulty: 'medium', era: 'actual' },
  { name: 'Christian Pulisic', country: 'United States of America', difficulty: 'medium', era: 'actual' },
  { name: 'Alphonso Davies', country: 'Canada', difficulty: 'medium', era: 'actual' },
  { name: 'Miguel Almirón', country: 'Paraguay', difficulty: 'medium', era: 'actual' },
  { name: 'Luis Díaz', country: 'Colombia', difficulty: 'medium', era: 'actual' },
  { name: 'Darwin Núñez', country: 'Uruguay', difficulty: 'medium', era: 'actual' },
  { name: 'Granit Xhaka', country: 'Switzerland', difficulty: 'medium', era: 'actual' },

  // ====================== HARD 🔥 Leyenda (20) ======================
  { name: 'George Weah', country: 'Liberia', difficulty: 'hard', era: 'historico' },
  { name: 'Didier Drogba', country: "Côte d'Ivoire", difficulty: 'hard', era: 'historico' },
  { name: "Samuel Eto'o", country: 'Cameroon', difficulty: 'hard', era: 'historico' },
  { name: 'Roger Milla', country: 'Cameroon', difficulty: 'hard', era: 'historico' },
  { name: 'Jay-Jay Okocha', country: 'Nigeria', difficulty: 'hard', era: 'historico' },
  { name: 'Nwankwo Kanu', country: 'Nigeria', difficulty: 'hard', era: 'historico' },
  { name: 'El Hadji Diouf', country: 'Senegal', difficulty: 'hard', era: 'historico' },
  { name: 'Asamoah Gyan', country: 'Ghana', difficulty: 'hard', era: 'historico' },
  { name: 'Hristo Stoichkov', country: 'Bulgaria', difficulty: 'hard', era: 'historico' },
  { name: 'Gheorghe Hagi', country: 'Romania', difficulty: 'hard', era: 'historico' },
  { name: 'Pavel Nedvěd', country: 'Czechia', difficulty: 'hard', era: 'historico' },
  { name: 'Hakan Şükür', country: 'Turkey', difficulty: 'hard', era: 'historico' },
  { name: 'Ali Daei', country: 'Iran', difficulty: 'hard', era: 'historico' },
  { name: 'Park Ji-sung', country: 'South Korea', difficulty: 'hard', era: 'historico' },
  { name: 'Hidetoshi Nakata', country: 'Japan', difficulty: 'hard', era: 'historico' },
  { name: 'Enner Valencia', country: 'Ecuador', difficulty: 'hard', era: 'actual' },
  { name: 'Iván Zamorano', country: 'Chile', difficulty: 'hard', era: 'historico' },
  { name: 'Salif Keïta', country: 'Mali', difficulty: 'hard', era: 'historico' },
  { name: 'George Best', country: 'United Kingdom', difficulty: 'hard', era: 'historico' },
  { name: 'Mohamed Aboutrika', country: 'Egypt', difficulty: 'hard', era: 'historico' },
];

/** Jugadores filtrados por dificultad (igual patrón que cities.ts). */
export function getPlayersByDifficulty(difficulty: Difficulty): Player[] {
  return worldChallengePlayers.filter((p) => p.difficulty === difficulty);
}
