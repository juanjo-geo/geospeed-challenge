/**
 * Correcciones verificadas del catálogo de los packs Pro (punto 11, 2026-10-30).
 *
 * scripts/build-pro-packs.mjs arma las divisiones y ciudades con Natural Earth, que trae algunos errores. Los
 * encontraron los redactores de las reseñas y se comprobaron contra Wikidata (capital P36 de cada división, su punto
 * P625 dentro del contorno, y el contorno de cada ciudad):
 *  · Napo y Tungurahua (Ecuador) tenían cada uno el contorno del otro: tocar la Tungurahua real contaba como fallo.
 *  · "comarca Ngäbe-Buglé" era en realidad la provincia de Bocas del Toro (punto, vecinos y capital); "La Estrelleta"
 *    es el nombre viejo de la provincia Elías Piña. Se conserva el id (está en la base y en la memoria de cada jugador).
 *  · 15 capitales equivocadas (Tungurahua → Tena, Callao → Puno, Monagas → Tucupita, Asunción → Ypacaraí…) y 45
 *    divisiones sin capital que Wikidata sí tiene.
 *  · 19 ciudades con la división equivocada o mal escrita (Juliaca y Puno en "Callao", Cobija en "Acre", "Alto Paran").
 *  · Tres capitales de habla hispana con el nombre en inglés (Mexico City, Panama City, Guatemala City), y Guastatoya
 *    con el nombre de su departamento ("El Progreso") y el punto corrido 9 km.
 *
 * Se aplica sobre los archivos ya generados (src/data/proPackCatalog.ts, proPackShapes.json, proPackMeta.ts y
 * supabase/seed/pro_pack_places.sql); build-pro-packs.mjs la llama al terminar, así que regenerar no trae los errores
 * de vuelta. Es idempotente: correrla dos veces no cambia nada. La base de producción se corrige con la migración
 * 20261110120000_packs_pro_datos.sql (contornos y nombres).
 *
 * Uso: node scripts/pro-pack-fixes.mjs            (aplica)
 *      node scripts/pro-pack-fixes.mjs --roundtrip (solo comprueba que leer y volver a escribir no cambia nada)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Contornos con el nombre del otro: se intercambia la geometría (contorno, tono, punto, vecinos, nivel) si el punto de
 * prueba (una ciudad que tiene que quedar dentro) todavía no cae en el contorno indicado. */
export const GEOM_SWAPS = [
  { a: 'div:ec-napo', b: 'div:ec-tungurahua', names: ['Napo', 'Tungurahua'], probe: { inside: 'div:ec-tungurahua', lat: -1.2696, lon: -78.62 } }, // Ambato
];

/** Divisiones con el nombre equivocado (se conserva el id) */
export const DIVISION_RENAMES = {
  'div:pa-comarca-ngabe-bugle': { name: 'Bocas del Toro', nameEn: 'Bocas del Toro' },
  'div:do-la-estrelleta': { name: 'Elías Piña', nameEn: 'Elías Piña' },
};

/** Ciudades con el nombre en inglés (nameEn para el juego en inglés; también la capital de país en proPackMeta) */
export const CITY_RENAMES = {
  'ci:mx-mexico-city': { name: 'Ciudad de México', nameEn: 'Mexico City' },
  'ci:pa-panama-city': { name: 'Ciudad de Panamá', nameEn: 'Panama City' },
  'ci:gt-guatemala-city': { name: 'Ciudad de Guatemala', nameEn: 'Guatemala City' },
  'ci:ht-port-de-paix': { name: 'Port-de-Paix' },
  // La capital de El Progreso es Guastatoya (Natural Earth la llama como el departamento y la pone a 9 km)
  'ci:gt-el-progreso': { name: 'Guastatoya' },
};

/** Ciudades con el punto corrido (coordenadas de Wikidata, P625) */
export const CITY_MOVES = {
  'ci:gt-el-progreso': { lat: 14.8539, lon: -90.0686 },
  // Natural Earth la ponía en Sonora, a 744 km de la Mazatlán de Sinaloa
  'ci:mx-mazatlan': { lat: 23.2167, lon: -106.4083 },
  // Natural Earth: el fortín del Chaco que fue capital del departamento Nueva Asunción (suprimido); el único lugar con
  // ese nombre en Wikidata y Wikipedia es el municipio de Guairá, que es lo que describen la ficha y la reseña
  'ci:py-general-eugenio-alejandrino-garay': { lat: -25.75, lon: -56.433 },
};

