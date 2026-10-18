import { useEffect, useRef, useState } from 'react';

export type MascotState = 'idle' | 'celebrate' | 'fire' | 'sad' | 'wink';

/**
 * Rediseño v2: todas las poses usan el Explorador (isotipo aprobado, public/mascot/explorer.webp).
 * Mientras llega el set maestro de poses (tarea C2), cada estado se distingue con un efecto:
 * celebrar = salto + brillo amarillo, en racha = brillo naranja, triste = inclinado y apagado,
 * guiño = ladeado. Cuando existan las imágenes por pose, basta con cambiar SRC.
 */
const EXPLORER = '/mascot/explorer.webp';
const SRC: Record<MascotState, string> = {
  idle: EXPLORER,
  celebrate: EXPLORER,
  fire: EXPLORER,
  sad: EXPLORER,
  wink: EXPLORER,
};

const EFFECT: Record<MascotState, string> = {
  idle: '',
  celebrate: 'mascot-fx-celebrate',
  fire: 'mascot-fx-fire',
  sad: 'mascot-fx-sad',
  wink: 'mascot-fx-wink',
};

interface MascotProps {
  state?: MascotState;
  className?: string;
}

/** Mascota GeoSpeed — reacciona emocionalmente a los resultados (juice Capa 6). */
export default function Mascot({ state = 'idle', className = '' }: MascotProps) {
  const [pop, setPop] = useState(0);
  const prev = useRef<MascotState>(state);

  // Precarga las imágenes para que el cambio sea instantáneo (sin parpadeo)
  useEffect(() => {
    new Set(Object.values(SRC)).forEach((s) => { const img = new Image(); img.src = s; });
  }, []);

  useEffect(() => {
    if (prev.current !== state) { prev.current = state; setPop((p) => p + 1); }
  }, [state]);

  return (
    <img
      key={pop}
      src={SRC[state] || SRC.idle}
      alt="GeoSpeed"
      className={`object-contain select-none pointer-events-none animate-mascot-pop ${EFFECT[state] ?? ''} ${className}`}
      draggable={false}
    />
  );
}
