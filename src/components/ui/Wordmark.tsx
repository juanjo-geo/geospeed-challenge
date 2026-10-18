/**
 * Wordmark GEO·SPEED según las maquetas de oct 2026:
 * "GEO" blanco con relieve y "SPEED" turquesa con resplandor, en Fredoka Bold (estilos en index.css .wordmark).
 * Reemplaza las nueve copias del degradado dorado que había en los componentes.
 */
interface WordmarkProps {
  className?: string;
  /** Tamaño tipográfico (clases Tailwind de texto). Por defecto md. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
}

const SIZE_CLASS: Record<NonNullable<WordmarkProps['size']>, string> = {
  xs: 'text-base',
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl md:text-5xl',
  xl: 'text-4xl sm:text-5xl md:text-6xl',
  '2xl': 'text-5xl sm:text-6xl md:text-7xl',
  custom: '', // el tamaño lo pone className
};

export default function Wordmark({ className = '', size = 'md' }: WordmarkProps) {
  return (
    <span className={`wordmark ${SIZE_CLASS[size]} ${className}`} aria-label="GeoSpeed" role="img">
      <span className="wordmark-geo">GEO</span>
      <span className="wordmark-speed">SPEED</span>
    </span>
  );
}
