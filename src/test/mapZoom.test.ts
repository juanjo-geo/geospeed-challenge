/**
 * Acercamiento CSS de la respuesta (WorldMapCanvas + src/lib/mapZoom.ts): en ningún cuadro de la animación
 * (golpe sobre el clic, paneo al origen del pico, pico con "respiración", vuelta) una etiqueta o un pin
 * sale del lienzo, en celular ni en escritorio. El tope anterior (solo pines, margen fijo, origen en el
 * punto medio) sí dejaba etiquetas cortadas: se mide aquí para que la regresión se note.
 */
import { describe, it, expect } from 'vitest';
import { layoutPills, maxZoomKeeping, rectAround, type Rect, type Pt, type PillRequest } from '@/lib/mapLabels';
import { planAnswerZoom, clampZoomFrame, framingOrigin, bbox } from '@/lib/mapZoom';

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}
const textW = (t: string, px: number) => t.length * px * 0.62 + 18;
const inside = (r: Rect, W: number, H: number) => r.x >= -0.01 && r.y >= -0.01 && r.x + r.w <= W + 0.01 && r.y + r.h <= H + 0.01;
const scaled = (r: Rect, o: Pt, z: number): Rect => ({ x: o.x + (r.x - o.x) * z, y: o.y + (r.y - o.y) * z, w: r.w * z, h: r.h * z });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Mismas peticiones que WorldMapCanvas en la vista mundial (sin rival) */
function answerRects(W: number, H: number, u: Pt, c: Pt) {
  const compact = Math.min(W, H) < 420;
  const px = compact ? 11 : 12, pillH = compact ? 20 : 22;
  const hard = [rectAround(u, 12), rectAround(c, 17)];
  const reqs: PillRequest[] = [
    { key: 'correct', w: textW('Ciudad correcta', px), h: pillH, anchor: c, r: 17, away: u, prefer: -1 },
    { key: 'you', w: textW('Tu respuesta', px), h: pillH, anchor: u, r: 12, away: c, prefer: 1 },
  ];
  const mid = { x: (u.x + c.x) / 2, y: (u.y + c.y) / 2 };
  const spots = [mid, { x: mid.x, y: mid.y - 22 }, { x: mid.x, y: mid.y + 22 }, { x: mid.x + 50, y: mid.y }, { x: mid.x - 50, y: mid.y }];
  reqs.push({ key: 'distance', w: textW('12.345 km', px + 1), h: pillH + 2, anchor: mid, r: 0, spots, ignoreSoft: true });
  const area = { x: 4, y: 4, w: W - 8, h: H - 8 };
  const pills = layoutPills(reqs, hard, [], area);
  return { rects: [rectAround(u, 14), rectAround(c, 19), ...hard, ...pills.map((p) => p.rect)], mid };
}

/** Tope viejo: solo los pines, margen fijo de 150 px (18 % en mapas angostos) a los lados y 44 px arriba/abajo */
function oldFit(pins: Pt[], o: Pt, W: number, H: number) {
  const mx = Math.min(150, W * 0.18), my = 44;
  let z = Infinity;
  for (const p of pins) {
    if (p.x > o.x + 0.5) z = Math.min(z, (W - mx - o.x) / (p.x - o.x));
    else if (p.x < o.x - 0.5) z = Math.min(z, (o.x - mx) / (o.x - p.x));
    if (p.y > o.y + 0.5) z = Math.min(z, (H - my - o.y) / (p.y - o.y));
    else if (p.y < o.y - 0.5) z = Math.min(z, (o.y - my) / (o.y - p.y));
  }
  return z;
}

