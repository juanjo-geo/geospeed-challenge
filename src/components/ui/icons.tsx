/**
 * Íconos de línea de las maquetas v2 (repaso de ciudades, cierre, retos). Heredan el color con
 * `currentColor`; el tamaño lo da `className`.
 */
type P = { className?: string };
const base = 'shrink-0';

export const PinIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="currentColor" aria-hidden><path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Zm0-9.6a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" /></svg>
);
export const StopwatchIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.8" /><path d="M9.5 2.5h5" /><path d="M12 2.5v3.5" /></svg>
);
export const HomeIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="currentColor" aria-hidden><path d="M12 3.2 2.5 11.5h2.8V20h5v-5.5h3.4V20h5v-8.5h2.8Z" /></svg>
);
export const ChevronIcon = ({ className = 'w-5 h-5', dir = 'right' }: P & { dir?: 'left' | 'right' | 'down' }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className} ${dir === 'left' ? 'rotate-180' : dir === 'down' ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
);
export const ArrowRightIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></svg>
);
export const BookIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="currentColor" aria-hidden><path d="M2 5.5C4.5 4 8 4 11 5.6V20c-3-1.5-6.5-1.5-9 0V5.5Zm11 .1C16 4 19.5 4 22 5.5V20c-2.5-1.5-6-1.5-9 0V5.6Z" /></svg>
);
export const CityIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="currentColor" aria-hidden><path d="M3 21V10h4v11H3Zm5 0V4h5v17H8Zm6 0V8h3v13h-3Zm4 0v-7h3v7h-3Z" /></svg>
);
export const TrophyIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="currentColor" aria-hidden><path d="M7 3h10v2h3v2.5A4.5 4.5 0 0 1 16.2 12 5 5 0 0 1 13 14.7V17h3v3H8v-3h3v-2.3A5 5 0 0 1 7.8 12 4.5 4.5 0 0 1 4 7.5V5h3V3Zm0 4H6v.5a2.5 2.5 0 0 0 1.4 2.3A6 6 0 0 1 7 8V7Zm10 0v1c0 .6-.1 1.2-.4 1.8A2.5 2.5 0 0 0 18 7.5V7h-1Z" /></svg>
);
export const InfinityIcon = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4Zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4Z" /></svg>
);
/** Pin de leyenda del mapa: gota de color con borde blanco */
export const LegendPin = ({ color, className = 'w-4 h-4' }: P & { color: string }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} aria-hidden>
    <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" fill={color} stroke="white" strokeWidth="1.5" />
    <circle cx="12" cy="9.5" r="2.6" fill="white" />
  </svg>
);
