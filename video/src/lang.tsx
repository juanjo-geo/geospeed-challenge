/**
 * Idioma del video: textos y grabaciones de cada versión (español e inglés).
 *  - STR: los textos que van por fuera de los teléfonos. Usan las mismas palabras del juego (src/i18n).
 *  - REC: de dónde sale lo que se ve dentro de los teléfonos y en qué cuadro pasa cada cosa. Cada idioma tiene su
 *    propia grabación del juego; las anclas las imprime scripts/prep_frames.py.
 */
import { createContext, useContext } from 'react';

export type Lang = 'es' | 'en';

const es = {
  locale: 'es-CO',
  whereA: '¿Dónde está ', city: 'Katmandú', whereB: '?',
  perfect: '¡PERFECTO!', pts: 'pts', score1: 2191, stat1: '21 km · 1,6 s',
  cap2: ['Más cerca y más rápido = ', 'más puntos'],
  cap3: ['Encadena aciertos y ', 'multiplica'],
  mult: ['×1,5', '×2,0', '×2,5'], comboLabel: ['¡Imparable!', '¡Turbo!', '¡EN LLAMAS!'],
  cats: ['Ciudades,', 'banderas,', 'lugares', 'y monumentos'],
  flagQ: '¿De qué país es?', river: ['Río Nilo', 'Río · África'], machu: ['Machu Picchu', '· Perú'],
  cap5: ['El mundo, cada continente ', 'y Colombia'],
  cap6: ['Un desafío nuevo ', 'cada día'],
  streak: 'días de racha', bubble: ['Diario #189 · 11/13', '¿Me ganas? 😏'],
  cap7: ['Reta a tus amigos', ' o juega con 20'], you: 'Tú',
  tvBadge: ['📡 Sala en vivo', 'Un PIN y todos juegan a la vez'],
  cap8: ['Aprende algo de ', 'cada lugar'],
  photo: 'Katmandú · Nepal', factTitle: '💡 Dato curioso',
  fact: 'Su nombre viene de Kasthamandap, un templo de madera que según la leyenda se construyó con un solo árbol.',
  tagline: ['¿Cuánto conoces ', 'el mundo?'], platforms: 'ANDROID · WEB',
  // Corte vertical
  v1: ['¿La ubicas en', '5 segundos?'], v2: ['¡A 21 km', 'en 1,6 segundos!'], v3: ['Encadena y llega a', '¡EN LLAMAS!'], v4: ['Un desafío nuevo', 'cada día'],
  cta: 'JUEGA GRATIS',
  // Ganchos alternativos del corte vertical (solo cambian los primeros segundos)
  hookB: ['Mi amiga me retó', 'y esto pasó'], hookC: ['Ubiqué 13 ciudades', 'en 30 segundos'],
  rivalDone: '⚡ Valentina ya respondió', citiesWord: 'ciudades',
};
type Strings = typeof es;

const en: Strings = {
  locale: 'en-US',
  whereA: 'Where is ', city: 'Kathmandu', whereB: '?',
  perfect: 'PERFECT!', pts: 'pts', score1: 2206, stat1: '21 km · 1.5 s',
  cap2: ['Closer and faster = ', 'more points'],
  cap3: ['Chain hits and ', 'multiply'],
  mult: ['×1.5', '×2.0', '×2.5'], comboLabel: ['Unstoppable!', 'Turbo!', 'ON FIRE!'],
  cats: ['Cities,', 'flags,', 'places', 'and landmarks'],
  flagQ: 'Which country is it?', river: ['Nile', 'River · Africa'], machu: ['Machu Picchu', '· Peru'],
  cap5: ['The world, every continent ', 'and Colombia'],
  cap6: ['A new challenge ', 'every day'],
  streak: 'day streak', bubble: ['Daily #189 · 11/13', 'Can you beat me? 😏'],
  cap7: ['Challenge your friends', ' or play with 20'], you: 'You',
  tvBadge: ['📡 Live room', 'One PIN, everyone plays at once'],
  cap8: ['Learn something about ', 'every place'],
  photo: 'Kathmandu · Nepal', factTitle: '💡 Fun fact',
  fact: 'Its name comes from Kasthamandap, a wooden temple that legend says was built from a single tree.',
  tagline: ['How well do you know ', 'the world?'], platforms: 'ANDROID · WEB',
  v1: ['Can you find it', 'in 5 seconds?'], v2: ['21 km away', 'in 1.5 seconds!'], v3: ['Chain hits to go', 'ON FIRE!'], v4: ['A new challenge', 'every day'],
  cta: 'PLAY FREE',
  hookB: ['My friend challenged me', 'and this happened'], hookC: ['I found 13 cities', 'in 30 seconds'],
  rivalDone: '⚡ Valentina answered', citiesWord: 'cities',
};
export const STR: Record<Lang, Strings> = { es, en };

export interface Recordings {
  /** Partida clásica (semilla 1012): Katmandú y el combo */
  game: { dir: string; qStart: number; tap1: number; cardWide: number; cardTall: number; hits: [number, number, number]; leave: number };
  /** Pack Colombia: el departamento que salió en la grabación */
  pack: { dir: string; tap: number; lo: number; hi: number; dept: { id: string; name: string; lat: number; lon: number } };
  /** Carrera contra el rival: aviso, toque y la tarjeta de la ronda 2; vs = puntos (yo, rival) tras las rondas 1 y 2 */
  race: { dir: string; raceStart: number; tap: number; raceEnd: number; cardStart: number; cardEnd: number; vs: [[number, number], [number, number]] };
  screens: { daily: string; room: string; story: string };
}
export const REC: Record<Lang, Recordings> = {
  es: {
    game: { dir: 'frames', qStart: 212, tap1: 265, cardWide: 352.5, cardTall: 362, hits: [991, 1175, 1529], leave: 1558 },
    pack: { dir: 'frames_co', tap: 173, lo: 105, hi: 284, dept: { id: 'div:co-antioquia', name: 'Antioquia', lat: 6.92, lon: -75.58 } },
    race: { dir: 'frames_reto', raceStart: 228, tap: 269, raceEnd: 329, cardStart: 592, cardEnd: 641, vs: [[1625, 1603], [4109, 3385]] },
    screens: { daily: 'screens/diario.jpg', room: 'screens/sala-tv.jpg', story: 'screens/resena.jpg' },
  },
  en: {
    game: { dir: 'frames_en', qStart: 209, tap1: 256, cardWide: 347, cardTall: 357, hits: [973, 1143, 1487], leave: 1516 },
    pack: { dir: 'frames_co_en', tap: 172, lo: 112, hi: 217, dept: { id: 'div:co-valle', name: 'Valle del Cauca', lat: 3.87, lon: -76.51 } },
    race: { dir: 'frames_reto_en', raceStart: 232, tap: 274, raceEnd: 332, cardStart: 592, cardEnd: 640, vs: [[1654, 1640], [4138, 3432]] },
    screens: { daily: 'screens/diario-en.jpg', room: 'screens/sala-tv-en.jpg', story: 'screens/resena-en.jpg' },
  },
};

export const getL = (lang: Lang) => ({ lang, t: STR[lang], rec: REC[lang], num: (n: number) => n.toLocaleString(STR[lang].locale) });

/** El idioma llega por contexto a los textos de fuera del lienzo 3D (dentro del lienzo se pasa por propiedades) */
export const LangCtx = createContext<Lang>('es');
export const useL = () => getL(useContext(LangCtx));
