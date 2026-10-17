import { useState } from 'react';
import { flagUrl } from '@/lib/flags';

interface FlagProps {
  /** Nombre del país (español del catálogo o inglés del mapa) */
  country: string | undefined | null;
  className?: string;
}

/** Bandera 3:2 en SVG local. Si el país no tiene código o la imagen falla, no ocupa espacio. */
export default function Flag({ country, className = 'w-7' }: FlagProps) {
  const [failed, setFailed] = useState(false);
  const src = flagUrl(country);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`aspect-[3/2] object-cover rounded-[3px] shadow-sm ring-1 ring-black/20 shrink-0 ${className}`}
    />
  );
}
