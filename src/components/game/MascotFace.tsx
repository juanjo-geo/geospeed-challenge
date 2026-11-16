import Mascot from './Mascot';
import { mascotFilter } from '@/lib/avatars';

/**
 * El Explorador como avatar, en el color que eligió el jugador ('mascot:<color>'). El filtro va en un span envolvente:
 * las clases .mascot-fx-* de Mascot ya usan `filter` en la imagen y lo pisarían.
 * @param fallbackFilter  tinte cuando el avatar es el amarillo de siempre (p. ej. el turquesa del rival)
 */
export default function MascotFace({ avatar, className = 'w-[80%]', state = 'wink', fallbackFilter }: {
  avatar: string | null | undefined;
  className?: string;
  state?: 'idle' | 'wink' | 'celebrate';
  fallbackFilter?: string;
}) {
  const filter = mascotFilter(avatar) ?? fallbackFilter ?? null;
  return (
    <span className={`inline-flex justify-center ${className}`} style={filter ? { filter } : undefined}>
      <Mascot state={state} className="w-full" />
    </span>
  );
}
