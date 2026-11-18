/**
 * Piezas 3D de las escenas 4 a 6: relieve de un país por capas, río encendido, parche de alta resolución del
 * noroeste de Sudamérica, departamentos de Colombia con volumen real, y las fichas del desafío diario.
 * Los contornos salen de los datos del juego (countries.ts, featureShapes.json, packShapes.json).
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { BRAND, MAP_CONTINENT_COLORS, countries, getColorGroup, latLonToVec } from './brand';
import { GLOBE_R, hashName } from './scene3d';
import featureShapes from '../../src/data/featureShapes.json';
import packShapes from '../../src/data/packShapes.json';

type Ring = number[][];
type Shape = { line: boolean; rings: Ring[]; tone?: number };
const FEATURES = featureShapes as unknown as Record<string, Shape>;
const PACK = packShapes as unknown as Record<string, Shape>;

export interface Window { lonMin: number; lonMax: number; latMin: number; latMax: number }
const rad = Math.PI / 180;

/** Trozo de esfera que cubre una ventana de lon/lat (mismas UV que una textura equirectangular de esa ventana) */
function patchGeometry(w: Window, radius: number, seg = 96) {
  return new THREE.SphereGeometry(radius, seg, seg, (w.lonMin + 180) * rad, (w.lonMax - w.lonMin) * rad, (90 - w.latMax) * rad, (w.latMax - w.latMin) * rad);
}
function windowCanvas(w: Window, pxPerDeg: number) {
  const c = document.createElement('canvas');
  c.width = Math.round((w.lonMax - w.lonMin) * pxPerDeg);
  c.height = Math.round((w.latMax - w.latMin) * pxPerDeg);
  const g = c.getContext('2d')!;
  const px = (lon: number) => (lon - w.lonMin) * pxPerDeg;
  const py = (lat: number) => (w.latMax - lat) * pxPerDeg;
  const path = (rings: Ring[]) => {
    g.beginPath();
    for (const ring of rings) { ring.forEach(([lon, lat], i) => (i ? g.lineTo(px(lon), py(lat)) : g.moveTo(px(lon), py(lat)))); g.closePath(); }
  };
  return { c, g, px, py, path };
}
function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ── Relieve por capas: el país se levanta del globo (escena 4, banderas) ──
export function CountryRelief({ name, window: w, rise, layers = 9, height = 0.045 }: { name: string; window: Window; rise: number; layers?: number; height?: number }) {
  const { geo, top, side } = useMemo(() => {
    const country = countries.find((c) => c.name === name)!;
    const make = (fill: string, stroke: string | null) => {
      const { c, g, path } = windowCanvas(w, 28);
      path(country.polygons);
      g.fillStyle = fill; g.fill('evenodd');
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(); }
      return toTexture(c);
    };
    return { geo: patchGeometry(w, GLOBE_R, 64), top: make('#22E8D4', '#FFFFFF'), side: make('#0C8F86', null) };
  }, [name, w]);
  if (rise <= 0) return null;
  return (
    <group>
      {Array.from({ length: layers }, (_, k) => {
        const isTop = k === layers - 1;
        const s = 1.003 + ((k + 1) / layers) * height * rise;
        return (
          <mesh key={k} geometry={geo} scale={s} renderOrder={10 + k}>
            <meshBasicMaterial map={isTop ? top : side} transparent alphaTest={0.4} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Río: un tubo que se enciende de sur a norte (escena 4, lugares) ──
export function River({ id, progress }: { id: string; progress: number }) {
  const tubes = useMemo(() => {
    const rings = FEATURES[id].rings.map((r) => (r[0][1] > r[r.length - 1][1] ? [...r].reverse() : r)).sort((a, b) => a[0][1] - b[0][1]);
    let total = 0;
    const list = rings.filter((r) => r.length >= 2).map((r) => {
      const pts = r.map(([lon, lat]) => new THREE.Vector3(...latLonToVec(lat, lon, GLOBE_R * 1.008)));
      const curve = new THREE.CatmullRomCurve3(pts);
      const len = curve.getLength();
      const segs = Math.max(8, Math.round(len * 90));
      const geo = new THREE.TubeGeometry(curve, segs, 0.02, 8, false);
      const halo = new THREE.TubeGeometry(curve, segs, 0.05, 8, false);
      const item = { geo, halo, start: total, len, perSeg: 8 * 6, segs };
      total += len;
      return item;
    });
    return { list, total };
  }, [id]);
  if (progress <= 0) return null;
  return (
    <group>
      {tubes.list.map((t, i) => {
        const k = Math.max(0, Math.min(1, (progress * tubes.total - t.start) / t.len));
        if (k <= 0) return null;
        t.geo.setDrawRange(0, Math.round(k * t.segs) * t.perSeg);
        t.halo.setDrawRange(0, Math.round(k * t.segs) * t.perSeg);
        return (
          <group key={i}>
            <mesh geometry={t.halo} renderOrder={19}>
              <meshBasicMaterial color={BRAND.turquoise} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh geometry={t.geo} renderOrder={20}>
              <meshBasicMaterial color="#B5FFF7" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Parche nítido del noroeste de Sudamérica: al acercarse, la textura general del globo se vería borrosa ──
export const SA_WINDOW: Window = { lonMin: -113, lonMax: -33, latMin: -42, latMax: 38 };
const DEPT_TONES = ['#F07A6A', '#F58C7A', '#F9A08F', '#E46A5A'];

export function SouthAmericaPatch({ opacity }: { opacity: number }) {
  const { geo, tex } = useMemo(() => {
    const { c, g, px, py, path } = windowCanvas(SA_WINDOW, 51);
    g.fillStyle = '#0D284E';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(141,205,245,0.10)';
    g.lineWidth = 2;
    for (let lon = -105; lon <= -30; lon += 15) { g.beginPath(); g.moveTo(px(lon), 0); g.lineTo(px(lon), c.height); g.stroke(); }
    for (let lat = -30; lat <= 30; lat += 15) { g.beginPath(); g.moveTo(0, py(lat)); g.lineTo(c.width, py(lat)); g.stroke(); }
    g.lineJoin = 'round';
    for (const country of countries) {
      const pal = MAP_CONTINENT_COLORS[getColorGroup(country.name)] ?? MAP_CONTINENT_COLORS.Ice;
      path(country.polygons);
      // Los vecinos, un poco apagados: el protagonista es Colombia (igual que en el mapa del pack)
      g.fillStyle = pal[hashName(country.name) % pal.length];
      g.globalAlpha = country.name === 'Colombia' ? 1 : 0.5;
      g.fill('evenodd');
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.lineWidth = 3;
      g.stroke();
    }
    for (const [id, sh] of Object.entries(PACK)) {
      if (!id.startsWith('div:co-')) continue;
      path(sh.rings);
      g.fillStyle = DEPT_TONES[(sh.tone ?? 0) % 4];
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = 1.6;
      g.stroke();
    }
    return { geo: patchGeometry(SA_WINDOW, GLOBE_R * 1.0012, 128), tex: toTexture(c) };
  }, []);
  if (opacity <= 0) return null;
  return (
    <mesh geometry={geo} renderOrder={5}>
      <meshBasicMaterial map={tex} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

// ── Departamentos con volumen real: tapa + paredes, cada uno sube por separado (escena 5) ──
const DEPT_H = 0.03;
interface Dept { id: string; top: THREE.BufferGeometry; walls: THREE.BufferGeometry; edge: THREE.BufferGeometry; tone: number; lat: number; lon: number }

function buildDepartments(): Dept[] {
  const out: Dept[] = [];
  const rTop = GLOBE_R * (1 + DEPT_H);
  const rBase = GLOBE_R * 0.99;
  for (const [id, sh] of Object.entries(PACK)) {
    // San Andrés (islas muy pequeñas) se queda plano en el parche: en relieve se veía como una raya suelta
    if (!id.startsWith('div:co-') || id === 'div:co-san-andres') continue;
    const topPos: number[] = [], wallPos: number[] = [], edgePos: number[] = [];
    let sumLat = 0, sumLon = 0, n = 0;
    for (const raw of sh.rings) {
      const ring = raw[0][0] === raw[raw.length - 1][0] && raw[0][1] === raw[raw.length - 1][1] ? raw.slice(0, -1) : raw;
      if (ring.length < 3) continue;
      const contour = ring.map(([lon, lat]) => new THREE.Vector2(lon, lat));
      const tris = THREE.ShapeUtils.triangulateShape(contour, []);
      const P = (i: number, r: number) => latLonToVec(ring[i][1], ring[i][0], r);
      // El orden de los vértices decide hacia dónde mira la cara: que mire hacia afuera del globo
      const flip = !THREE.ShapeUtils.isClockWise(contour);
      for (const [a, b, c] of tris) {
        const order = flip ? [a, c, b] : [a, b, c];
        for (const i of order) topPos.push(...P(i, rTop));
      }
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length;
        const a = P(i, rTop), b = P(j, rTop), c = P(j, rBase), d = P(i, rBase);
        wallPos.push(...a, ...b, ...c, ...a, ...c, ...d);
        edgePos.push(...latLonToVec(ring[i][1], ring[i][0], rTop * 1.0004), ...latLonToVec(ring[j][1], ring[j][0], rTop * 1.0004));
        sumLat += ring[i][1]; sumLon += ring[i][0]; n++;
      }
    }
    const geo = (arr: number[], normals: boolean) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      if (normals) g.computeVertexNormals();
      return g;
    };
    out.push({ id, top: geo(topPos, true), walls: geo(wallPos, true), edge: geo(edgePos, false), tone: sh.tone ?? 0, lat: sumLat / n, lon: sumLon / n });
  }
  // De norte a sur: así suben como una ola
  return out.sort((a, b) => b.lat - a.lat);
}

/**
 * rise(i, id) = cuánto ha subido cada departamento (0 = a ras, 1 = arriba; puede pasar de 1 al rebotar).
 * highlight = id del departamento de la pregunta y cuánto se enciende (0..1).
 */
export function Departments({ rise, highlight }: { rise: (index: number, id: string) => number; highlight?: { id: string; k: number } }) {
  const depts = useMemo(buildDepartments, []);
  return (
    <group>
      {depts.map((d, i) => {
        const r = rise(i, d.id);
        if (r <= 0.001) return null;
        const hk = highlight && highlight.id === d.id ? highlight.k : 0;
        // Escalar desde el centro del globo sube la tapa; la base queda bajo la superficie
        const h = DEPT_H * r * (1 + hk * 1.6);
        const s = (1 + h) / (1 + DEPT_H);
        const base = new THREE.Color(DEPT_TONES[d.tone % 4]);
        const color = base.clone().lerp(new THREE.Color('#22E8D4'), hk);
        const wall = base.clone().multiplyScalar(0.55).lerp(new THREE.Color('#0C8F86'), hk);
        return (
          <group key={d.id} scale={s}>
            <mesh geometry={d.top} renderOrder={30}>
              <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            <mesh geometry={d.walls} renderOrder={29}>
              <meshBasicMaterial color={wall} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            <lineSegments geometry={d.edge} renderOrder={31}>
              <lineBasicMaterial color="#ffffff" transparent opacity={0.95} toneMapped={false} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
export const DEPARTMENT_COUNT = Object.keys(PACK).filter((k) => k.startsWith('div:co-')).length;

// ── Fichas del desafío diario: caen, rebotan y se voltean a su color (escena 6) ──
function chipGeometry() {
  const w = 0.5, r = 0.11, x = -w / 2, y = -w / 2;
  const sh = new THREE.Shape();
  sh.moveTo(x + r, y);
  sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + w - r); sh.quadraticCurveTo(x + w, y + w, x + w - r, y + w);
  sh.lineTo(x + r, y + w); sh.quadraticCurveTo(x, y + w, x, y + w - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 10 });
  g.translate(0, 0, -0.05);
  return g;
}
export const CHIP_COLORS = { G: BRAND.turquoise, Y: BRAND.yellow, R: BRAND.coral } as const;

export function DailyChips({ pattern, drop, flip, pitch = 0.62, perRow = 7 }: { pattern: string; drop: (i: number) => number; flip: (i: number) => number; pitch?: number; perRow?: number }) {
  const geo = useMemo(chipGeometry, []);
  return (
    <group>
      {pattern.split('').map((ch, i) => {
        const row = Math.floor(i / perRow), col = i % perRow;
        const inRow = Math.min(perRow, pattern.length - row * perRow);
        const x = (col - (inRow - 1) / 2) * pitch;
        const y = -row * pitch;
        const d = drop(i);          // 0 = arriba, fuera de cuadro; 1 = en su sitio
        if (d <= 0) return null;
        const f = flip(i);          // 0 = boca abajo (azul), 1 = con su color
        const shown = f > 0.5;
        const color = shown ? CHIP_COLORS[ch as keyof typeof CHIP_COLORS] : '#1D3F6E';
        return (
          <mesh key={i} geometry={geo} position={[x, y + (1 - d) * 5, 0]} rotation={[f * Math.PI, 0, (1 - d) * 0.6]}>
            <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(shown ? 0.5 : 0.8)} emissive={color} emissiveIntensity={shown ? 0.5 : 0.1} roughness={0.4} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}
