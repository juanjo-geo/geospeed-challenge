/**
 * Zoom y paneo manuales del mapa (pellizco, rueda, botones −/+ y arrastre). La vista es afín:
 * pantalla = lógico × z + (tx, ty), con transform-origin en la esquina superior izquierda del lienzo.
 * El mapa acercado siempre cubre el contenedor, así que cualquier punto del lienzo se puede llevar a la vista
 * y tocar (antes el zoom de los botones no se podía mover y lo que quedaba fuera del cuadro no se alcanzaba).
 */
export type MapView = { z: number; tx: number; ty: number };
export type Pt = { x: number; y: number };

export const IDENTITY_VIEW: MapView = { z: 1, tx: 0, ty: 0 };
export const MAX_MAP_ZOOM = 4;
/** Píxeles que debe recorrer un dedo antes de que el toque sea arrastre y no respuesta */
export const DRAG_SLOP_TOUCH = 8;
export const DRAG_SLOP_MOUSE = 5;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampZ = (z: number) => clamp(z, 1, MAX_MAP_ZOOM);

/** Mantiene el mapa cubriendo el contenedor de w×h: sin bordes vacíos y sin poder sacarlo del cuadro */
export function clampView(v: MapView, w: number, h: number): MapView {
  const z = clampZ(v.z);
  return { z, tx: clamp(v.tx, w * (1 - z), 0), ty: clamp(v.ty, h * (1 - z), 0) };
}

/** Acerca o aleja dejando quieto el punto (fx, fy) de la pantalla (centro para los botones, cursor para la rueda) */
export function zoomAround(v: MapView, factor: number, fx: number, fy: number, w: number, h: number): MapView {
  const z = clampZ(v.z * factor);
  const k = z / v.z;
  return clampView({ z, tx: fx - (fx - v.tx) * k, ty: fy - (fy - v.ty) * k }, w, h);
}

/** Pellizco: el punto del mapa que estaba bajo el centro de los dedos al empezar sigue bajo el centro actual
 *  (acercar y mover a la vez sin soltar los dedos) */
export function pinchView(start: MapView, startDist: number, startMid: Pt, dist: number, mid: Pt, w: number, h: number): MapView {
  const z = clampZ(start.z * (dist / (startDist || 1)));
  const lx = (startMid.x - start.tx) / start.z;
  const ly = (startMid.y - start.ty) / start.z;
  return clampView({ z, tx: mid.x - lx * z, ty: mid.y - ly * z }, w, h);
}

/** Arrastre: mueve el mapa lo mismo que el dedo o el ratón desde el inicio del gesto */
export const panView = (start: MapView, dx: number, dy: number, w: number, h: number): MapView =>
  clampView({ z: start.z, tx: start.tx + dx, ty: start.ty + dy }, w, h);

/** Punto de la pantalla (relativo al contenedor) → punto del lienzo sin zoom (para convertir a lat/lon) */
export const toLogical = (v: MapView, x: number, y: number): Pt => ({ x: (x - v.tx) / v.z, y: (y - v.ty) / v.z });

export const isIdentityView = (v: MapView): boolean => v.z <= 1.001 && Math.abs(v.tx) < 0.5 && Math.abs(v.ty) < 0.5;

export const viewTransform = (v: MapView): string => `translate(${v.tx.toFixed(2)}px, ${v.ty.toFixed(2)}px) scale(${v.z.toFixed(4)})`;