/** Capitales de división según Wikidata (P36). null = sin capital (un distrito capital es la propia ciudad). */
export const CAPITALS = {
  // equivocadas
  'div:pe-lima': 'Huacho',
  'div:pe-callao': 'Callao',
  'div:ve-monagas': 'Maturín',
  'div:ve-distrito-capital': 'Caracas',
  'div:ec-napo': 'Tena',
  'div:ec-tungurahua': 'Ambato',
  'div:py-presidente-hayes': 'Villa Hayes',
  'div:cl-o-higgins': 'Rancagua',
  'div:gt-el-progreso': 'Guastatoya',
  'div:jm-parroquia-de-saint-thomas': 'Morant Bay',
  'div:cu-granma': 'Bayamo',
  'div:py-asuncion': null,
  'div:ar-buenos-aires-distrito-capital': null,
  // faltaban
  'div:bo-la-paz': 'La Paz',
  'div:bo-chuquisaca': 'Sucre',
  'div:bo-pando': 'Cobija',
  'div:ec-sucumbios': 'Nueva Loja',
  'div:ec-orellana': 'El Coca',
  'div:ec-santa-elena': 'Santa Elena',
  'div:ec-pichincha': 'Quito',
  'div:ec-santo-domingo-de-los-tsachilas': 'Santo Domingo',
  'div:pe-puno': 'Puno',
  'div:pe-lima-distrito-capital': 'Lima',
  'div:pe-ancash': 'Huaraz',
  'div:ve-delta-amacuro': 'Tucupita',
  'div:ve-aragua': 'Maracay',
  'div:ve-vargas': 'La Guaira',
  'div:ve-miranda': 'Los Teques',
  'div:py-boqueron': 'Filadelfia',
  'div:py-central': 'Areguá',
  'div:py-alto-parana': 'Ciudad del Este',
  'div:py-neembucu': 'Pilar',
  'div:py-canindeyu': 'Saltos del Guairá',
  'div:py-caazapa': 'Caazapá',
  'div:cl-santiago': 'Santiago',
  'div:cl-valparaiso': 'Valparaíso',
  'div:cl-nuble': 'Chillán',
  'div:ar-rio-negro': 'Viedma',
  'div:ar-buenos-aires': 'La Plata',
  'div:ni-rio-san-juan': 'San Carlos',
  'div:ni-rivas': 'Rivas',
  'div:ni-managua': 'Managua',
  'div:pa-embera-wounaan': 'Unión Chocó',
  'div:pa-panama': 'Ciudad de Panamá',
  'div:hn-francisco-morazan': 'Tegucigalpa',
  'div:gt-guatemala': 'Ciudad de Guatemala',
  'div:sv-san-salvador': 'San Salvador',
  'div:cr-san-jose': 'San José',
  'div:do-la-estrelleta': 'Comendador',
  'div:do-santo-domingo': 'Santo Domingo Este',
  'div:do-nacional': 'Santo Domingo',
  'div:ht-oeste': 'Port-au-Prince',
  'div:ht-nippes': 'Miragoâne',
  'div:pr-puerto-rico': 'San Juan',
  'div:jm-parroquia-de-kingston': 'Kingston',
  'div:cu-mayabeque': 'San José de las Lajas',
  'div:cu-artemisa': 'Artemisa',
  'div:do-san-jose-de-ocoa': 'San José de Ocoa',
};

/** División de cada ciudad: la que contiene su punto (y, para las capitales, la división de la que es capital) */
export const CITY_ADMINS = {
  'ci:pe-callao': 'Callao',
  'ci:pe-juliaca': 'Puno',
  'ci:pe-puno': 'Puno',
  'ci:ve-cabimas': 'Zulia',
  'ci:ve-tucupita': 'Delta Amacuro',
  'ci:ec-ambato': 'Tungurahua',
  'ci:ec-tena': 'Napo',
  'ci:bo-cobija': 'Pando',
  'ci:py-san-lorenzo': 'Central',
  'ci:py-ypacarai': 'Central',
  'ci:py-ciudad-del-este': 'Alto Paraná',
  'ci:py-pilar': 'Ñeembucú',
  'ci:py-mariscal-estigarribia': 'Boquerón',
  'ci:py-general-eugenio-alejandrino-garay': 'Guairá',
  'ci:mx-mazatlan': 'Sinaloa',
  'ci:cl-puerto-aisen': 'Aysén del General Carlos Ibáñez del Campo',
  'ci:ni-rivas': 'Rivas',
  'ci:ni-san-carlos': 'Río San Juan',
  'ci:do-comendador': 'Elías Piña',
  'ci:pa-bocas-del-toro': 'Bocas del Toro',
};

// ── Lectura y escritura (mismo formato que build-pro-packs.mjs) ─────────────
const CATALOG = 'src/data/proPackCatalog.ts';
const SHAPES = 'src/data/proPackShapes.json';
const META = 'src/data/proPackMeta.ts';
const SEED = 'supabase/seed/pro_pack_places.sql';

