/**
 * Acercamiento CSS de la respuesta (WorldMapCanvas): tras tocar el mapa, el lienzo se escala hacia el clic
 * y luego hacia la respuesta. Aquí se decide cuánto y desde qué origen para que ni los pines ni sus
 * etiquetas ("Tu respuesta", "Ciudad correcta", la distancia, el rival) salgan del cuadro en ningún
 * momento. Todo en px del lienzo; `scale(z)` con `transform-origin` en `origin` manda el punto p a
 * p·z + origin·(1 − z).
 */
import { maxZoomKeeping, type Rect, type Pt } from './mapLabels';

// Menor que el margen con el que se ubican las etiquetas (4 px en layoutPills): una etiqueta pegada al
// borde del área no debe anular el acercamiento, solo quedarse donde está.
const MARGIN = 2;
const FRAME_MARGIN = 1;

export interface ZoomPlan {
  /** Factor del pico (sobre `origin`) */
  peak: number;
  /** Factor del golpe inicial (sobre el clic) */
  punch: number;
  /** Origen del pico: deja pines y etiquetas dentro, centrados en lo que sobra */
  origin: Pt;
}

/** Caja que envuelve los rectángulos */
export function bbox(rects: Rect[]): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Origen de `scale(z)` que deja la caja `b` dentro de W×H (con margen), centrada en el espacio sobrante */
export function framingOrigin(b: Rect, z: number, W: number, H: number): Pt {
  const axis = (p0: number, p1: number, size: number) => {
    if (z <= 1) return size / 2;
    // p·z + o·(1 − z) debe quedar entre MARGIN y size − MARGIN para p0 y p1
    const lo = (p1 * z - (size - MARGIN)) / (z - 1);
    const hi = (p0 * z - MARGIN) / (z - 1);
    return Math.min(Math.max((lo + hi) / 2, 0), size);
  };
  return { x: axis(b.x, b.x + b.w, W), y: axis(b.y, b.y + b.h, H) };
}

/**
 * Planifica el acercamiento: el mayor factor (≤ `peak`) con el que todo `keep` cabe en el cuadro, el
 * origen que lo centra y el golpe inicial sobre el clic (un 6 % más, sin sacar nada). null si casi no
 * acercaría (< ×1,08): mejor dejar el mapa quieto.
 */
export function planAnswerZoom(keep: Rect[], click: Pt, peak: number, W: number, H: number): ZoomPlan | null {
  if (!keep.length) return null;
  const b = bbox(keep);
  const z = Math.min(peak, (W - 2 * MARGIN) / b.w, (H - 2 * MARGIN) / b.h);
  if (!(z >= 1.08)) return null;
  const punch = Math.max(1, Math.min(z * 1.06, z + 0.15, maxZoomKeeping(keep, click, W, H, MARGIN)));
  return { peak: z, punch, origin: framingOrigin(b, z, W, H) };
}

/** Factor de un cuadro de la animación: nunca más de lo que mantiene todo dentro con el origen de ese cuadro */
export const clampZoomFrame = (keep: Rect[], origin: Pt, z: number, W: number, H: number): number =>
  Math.max(1, Math.min(z, maxZoomKeeping(keep, origin, W, H, FRAME_MARGIN)));
