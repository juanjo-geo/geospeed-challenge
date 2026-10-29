/**
 * Distancia del clic a un contorno (banderas y lugares geográficos, Fase 6). Decisión de JuanJo: se puntúa
 * por distancia como las ciudades — dentro del país/área = cercanía perfecta; fuera, la distancia al borde
 * más cercano; en una línea (río), la distancia al punto más cercano del trazo.
 *
 * El servidor hace EXACTAMENTE lo mismo (shape_distance_km, migraciones de banderas y lugares) con los
 * mismos contornos (countries.ts → place_shapes; featureShapes.json → place_shapes con is_line): el punto
 * está dentro si cae en cualquier anillo cerrado (rayo horizontal, par/impar); si no, para cada lado del
 * contorno se busca el punto más cercano en un plano local equirectangular alrededor del clic y se mide con
 * haversine. El resultado se redondea a décimas de km en los dos lados antes de calcular la cercanía.
 * Cambiar algo aquí obliga a cambiarlo allá (pruebas de paridad: scripts/test-flags-sql.mjs y
 * scripts/test-features-sql.mjs).
 */
import { countries } from '@/data/countries';
import { shapeDistance, type CountryHit } from './shapeDistance';

// La geometría vive en shapeDistance.ts; se reexporta para no cambiar a quien la importa desde aquí
export { haversineKm, shapeDistance, type CountryHit } from './shapeDistance';

/** Distancia del punto al contorno del país `name` (nombre de countries.ts); null si el país no existe. */
export function countryDistance(name: string, lat: number, lon: number): CountryHit | null {
  const c = countries.find((x) => x.name === name);
  if (!c) return null;
  return shapeDistance(c.polygons, lat, lon, true);
}
