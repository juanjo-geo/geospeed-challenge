import { useState } from 'react';

/**
 * Imagen que desaparece si no carga, en vez de dejar el ícono de imagen rota.
 * Para las fotos que se piden por internet (monumentos en la pregunta de la partida).
 */
export default function SafeImg({ src, className = '', alt = '' }: { src: string | null | undefined; className?: string; alt?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return null;
  return <img src={src} alt={alt} decoding="async" onError={() => setFailed(src)} className={className} />;
}
