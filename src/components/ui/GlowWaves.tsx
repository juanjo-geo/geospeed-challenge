import { useId } from 'react';

/**
 * Ondas de luz turquesa al pie de la pantalla (maquetas Carga, Girar y Cuenta regresiva).
 * Va en un contenedor relativo; ocupa el ancho completo y el alto que diga `className`.
 */
export default function GlowWaves({ className = 'h-[30%]' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`absolute inset-x-0 bottom-0 w-full pointer-events-none ${className}`} viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.09" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M0,170 C260,90 520,260 820,190 C1080,130 1260,200 1440,150 L1440,400 L0,400 Z" fill={`url(#${id}-fill)`} />
      <g fill="none" filter={`url(#${id}-glow)`}>
        <path d="M0,150 C280,60 560,250 860,180 C1100,125 1280,190 1440,140" stroke="hsl(var(--accent) / 0.9)" strokeWidth="3" />
        <path d="M0,210 C300,130 580,300 880,235 C1120,185 1300,250 1440,205" stroke="hsl(var(--accent) / 0.6)" strokeWidth="2.5" />
        <path d="M0,270 C260,210 600,350 900,290 C1140,245 1300,300 1440,270" stroke="hsl(205 90% 60% / 0.55)" strokeWidth="2" />
        <path d="M0,330 C320,280 640,390 940,345 C1160,315 1320,350 1440,330" stroke="hsl(var(--accent) / 0.35)" strokeWidth="2" />
      </g>
    </svg>
  );
}
