/**
 * Marca del juego para el video: colores y mapa salen del mismo código del juego (src/lib/theme.ts,
 * src/lib/mapContinents.ts, src/data/countries.ts), así el globo se ve igual que el mapa de la partida.
 */
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
export { BRAND, MAP_CONTINENT_COLORS } from '../../src/lib/theme';
export { getColorGroup } from '../../src/lib/mapContinents';
export { countries } from '../../src/data/countries';

let fontsPromise: Promise<unknown> | null = null;
export function loadBrandFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadFont({ family: 'Fredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '700' }),
      loadFont({ family: 'Poppins', url: staticFile('fonts/poppins-latin-600-normal.woff2'), weight: '600' }),
      loadFont({ family: 'Poppins', url: staticFile('fonts/poppins-latin-800-normal.woff2'), weight: '800' }),
      loadFont({ family: 'Poppins', url: staticFile('fonts/poppins-latin-900-normal.woff2'), weight: '900' }),
    ]);
  }
  return fontsPromise;
}

/** Posición en la esfera (radio 1) con la misma convención de UV que THREE.SphereGeometry */
export function latLonToVec(lat: number, lon: number, r = 1): [number, number, number] {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return [-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r];
}

/** Giro (y, x) del globo que deja (lat, lon) mirando a la cámara (+Z) */
export function faceRotation(lat: number, lon: number): { y: number; x: number } {
  const [x, , z] = latLonToVec(0, lon);
  return { y: -Math.atan2(x, z), x: (lat * Math.PI) / 180 };
}

/** Pseudoaleatorio con semilla: el render debe dar siempre el mismo cuadro */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
