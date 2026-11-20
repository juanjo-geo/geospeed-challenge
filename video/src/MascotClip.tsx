/**
 * El Explorador animado: clips generados con Higgsfield (Seedance 2.0) con el fondo recortado por scripts/key_clip.py
 * (public/explorer_<id>/f000.webp … + meta.json).
 *  - a: cae, se agacha con una sonrisa, celebra con los dos puños, guiña y vuelve a saltar a la pose inicial.
 *  - b: se agacha y da un salto alto, cae, vuelve a saltar con el puño arriba y queda de pie.
 *  - Biblioteca de reacciones (src/explorerLib.ts): celebra, baile, saluda, te-reta, risa… Se reproducen a velocidad
 *    real (24 cuadros del clip por segundo) desde el cuadro `start` de cada una.
 */
import { Img, staticFile } from 'remotion';
import { EXPLORER_LIB, type LibClipId } from './explorerLib';

export type ClipId = 'a' | 'b' | LibClipId;

type Meta = { w: number; h: number; pose: { x: number; y: number; w: number; h: number }; feet: number; k: number; last: number };
// De meta.json: tamaño del recorte, caja del personaje en la pose inicial y línea del piso (px del clip, 720p)
const BASE = {
  a: { w: 409, h: 509, pose: { x: 45, y: 30, w: 344, h: 369 }, feet: 489, k: 0.98, last: 120, wide: [0, 120], tall: [0, 44] },
  b: { w: 430, h: 634, pose: { x: 53, y: 152, w: 343, h: 369 }, feet: 614, k: 0.9, last: 120, wide: [0, 120], tall: [58, 120] },
} as const;
const LIB_K = 0.95;

const meta = (clip: ClipId): Meta =>
  clip === 'a' || clip === 'b' ? BASE[clip] : { ...EXPLORER_LIB[clip], k: LIB_K };

/**
 * Cuadro del clip para un momento del cierre.
 * elapsed = cuadros del video desde que aparece; available = cuadros que quedan hasta el final;
 * tall = corte vertical (dura menos: solo cabe un tramo del clip).
 */
export function clipFrameAt(clip: ClipId, elapsed: number, available: number, tall = false): number {
  if (clip !== 'a' && clip !== 'b') {
    const m = EXPLORER_LIB[clip];
    return Math.min(m.last, m.start + Math.max(0, elapsed) * 0.8);   // 24 cuadros del clip por segundo de video (30)
  }
  const [from, to] = tall ? BASE[clip].tall : BASE[clip].wide;
  const p = Math.max(0, Math.min(1, elapsed / Math.max(1, available - 6)));   // los últimos cuadros se quedan en la pose final
  return Math.round(from + (to - from) * p);
}

/** box = lado del recuadro que ocupa en la composición (el piso del clip queda en su borde de abajo) */
export const MascotClip = ({ clip, clipFrame, box, style }: { clip: ClipId; clipFrame: number; box: number; style?: React.CSSProperties }) => {
  const m = meta(clip);
  const s = (box * m.k) / m.pose.h;
  const n = Math.max(0, Math.min(m.last, Math.round(clipFrame)));
  return (
    <div style={{ position: 'relative', width: box, height: box, transformOrigin: '50% 100%', ...style }}>
      <Img
        src={staticFile(`explorer_${clip}/f${String(n).padStart(3, '0')}.webp`)}
        style={{ position: 'absolute', width: m.w * s, height: m.h * s, maxWidth: 'none', left: box / 2 - (m.pose.x + m.pose.w / 2) * s, top: box - m.feet * s }}
      />
    </div>
  );
};
