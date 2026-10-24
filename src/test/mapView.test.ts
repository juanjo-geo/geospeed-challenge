import { describe, it, expect } from 'vitest';
import { IDENTITY_VIEW, MAX_MAP_ZOOM, clampView, zoomAround, pinchView, panView, toLogical, isIdentityView } from '@/lib/mapView';

const W = 800, H = 400;
/** El mapa acercado siempre cubre el contenedor: ningún borde vacío */
const covers = (v: { z: number; tx: number; ty: number }) =>
  v.tx <= 1e-9 && v.ty <= 1e-9 && v.tx + W * v.z >= W - 1e-9 && v.ty + H * v.z >= H - 1e-9;

describe('mapView — zoom y paneo manuales', () => {
  it('los botones acercan hacia el centro y dejan el centro quieto', () => {
    const v = zoomAround(IDENTITY_VIEW, 2, W / 2, H / 2, W, H);
    expect(v.z).toBe(2);
    const c = toLogical(v, W / 2, H / 2);
    expect(c.x).toBeCloseTo(W / 2);
    expect(c.y).toBeCloseTo(H / 2);
  });

  it('después de acercar con los botones se puede llevar cualquier esquina a la vista arrastrando', () => {
    const v = zoomAround(IDENTITY_VIEW, 4, W / 2, H / 2, W, H);
    // arrastrar mucho hacia la izquierda/arriba → se ve la esquina inferior derecha del mapa
    const br = panView(v, -10_000, -10_000, W, H);
    const p = toLogical(br, W - 1, H - 1);
    expect(p.x).toBeCloseTo((W - 1 - br.tx) / 4);
    expect(toLogical(br, W, H).x).toBeCloseTo(W);
    expect(toLogical(br, W, H).y).toBeCloseTo(H);
    // y hacia la derecha/abajo → la esquina superior izquierda
    const tl = panView(v, 10_000, 10_000, W, H);
    expect(toLogical(tl, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('nunca deja bordes vacíos ni pasa del zoom máximo', () => {
    let v = IDENTITY_VIEW;
    for (let i = 0; i < 2000; i++) {
      const r = (i * 7919) % 1000 / 1000;
      if (i % 3 === 0) v = zoomAround(v, 0.5 + r * 1.5, r * W, (1 - r) * H, W, H);
      else v = panView(v, (r - 0.5) * 900, (0.5 - r) * 500, W, H);
      expect(covers(v)).toBe(true);
      expect(v.z).toBeGreaterThanOrEqual(1);
      expect(v.z).toBeLessThanOrEqual(MAX_MAP_ZOOM);
    }
  });

  it('el pellizco acerca y mueve a la vez: el punto bajo los dedos los sigue', () => {
    const start = zoomAround(IDENTITY_VIEW, 1.5, 300, 200, W, H);
    const startMid = { x: 400, y: 200 };
    const under = toLogical(start, startMid.x, startMid.y);
    const v = pinchView(start, 100, startMid, 160, { x: 380, y: 190 }, W, H);
    expect(v.z).toBeCloseTo(2.4);
    const now = toLogical(v, 380, 190);
    expect(now.x).toBeCloseTo(under.x);
    expect(now.y).toBeCloseTo(under.y);
  });

  it('alejar del todo vuelve a la vista completa', () => {
    const v = zoomAround(panView(zoomAround(IDENTITY_VIEW, 3, 100, 100, W, H), -200, -50, W, H), 0.1, 700, 300, W, H);
    expect(isIdentityView(v)).toBe(true);
    expect(clampView({ z: 1, tx: -30, ty: 12 }, W, H)).toEqual({ z: 1, tx: 0, ty: 0 });
  });
});
