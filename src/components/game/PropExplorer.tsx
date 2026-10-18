import Mascot, { type MascotState } from './Mascot';

/**
 * El Explorador con un objeto delante y destellos (maquetas Historial = libro, Ranking = trofeo).
 * El tamaño del objeto sigue al de la mascota (unidades de contenedor), así que basta con darle ancho.
 */
export default function PropExplorer({ prop, className, mascot = 'wink' }: { prop: 'book' | 'trophy'; className: string; mascot?: MascotState }) {
  return (
    <div className={`relative [container-type:inline-size] ${className}`} aria-hidden>
      <Mascot state={mascot} className="w-full drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]" />
      {prop === 'book'
        ? <span className="absolute left-1/2 -translate-x-1/2 bottom-[0%] text-[40cqi] leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">📖</span>
        : <span className="absolute -left-[6%] bottom-[2%] text-[44cqi] leading-none -rotate-12 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">🏆</span>}
      <svg viewBox="0 0 40 22" className="absolute -left-[6%] top-[30%] w-[26%] text-primary -rotate-[30deg]" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"><path d="M7 19 3 8M20 17V3M33 19l4-11" /></svg>
      <svg viewBox="0 0 40 22" className="absolute -right-[6%] top-[30%] w-[26%] text-primary rotate-[30deg]" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"><path d="M7 19 3 8M20 17V3M33 19l4-11" /></svg>
    </div>
  );
}
