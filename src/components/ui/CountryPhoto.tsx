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
 * Foto del país (D7). Si no hay archivo para ese país, no renderiza nada: la interfaz
 * se ve igual que antes de tener fotos. Decoding async para no competir con el mapa.
 * Sin loading="lazy": el contenedor está oculto (display:none) hasta que la imagen carga y Chrome
 * nunca carga una imagen diferida que no se renderiza, así que la foto no aparecía jamás.
 */
export default function CountryPhoto({ country, size = 'lg', className = '', overlay = true, children }: CountryPhotoProps) {
  const url = countryPhotoUrl(country, size);
  const [failed, setFailed] = useState(() => !url || photoKnownMissing(url));
  const [loaded, setLoaded] = useState(false);
  if (!url || failed) return null;
  return (
    <div className={`relative overflow-hidden shrink-0 ${className} ${loaded ? '' : 'hidden'}`} aria-hidden>
      <img
        src={url}
        alt=""
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { markPhotoMissing(url); setFailed(true); }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {overlay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(var(--brand-navy-deep) / 0) 35%, hsl(var(--brand-navy-deep) / 0.85) 100%)' }} />}
      {children && <div className="absolute inset-x-0 bottom-0 p-2">{children}</div>}
    </div>
  );
}
