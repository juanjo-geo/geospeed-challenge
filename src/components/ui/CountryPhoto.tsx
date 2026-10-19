import { useState } from 'react';
import { countryPhotoUrl, photoKnownMissing, markPhotoMissing, type PhotoSize } from '@/lib/countryPhotos';

interface CountryPhotoProps {
  country: string | null | undefined;
  size?: PhotoSize;
  /** Clases del contenedor (define alto/ancho y bordes). */
  className?: string;
  /** Degradado inferior para poner texto encima */
  overlay?: boolean;
  children?: React.ReactNode;
}

/**
 * Foto del país (D7). Si el país no tiene foto, no renderiza nada.
 * El recuadro ocupa su espacio DESDE EL PRINCIPIO (fondo azul mientras carga) y la imagen aparece con
 * un fundido: antes el recuadro estaba oculto hasta que la imagen cargaba y la tarjeta de respuesta
 * "saltaba" de pequeña a grande en el iPhone. Si el archivo falla, el recuadro se cierra.
 * Sin loading="lazy" (en un contenedor oculto Chrome no la cargaba nunca).
 */
export default function CountryPhoto({ country, size = 'lg', className = '', overlay = true, children }: CountryPhotoProps) {
  const url = countryPhotoUrl(country, size);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url || photoKnownMissing(url)) return null;
  const loaded = loadedUrl === url;
  return (
    <div className={`relative overflow-hidden shrink-0 bg-brand-navy-deep/70 ${className}`} aria-hidden>
      <img
        key={url}
        src={url}
        alt=""
        decoding="async"
        onLoad={() => setLoadedUrl(url)}
        onError={() => { markPhotoMissing(url); setFailedUrl(url); }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {overlay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(var(--brand-navy-deep) / 0) 35%, hsl(var(--brand-navy-deep) / 0.85) 100%)' }} />}
      {children && <div className="absolute inset-x-0 bottom-0 p-2">{children}</div>}
    </div>
  );
}
