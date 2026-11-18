/**
 * El Explorador animado del cierre: clip generado con Higgsfield (Seedance 2.0) a partir de la pose de celebración,
 * con el fondo recortado por scripts/key_clip.py (public/explorer_a|b/f000.webp … + meta.json).
 *  - a: cae, se agacha con una sonrisa, celebra con los dos puños, guiña y vuelve a saltar a la pose inicial.
 *  - b: se agacha y da un salto alto, cae, vuelve a saltar con el puño arriba y queda de pie.
 */
import { Img, staticFile } from 'remotion';

export type ClipId = 'a' | 'b';

// De meta.json: tamaño del recorte, caja del personaje en la pose inicial y línea del piso (px del clip, 720p)
const META = {
  a: { w: 409, h: 509, pose: { x: 45, y: 30, w: 344, h: 369 }, feet: 489, k: 0.98, wide: [0, 120], tall: [0, 44] },
  b: { w: 430, h: 634, pose: { x: 53, y: 152, w: 343, h: 369 }, feet: 614, k: 0.9, wide: [0, 120], tall: [58, 120] },
} as const;
const LAST = 120;

/**
 * Cuadro del clip para un momento del cierre.
 * elapsed = cuadros del video desde que aparece; available = cuadros que quedan hasta el final;
 * tall = corte vertical (dura menos: solo cabe un tramo del clip).
 */
export function clipFrameAt(clip: ClipId, elapsed: number, available: number, tall = false): number {
  const [from, to] = tall ? META[clip].tall : META[clip].wide;
  const p = Math.max(0, Math.min(1, elapsed / Math.max(1, available - 6)));   // los últimos cuadros se quedan en la pose final
  return Math.round(from + (to - from) * p);
}

/** box = lado del recuadro que ocupa en la composición (el piso del clip queda en su borde de abajo) */
export const MascotClip = ({ clip, clipFrame, box, style }: { clip: ClipId; clipFrame: number; box: number; style?: React.CSSProperties }) => {
  const m = META[clip];
  const s = (box * m.k) / m.pose.h;
  const n = Math.max(0, Math.min(LAST, Math.round(clipFrame)));
  return (
    <div style={{ position: 'relative', width: box, height: box, transformOrigin: '50% 100%', ...style }}>
      <Img
        src={staticFile(`explorer_${clip}/f${String(n).padStart(3, '0')}.webp`)}
        style={{ position: 'absolute', width: m.w * s, height: m.h * s, maxWidth: 'none', left: box / 2 - (m.pose.x + m.pose.w / 2) * s, top: box - m.feet * s }}
      />
    </div>
  );
};
