/**
 * GeoSpeed — Design tokens for code that cannot read CSS variables
 * (Canvas 2D, injected CSS strings, share images/videos).
 *
 * The single source of truth for colors is `src/index.css` (`:root`).
 * Keep these hex values in sync with the CSS tokens of the same name.
 * Everything rendered through React/Tailwind must use the CSS tokens
 * (`hsl(var(--primary))`, `bg-primary`, `text-accent`…), never these.
 */
export const BRAND = {
  /** Fondo principal: azul marino profundo */
  navy: '#0B1F3A',
  /** Fondo más oscuro (gradientes, océano del mapa, tarjetas de video) */
  navyDeep: '#071426',
  /** Tarjetas y paneles */
  navyCard: '#122B4D',
  /** Amarillo cálido: CTA, puntos, marca */
  yellow: '#FFD93B',
  /** Amarillo profundo: labio de botones 3D, sombras del amarillo */
  yellowDeep: '#D9AE00',
  /** Turquesa: acentos, "SPEED" del wordmark, respuesta correcta */
  turquoise: '#19E6D2',
  /** Coral: error, tiempo agotado */
  coral: '#FF6B6B',
  /** Blanco cálido para texto sobre navy */
  white: '#F4F7FB',
  /** Texto atenuado */
  muted: '#9DB0C9',
} as const;

/** Globo de la pantalla de carga (maqueta Carga_APROBADA_v1): océano azul, tierra verde, halo turquesa */
export const GLOBE = {
  oceanLight: '#3A8FE6',
  oceanDeep: '#0B3778',
  land: '#55C24A',
  landShade: '#2E8B3E',
  ice: '#E8F1FA',
} as const;

/** RGB triplets (sin "rgb(") para construir rgba() en strings CSS/canvas */
export const BRAND_RGB = {
  navy: '11,31,58',
  navyDeep: '7,20,38',
  yellow: '255,217,59',
  yellowDeep: '217,174,0',
  turquoise: '25,230,210',
  coral: '255,107,107',
} as const;

/** rgba() helper: rgba(BRAND_RGB.yellow, 0.4) */
export function rgba(rgb: string, alpha: number): string {
  return `rgba(${rgb},${alpha})`;
}

/**
 * Lee un token CSS en tiempo de ejecución (p. ej. 'primary' → "48 100% 62%").
 * Útil cuando un canvas quiere seguir el tema exacto del DOM.
 */
export function cssToken(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/** hsl(var(--token)) listo para usar en estilos inline */
export function hslVar(name: string, alpha?: number): string {
  return alpha === undefined ? `hsl(var(--${name}))` : `hsl(var(--${name}) / ${alpha})`;
}

/**
 * Mapa del rediseño v2: un color por continente con variaciones suaves por país (maqueta Partida).
 * Lo usan el mapa de la partida (WorldMapCanvas) y la demo del Inicio (AutoDemo).
 */
export const MAP_CONTINENT_COLORS: Record<string, string[]> = {
  NorthAmerica: ['#2FB59B', '#3BC4A8', '#28A88F', '#45CDB3'], // verde agua
  SouthAmerica: ['#F07A6A', '#F58C7A', '#E86B5B', '#F99A88'], // coral
  Europe:       ['#9B8CE0', '#A99AE8', '#8C7DD6', '#B5A7EE'], // lavanda
  Asia:         ['#F39A4A', '#F7A95E', '#EF8C3A', '#FAB772'], // naranja
  Africa:       ['#F2C14E', '#F5CB62', '#EDB63C', '#F8D578'], // amarillo
  Oceania:      ['#4FA8E8', '#62B5EE', '#3F9BE0', '#79C1F2'], // azul cielo
  Ice:          ['#C9D6E2', '#D5E0EA', '#BFCDDB', '#DCE5EE'], // Antártida / Groenlandia
};
