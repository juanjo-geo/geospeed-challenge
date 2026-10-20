import { useEffect, useRef, useState } from 'react';

/**
 * Estados de la mascota.
 *  · Cabeza (isotipo aprobado, public/mascot/explorer.webp): idle · celebrate · fire · sad · wink.
 *    Se usan donde la mascota es un AVATAR o un logo (perfil, ranking, botón de cuenta, pantallas de
 *    cuenta); cada estado se distingue con un efecto CSS (.mascot-fx-*).
 *  · Cuerpo entero (poses del zip "mascota emociones" de JuanJo, 2026-10-20; public/mascot/poses/):
 *    happy (alegre) · cheer (salta con el puño arriba) · thinking (pensando) · confused (se rasca la
 *    cabeza) · surprised (sorprendido) · down (triste) · angry (molesto/decidido) · sleepy (dormido) ·
 *    reading (consulta un atlas con lupa). Se usan para reaccionar a lo que pasa en el juego.
 */
export type MascotState =
  | 'idle' | 'celebrate' | 'fire' | 'sad' | 'wink'
  | 'happy' | 'cheer' | 'thinking' | 'confused' | 'surprised' | 'down' | 'angry' | 'sleepy' | 'reading';

const EXPLORER = '/mascot/explorer.webp';
const pose = (name: string) => `/mascot/poses/${name}.webp`;

const SRC: Record<MascotState, string> = {
  idle: EXPLORER,
  celebrate: EXPLORER,
  fire: EXPLORER,
  sad: EXPLORER,
  wink: EXPLORER,
  happy: pose('happy'),
  cheer: pose('cheer'),
  thinking: pose('thinking'),
  confused: pose('confused'),
  surprised: pose('surprised'),
  down: pose('down'),
  angry: pose('angry'),
  sleepy: pose('sleepy'),
  reading: pose('reading'),
};

const EFFECT: Partial<Record<MascotState, string>> = {
  celebrate: 'mascot-fx-celebrate',
  fire: 'mascot-fx-fire',
  sad: 'mascot-fx-sad',
  wink: 'mascot-fx-wink',
};

/**
 * Reacción a una respuesta según la distancia (km) y la racha:
 * < 50 km o racha ≥ 3 cerca → salta · < 300 → alegre · < 1.000 → pensando ("¡bien!") ·
 * < 2.500 → confundido · < 5.000 → triste · más lejos → sorprendido ("¡¿al otro lado del mundo?!").
 */
export function reactionForDistance(km: number, streak = 0): MascotState {
  if (km < 50 || (streak >= 3 && km < 1000)) return 'cheer';
  if (km < 300) return 'happy';
  if (km < 1000) return 'thinking';
  if (km < 2500) return 'confused';
  if (km < 5000) return 'down';
  return 'surprised';
}

/** ¿Es una pose de cuerpo entero? (las de cabeza se usan como avatar) */
export const isBodyPose = (s: MascotState) => !['idle', 'celebrate', 'fire', 'sad', 'wink'].includes(s);

/** Las poses se descargan una vez, unos segundos después de abrir el juego (no compiten con la carga) */
let posesPreloaded = false;
function preloadPoses() {
  if (posesPreloaded || typeof Image === 'undefined') return;
  posesPreloaded = true;
  const run = () => new Set(Object.values(SRC)).forEach((s) => { const img = new Image(); img.decoding = 'async'; img.src = s; });
  setTimeout(run, 2500);
}

interface MascotProps {
  state?: MascotState;
  className?: string;
}

/** Mascota GeoSpeed — reacciona emocionalmente a los resultados (juice Capa 6). */
export default function Mascot({ state = 'idle', className = '' }: MascotProps) {
  const [pop, setPop] = useState(0);
  const prev = useRef<MascotState>(state);

  useEffect(() => { preloadPoses(); }, []);

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
