import { useEffect, useRef, useState } from 'react';

export type MascotState = 'idle' | 'celebrate' | 'fire' | 'sad' | 'wink';

const SRC: Record<MascotState, string> = {
  idle: '/mascot/idle.png',
  celebrate: '/mascot/celebrate.png',
  fire: '/mascot/fire.png',
  sad: '/mascot/sad.png',
  wink: '/mascot/wink.png',
};

interface MascotProps {
  state?: MascotState;
  className?: string;
}

/** Mascota GeoSpeed — reacciona emocionalmente a los resultados (juice Capa 6). */
export default function Mascot({ state = 'idle', className = '' }: MascotProps) {
  const [pop, setPop] = useState(0);
  const prev = useRef<MascotState>(state);

  // Precarga todos los estados para que el cambio sea instantáneo (sin parpadeo)
  useEffect(() => {
    Object.values(SRC).forEach((s) => { const img = new Image(); img.src = s; });
  }, []);

  useEffect(() => {
    if (prev.current !== state) { prev.current = state; setPop((p) => p + 1); }
  }, [state]);

  return (
    <img
      key={pop}
      src={SRC[state] || SRC.idle}
      alt="GeoSpeed"
      className={`object-contain select-none pointer-events-none animate-mascot-pop ${className}`}
      draggable={false}
    />
  );
}
