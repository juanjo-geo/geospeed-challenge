/**
 * Catálogo de lugares para el servidor (puntaje v2, Temporada 1).
 *
 * 1) Da a cada ciudad de src/data/cities.ts un `id` estable (slug del nombre) y unifica las coordenadas de
 *    las ciudades repetidas entre la lista del mundo y las regionales (la primera aparición manda), para que
 *    el teléfono y el servidor midan la distancia al mismo punto.
 * 2) Escribe supabase/seed/places.sql con un `insert … on conflict` de todos los lugares, que la migración
 *    del puntaje v2 incluye. Volver a correrlo al agregar ciudades y aplicar el SQL resultante.
 *
 * Uso: node scripts/build-places.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FILE = 'src/data/cities.ts';
let src = readFileSync(FILE, 'utf8');

export const slug = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const re = /\{ (?:id: "[^"]+", )?name: "([^"]+)", country: "([^"]+)", lat: (-?[\d.]+), lon: (-?[\d.]+), difficulty: "(\w+)" \}/g;
const first = new Map();
let fixed = 0;
src = src.replace(re, (_all, name, country, lat, lon, diff) => {
  const id = slug(name);
  const prev = first.get(id);
  if (prev && (prev.lat !== lat || prev.lon !== lon || prev.country !== country)) { fixed++; ({ lat, lon, country } = prev); }
  if (!prev) first.set(id, { name, country, lat, lon });
  return `{ id: "${id}", name: "${name}", country: "${country}", lat: ${lat}, lon: ${lon}, difficulty: "${diff}" }`;
});
writeFileSync(FILE, src);

const esc = (s) => s.replace(/'/g, "''");
const rows = [...first.entries()].map(([id, c]) => `  ('${id}', 'city', '${esc(c.name)}', '${esc(c.country)}', ${c.lat}, ${c.lon})`);
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('supabase/seed/places.sql', `-- Generado por scripts/build-places.mjs a partir de src/data/cities.ts. No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${rows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;
`);
console.log(`lugares ${first.size}; coordenadas unificadas ${fixed}`);