describe('maxZoomKeeping / framingOrigin', () => {
  it('limita el factor justo para que el rectángulo toque el margen', () => {
    const W = 1000, H = 500, o = { x: 500, y: 250 };
    const r: Rect = { x: 100, y: 200, w: 50, h: 20 };
    const z = maxZoomKeeping([r], o, W, H, 0);
    expect(z).toBeCloseTo(500 / 400, 5);
    expect(scaled(r, o, z).x).toBeCloseTo(0, 5);
    expect(maxZoomKeeping([], o, W, H)).toBe(Infinity);
    expect(maxZoomKeeping([{ x: -10, y: 10, w: 20, h: 20 }], o, W, H, 4)).toBeLessThan(1);
  });
  it('el origen de encuadre deja la caja dentro al factor máximo', () => {
    const W = 740, H = 285;
    const b: Rect = { x: 10, y: 150, w: 300, h: 120 };
    const z = Math.min(1.8, (W - 12) / b.w, (H - 12) / b.h);
    const o = framingOrigin(b, z, W, H);
    expect(inside(scaled(b, o, z), W, H)).toBe(true);
    expect(bbox([b, { x: 400, y: 0, w: 10, h: 10 }])).toEqual({ x: 10, y: 0, w: 400, h: 270 });
  });
});

describe('acercamiento de la respuesta', () => {
  const sizes = [{ W: 740, H: 285 }, { W: 844, H: 300 }, { W: 998, H: 720 }, { W: 1400, H: 700 }];
  it('en ningún cuadro sale nada del lienzo (el tope viejo sí cortaba) y el acercamiento sigue ocurriendo', () => {
    let oldBad = 0, newBad = 0, zoomed = 0, cases = 0;
    for (const { W, H } of sizes) {
      const next = rng(W * 31 + H);
      const peak = W < 640 ? 1.8 : W < 1025 ? 2.0 : 2.2;
      for (let i = 0; i < 300; i++) {
        // Pines en cualquier parte, con sesgo hacia los bordes (ahí estaba el problema)
        const edge = (v: number, max: number) => (next() < 0.4 ? (next() < 0.5 ? v * 0.12 : max - v * 0.12) : v);
        const u = { x: edge(next() * W, W), y: edge(next() * H, H) };
        const c = { x: edge(next() * W, W), y: edge(next() * H, H) };
        const { rects, mid } = answerRects(W, H, u, c);
        const ok = (z: number, o: Pt) => rects.every((r) => inside(scaled(r, o, z), W, H));
        // Un pin pegado al borde ya asoma sin acercamiento: ahí no hay nada que cuidar (no se acerca)
        if (!ok(1, mid)) continue;
        cases++;
        // Tope viejo (origen en el punto medio)
        const zo = Math.min(peak, oldFit([u, c], mid, W, H));
        if (zo >= 1.08 && !ok(zo, mid)) oldBad++;
        // Plan nuevo + tope por cuadro, recorriendo las cuatro fases de la animación
        const plan = planAnswerZoom(rects, u, peak, W, H);
        if (!plan) continue;
        zoomed++;
        const center = { x: W / 2, y: H / 2 };
        const frames: { z: number; o: Pt }[] = [];
        for (let t = 0; t <= 1.0001; t += 0.1) {
          frames.push({ z: lerp(1, plan.punch, t), o: u });
          frames.push({ z: lerp(plan.punch, plan.peak, t), o: { x: lerp(u.x, plan.origin.x, t), y: lerp(u.y, plan.origin.y, t) } });
          frames.push({ z: plan.peak + Math.sin(t * Math.PI) * 0.02, o: plan.origin });
          frames.push({ z: lerp(plan.peak, 1, t), o: { x: lerp(plan.origin.x, center.x, t), y: lerp(plan.origin.y, center.y, t) } });
        }
        for (const f of frames) {
          const z = clampZoomFrame(rects, f.o, f.z, W, H);
          if (!ok(z, f.o)) { newBad++; break; }
        }
      }
    }
    expect(newBad).toBe(0);
    expect(oldBad).toBeGreaterThan(0);
    // El acercamiento sigue ocurriendo en una buena parte de las respuestas (con el origen de encuadre
    // cabe más que con el origen en el punto medio)
    expect(zoomed / cases).toBeGreaterThan(0.25);
  });
});