export async function loadModel(root) {
  const src = readFileSync(join(root, CATALOG), 'utf8');
  const js = src.replace(/^import type .*$/m, '').replace(/: City\[\]/g, '');
  const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  const metaSrc = readFileSync(join(root, META), 'utf8');
  return {
    cities: mod.PRO_PACK_CITIES.map((c) => ({ ...c })),
    divisions: mod.PRO_PACK_DIVISIONS.map((d) => ({ ...d, nb: [...(d.nb ?? [])] })),
    shapes: JSON.parse(readFileSync(join(root, SHAPES), 'utf8')),
    meta: JSON.parse(metaSrc.slice(metaSrc.indexOf('= {') + 2, metaSrc.lastIndexOf('}') + 1)),
  };
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const esc = (s) => String(s).replace(/'/g, "''");

export function serialize(model) {
  const catalog = `// Generado por scripts/build-pro-packs.mjs a partir de proPacksTiers.ts + Natural Earth, con las correcciones de scripts/pro-pack-fixes.mjs. No editar a mano.
import type { City } from './cities';

/** Packs Pro (Fase 7b): ciudades (al punto). region = pack; admin = división. */
export const PRO_PACK_CITIES: City[] = [
${model.cities.map((ct) => `  { id: '${ct.id}', name: ${q(ct.name)}, ${ct.nameEn ? `nameEn: ${q(ct.nameEn)}, ` : ''}country: ${q(ct.country)}, admin: ${q(ct.admin)}, ${ct.isCapital ? 'isCapital: true, ' : ''}lat: ${ct.lat}, lon: ${ct.lon}, difficulty: '${ct.difficulty}', region: '${ct.region}' },`).join('\n')}
];

/** Packs Pro: divisiones (área, contorno en proPackShapes.json). */
export const PRO_PACK_DIVISIONS: City[] = [
${model.divisions.map((dv) => `  { id: '${dv.id}', kind: 'division', geom: 'area', ftype: '${dv.ftype}', name: ${q(dv.name)}, nameEn: ${q(dv.nameEn)}, country: ${q(dv.country)}, ${dv.capital ? `capital: ${q(dv.capital)}, ` : ''}nb: [${dv.nb.map(q).join(', ')}], lat: ${dv.lat}, lon: ${dv.lon}, difficulty: '${dv.difficulty}', region: '${dv.region}' },`).join('\n')}
];
`;
  const meta = `// Generado por scripts/build-pro-packs.mjs. No editar a mano.
/** Packs Pro (Fase 7b): límites del mapa, países (ISO) y capitales de cada pack */
export interface ProPackMeta { es: string; en: string; bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number }; isos: string[]; capitals: Record<string, { name: string; lat: number; lon: number }> }
export const PRO_PACK_META: Record<'andes' | 'conosur' | 'mexcam' | 'caribe', ProPackMeta> = ${JSON.stringify(model.meta, null, 1)};
`;
  const placeRows = [
    ...model.cities.map((ct) => `  ('${ct.id}', 'city', '${esc(ct.name)}', '${esc(ct.country)}', ${ct.lat}, ${ct.lon})`),
    ...model.divisions.map((dv) => `  ('${dv.id}', 'division', '${esc(dv.name)}', '${esc(dv.country)}', ${dv.lat}, ${dv.lon})`),
  ];
  const shapeRows = [];
  for (const dv of model.divisions) (model.shapes[dv.id]?.rings ?? []).forEach((ring, i) => shapeRows.push(`  ('${dv.id}', ${i}, array[${ring.map((p) => p[0]).join(',')}]::double precision[], array[${ring.map((p) => p[1]).join(',')}]::double precision[], false)`));
  const prefixes = [...new Set(model.divisions.map((dv) => dv.id.slice(0, 7)))];
  const seed = `-- Generado por scripts/build-pro-packs.mjs (packs Pro, Fase 7b). No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
${placeRows.join(',\n')}
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

delete from public.place_shapes where ${prefixes.map((p) => `place_id like '${p}%'`).join(' or ')};
insert into public.place_shapes (place_id, ring_no, lons, lats, is_line) values
${shapeRows.join(',\n')};
`;
  return { [CATALOG]: catalog, [SHAPES]: JSON.stringify(model.shapes), [META]: meta, [SEED]: seed };
}

// ── Correcciones ────────────────────────────────────────────────────────────
function inRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const insideShape = (shape, lat, lon) => (shape?.rings ?? []).reduce((acc, r) => acc !== inRing(r, lon, lat), false);
const norm = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function fixModel(model) {
  const log = [];
  const div = new Map(model.divisions.map((d) => [d.id, d]));
  const city = new Map(model.cities.map((c) => [c.id, c]));

  for (const sw of GEOM_SWAPS) {
    const A = div.get(sw.a), B = div.get(sw.b);
    if (!A || !B || insideShape(model.shapes[sw.probe.inside], sw.probe.lat, sw.probe.lon)) continue;
    for (const k of ['lat', 'lon', 'nb', 'difficulty']) [A[k], B[k]] = [B[k], A[k]];
    [model.shapes[sw.a], model.shapes[sw.b]] = [model.shapes[sw.b], model.shapes[sw.a]];
    // Los vecinos se calcularon con los nombres cambiados: en ese país, Napo ↔ Tungurahua
    const prefix = sw.a.slice(0, 7);
    const [n1, n2] = sw.names;
    for (const d of model.divisions) if (d.id.startsWith(prefix)) d.nb = d.nb.map((n) => (n === n1 ? n2 : n === n2 ? n1 : n));
    log.push(`contornos intercambiados: ${sw.a} ↔ ${sw.b}`);
  }

  for (const [id, r] of Object.entries(DIVISION_RENAMES)) {
    const d = div.get(id);
    if (!d || d.name === r.name) continue;
    const old = d.name;
    d.name = r.name;
    d.nameEn = r.nameEn;
    for (const o of model.divisions) o.nb = o.nb.map((n) => (n === old ? r.name : n));
    for (const c of model.cities) if (c.admin === old) c.admin = r.name;
    log.push(`división renombrada: ${id} ${old} → ${r.name}`);
  }

  for (const [id, r] of Object.entries(CITY_RENAMES)) {
    const c = city.get(id);
    if (!c || (c.name === r.name && (c.nameEn ?? null) === (r.nameEn ?? null))) continue;
    const old = c.name;
    c.name = r.name;
    if (r.nameEn) c.nameEn = r.nameEn;
    for (const m of Object.values(model.meta)) for (const cap of Object.values(m.capitals)) if (cap.name === old) cap.name = r.name;
    log.push(`ciudad renombrada: ${id} ${old} → ${r.name}`);
  }

  for (const [id, pt] of Object.entries(CITY_MOVES)) {
    const c = city.get(id);
    if (!c || (c.lat === pt.lat && c.lon === pt.lon)) continue;
    log.push(`ciudad movida: ${id} (${c.lat}, ${c.lon}) → (${pt.lat}, ${pt.lon})`);
    c.lat = pt.lat;
    c.lon = pt.lon;
  }

  for (const [id, cap] of Object.entries(CAPITALS)) {
    const d = div.get(id);
    if (!d || (d.capital ?? null) === cap) continue;
    log.push(`capital: ${id} ${d.capital ?? '—'} → ${cap ?? '—'}`);
    if (cap) d.capital = cap;
    else delete d.capital;
  }

  for (const [id, admin] of Object.entries(CITY_ADMINS)) {
    const c = city.get(id);
    if (!c || c.admin === admin) continue;
    log.push(`división de la ciudad: ${id} ${c.admin || '—'} → ${admin}`);
    c.admin = admin;
  }

  // Capital = capital de país (proPackMeta) o capital de alguna división de su país
  for (const c of model.cities) {
    const iso = c.id.slice(3, 5).toUpperCase();
    const natCap = Object.values(model.meta).some((m) => norm(m.capitals[iso]?.name) === norm(c.name));
    const divCap = model.divisions.some((d) => d.id.slice(4, 6).toUpperCase() === iso && norm(d.capital) === norm(c.name));
    const was = !!c.isCapital;
    if (natCap || divCap) c.isCapital = true;
    else delete c.isCapital;
    if (was !== !!c.isCapital) log.push(`capital de división: ${c.id} ${was ? 'sí → no' : 'no → sí'}`);
  }
  return log;
}

/** Escribe conservando el fin de línea que ya tiene el archivo (en Windows, git los deja con CRLF en la copia de trabajo) */
function writeKeepingEol(file, text) {
  let crlf = false;
  try { crlf = readFileSync(file, 'utf8').includes('\r\n'); } catch { /* archivo nuevo */ }
  writeFileSync(file, crlf ? text.replace(/\r?\n/g, '\r\n') : text);
}

export async function applyProPackFixes(root = process.cwd()) {
  const model = await loadModel(root);
  const log = fixModel(model);
  for (const [file, text] of Object.entries(serialize(model))) writeKeepingEol(join(root, file), text);
  return log.length ? `pro-pack-fixes: ${log.length} cambios\n  ${log.join('\n  ')}` : 'pro-pack-fixes: nada que corregir';
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.cwd();
  if (process.argv.includes('--roundtrip')) {
    const out = serialize(await loadModel(root));
    for (const [file, text] of Object.entries(out)) {
      const cur = readFileSync(join(root, file), 'utf8');
      const strip = (s) => s.replace(/\r\n/g, '\n').replace(/^\/\/ Generado[^\n]*\n/, '');
      console.log(`${file}: ${strip(cur) === strip(text) ? 'igual' : 'DISTINTO'}`);
    }
  } else {
    console.log(await applyProPackFixes(root));
  }
}
