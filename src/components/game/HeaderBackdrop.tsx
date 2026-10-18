import { lazy, Suspense } from 'react';
import { LegendPin } from '@/components/ui/icons';
// Trae los polígonos del mapa: siempre diferido
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

/**
 * Mapa nocturno tenue con pines detrás de la cabecera de las pantallas de progreso
 * (maquetas Perfil, Historial y Ranking). Va como primer hijo de un contenedor `relative`;
 * el contenido que sigue necesita `relative` para quedar encima.
 */
export default function HeaderBackdrop({ className = 'h-[420px] md:h-[360px]', pins = 'side' }: { className?: string; /** side = a los lados del título centrado (Perfil); top = entre la barra y un título a la izquierda (Historial, Ranking) */ pins?: 'side' | 'top' }) {
  return (
    <div className={`absolute inset-x-0 top-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)] ${className}`} aria-hidden>
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[260vw] md:w-[120vw] h-full opacity-80">
        <Suspense fallback={null}><WorldBackdrop tone="night" /></Suspense>
      </div>
      {pins === 'side' ? (
        <>
          <LegendPin color="hsl(var(--accent))" className="absolute left-[8%] top-[150px] w-7 h-7 opacity-80" />
          <LegendPin color="hsl(var(--accent))" className="absolute left-[38%] top-[95px] w-6 h-6 opacity-70 hidden md:block" />
          <LegendPin color="hsl(var(--accent))" className="absolute right-[9%] top-[120px] w-7 h-7 opacity-80" />
        </>
      ) : (
        <>
          <LegendPin color="hsl(var(--accent))" className="absolute left-[14%] top-[62px] md:top-[150px] w-6 h-6 opacity-75" />
          <LegendPin color="hsl(var(--accent))" className="absolute left-[36%] top-[58px] md:top-[110px] w-6 h-6 opacity-75" />
          <LegendPin color="hsl(var(--accent))" className="absolute left-[62%] top-[66px] md:left-[58%] md:top-[150px] w-6 h-6 opacity-75" />
        </>
      )}
    </div>
  );
}
