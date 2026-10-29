// Vuelca el catálogo (nombre → coordenadas) para que el script de capturas sepa dónde tocar.
import { catalogPool, CATEGORIES, itemTitle } from '@/lib/catalog';
import type { GameMode } from '@/data/cities';

const out: Record<string, unknown[]> = {};
for (const mode of ['world', 'colombia'] as GameMode[]) {
  for (const cat of CATEGORIES) {
    try {
      out[`${mode}:${cat}`] = catalogPool(cat, mode).map((c) => ({
        id: c.id, name: c.name, nameEn: c.nameEn, lat: c.lat, lon: c.lon, kind: c.kind, iso: c.iso, country: c.country,
        titleEs: itemTitle(c, 'es'), titleEn: itemTitle(c, 'en'),
      }));
    } catch { /* categoría sin ítems en ese modo */ }
  }
}
console.log(JSON.stringify(out));
