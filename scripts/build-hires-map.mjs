/**
 * Genera src/data/countriesHiRes.json: contornos de países de Natural Earth 1:50m (paquete
 * world-atlas, dominio público / ISC) para las vistas del mapa con zoom (respuesta, revisión, modos
 * regionales). El mapa del juego sigue usando countries.ts (1:110m) para la vista del mundo y la lógica.
 *
 * Qué hace:
 *  - conserva la TOPOLOGÍA (arcos compartidos): cada frontera se dibuja una sola vez, sin líneas dobles;
 *  - simplifica cada arco (Douglas-Peucker, 0.012°) sin mover sus extremos y cuantiza a 0.01°;
 *  - para los países que no existen en countries.ts (islas y microestados) guarda el país vecino más
 *    cercano (`r`), que da el continente y el color.
 *
 * Uso: node scripts/build-hires-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const TOL = 0.012; // grados (≈0,6 px en el zoom máximo de escritorio)
const Q = 100;     // 1 unidad = 0.01°

const topo = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const src = readFileSync('src/data/countries.ts', 'utf8');
const lowRes = JSON.parse(src.slice(src.indexOf('= [') + 2).trim().replace(/;\s*$/, ''));
const lowNames = new Set(lowRes.map((c) => c.name));

const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

// 1) Arcos a lon/lat absolutos
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});

// 2) Douglas-Peucker por arco (extremos fijos → la topología se mantiene)
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function simplify(pts) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  // Anillo cerrado en un solo arco: partir por el punto más lejano del inicio para no colapsarlo
  const closed = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  const stack = [];
  if (closed) {
    let far = 1, best = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
      if (d > best) { best = d; far = i; }
    }
    keep[far] = 1;
    stack.push([0, far], [far, pts.length - 1]);
  } else stack.push([0, pts.length - 1]);
  while (stack.length) {
    const [i0, i1] = stack.pop();
    let idx = -1, max = TOL;
    for (let i = i0 + 1; i < i1; i++) {
      const d = segDist(pts[i], pts[i0], pts[i1]);
      if (d > max) { max = d; idx = i; }
    }
    if (idx >= 0) { keep[idx] = 1; stack.push([i0, idx], [idx, i1]); }
  }
  return pts.filter((_, i) => keep[i]);
}

let before = 0, after = 0;
const outArcs = arcs.map((arc) => {
  before += arc.length;
  const s = simplify(arc);
  // Cuantizar y quitar puntos repetidos consecutivos
  const q = [];
  for (const [lon, lat] of s) {
    const x = Math.round((lon + 180) * Q), y = Math.round((lat + 90) * Q);
    const last = q[q.length - 1];
    if (!last || last[0] !== x || last[1] !== y) q.push([x, y]);
  }
  if (q.length === 1) q.push([...q[0]]);
  after += q.length;
  // Delta: [x0, y0, dx1, dy1, …]
  const flat = [q[0][0], q[0][1]];
  for (let i = 1; i < q.length; i++) flat.push(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
  return flat;
});

// 3) Países: polígonos → anillos → índices de arco (negativo ~i = arco invertido, como TopoJSON)
const geoms = topo.objects.countries.geometries
  .filter((g) => g.type === 'Polygon' || g.type === 'MultiPolygon')
  .map((g) => ({ n: g.properties.name, p: g.type === 'Polygon' ? [g.arcs] : g.arcs }));

// 4) País de referencia (continente/color) para los que no están en countries.ts
function firstPoint(g) {
  const a = g.p[0][0][0];
  const arc = arcs[a < 0 ? ~a : a];
  return arc[0];
}
function nearestLowRes(pt) {
  let best = null, bd = Infinity;
  for (const c of lowRes) {
    for (const poly of c.polygons) {
      for (const [lon, lat] of poly) {
        const d = (lon - pt[0]) ** 2 + (lat - pt[1]) ** 2;
        if (d < bd) { bd = d; best = c.name; }
      }
    }
  }
  return best;
}
for (const g of geoms) {
  if (!lowNames.has(g.n)) g.r = nearestLowRes(firstPoint(g));
}

const out = { q: Q, arcs: outArcs, geoms };
const json = JSON.stringify(out);
writeFileSync('src/data/countriesHiRes.json', json);
console.log(`puntos ${before} → ${after}; países ${geoms.length}; ${(json.length / 1024).toFixed(0)} KB, gzip ${(gzipSync(json).length / 1024).toFixed(0)} KB`);
console.log('referencias:', geoms.filter((g) => g.r).map((g) => `${g.n}→${g.r}`).join(', '));
