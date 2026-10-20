import Mascot, { type MascotState, isBodyPose } from './Mascot';

/**
 * El Explorador con un objeto delante y destellos (maquetas Historial = libro, Ranking = trofeo, Mis retos = portapapeles).
 * El tamaño del objeto sigue al de la mascota (unidades de contenedor), así que basta con darle ancho.
 */
const DEFAULT_POSE: Record<'book' | 'trophy' | 'clipboard', MascotState> = { book: 'reading', trophy: 'cheer', clipboard: 'happy' };

export default function PropExplorer({ prop, className, mascot }: { prop: 'book' | 'trophy' | 'clipboard'; className: string; mascot?: MascotState }) {
  // Poses de cuerpo entero (2026-10-20): la de "consultando" ya trae atlas y lupa, así que no se dibuja el 📖
  const pose = mascot && isBodyPose(mascot) ? mascot : DEFAULT_POSE[prop];
  const showProp = !(prop === 'book' && pose === 'reading');
  return (
    <div className={`relative [container-type:inline-size] ${className}`} aria-hidden>
      <Mascot state={pose} className="w-full drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]" />
      {!showProp ? null : prop === 'book' || prop === 'clipboard'
        ? <span className="absolute left-1/2 -translate-x-1/2 bottom-[0%] text-[40cqi] leading-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">{prop === 'book' ? '📖' : '📋'}</span>
        : <span className="absolute -left-[6%] bottom-[2%] text-[44cqi] leading-none -rotate-12 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">🏆</span>}
      <svg viewBox="0 0 40 22" className="absolute -left-[6%] top-[30%] w-[26%] text-primary -rotate-[30deg]" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"><path d="M7 19 3 8M20 17V3M33 19l4-11" /></svg>
      <svg viewBox="0 0 40 22" className="absolute -right-[6%] top-[30%] w-[26%] text-primary rotate-[30deg]" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"><path d="M7 19 3 8M20 17V3M33 19l4-11" /></svg>
    </div>
  );
}
