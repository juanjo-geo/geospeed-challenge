import Mascot from './Mascot';
import type { RoomPlayer } from '@/lib/rooms';

/** Piezas de la sala en vivo que comparten la espera, la partida y el resultado */
export const formatPin = (pin: string) => `${pin.slice(0, 3)} ${pin.slice(3)}`;

/** Avatar del jugador: su emoji o el Explorador con un color distinto por puesto */
export function PlayerFace({ player, size = 'sm' }: { player: Pick<RoomPlayer, 'avatar' | 'slot'>; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-14 h-14 text-3xl short:w-11 short:h-11 short:text-2xl' : 'w-9 h-9 text-xl short:w-7 short:h-7 short:text-base';
  return (
    <span className={`${cls} shrink-0 rounded-full border-2 border-accent/60 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--brand-navy-card)),hsl(var(--brand-navy-deep)))] flex items-center justify-center overflow-hidden`} aria-hidden>
      {player.avatar && player.avatar !== 'mascot'
        ? <span>{player.avatar}</span>
        : <span className="block w-[82%]" style={{ filter: `hue-rotate(${(player.slot * 47) % 360}deg)` }}><Mascot state="idle" className="w-full" /></span>}
    </span>
  );
}
