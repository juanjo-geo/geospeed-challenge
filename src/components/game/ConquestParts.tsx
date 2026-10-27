import { useCallback, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { ConqError, type ConqErrorCode } from '@/lib/conquest';
import { BRAND_RGB, rgba } from '@/lib/theme';
import { HomeIcon } from '@/components/ui/icons';
import { PlayerFace } from './RoomParts';

/** Piezas que comparten las pantallas de Conquista (grupos y sala, tablero y ficha, práctica) */

export function useErrText() {
  const { t } = useI18n();
  return useCallback((code: ConqErrorCode | null | undefined) => (code ? t(`cq_err_${code}` as never) : ''), [t]);
}
export const errCode = (e: unknown): ConqErrorCode => (e instanceof ConqError ? e.code : 'network');

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg px-3 pt-4 sm:px-4 sm:pt-6 md:px-6">
      <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} animate-fade-in-up flex flex-col gap-4 pb-6`} style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        {children}
      </div>
    </div>
  );
}
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border-2 border-accent/50 bg-card/80 p-4 sm:p-5 ${className}`}>{children}</section>
);
export const ErrorBox = ({ text }: { text: string }) => (text ? <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-center" role="alert">{text}</p> : null);
export const CtaButton = ({ children, onClick, disabled = false, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) => (
  <button type={type} onClick={onClick} disabled={disabled} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>
    {children}
  </button>
);

export function BackHome({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button onClick={() => { playButtonTap(); onClick(); }} className="mt-1 inline-flex items-center gap-2 rounded-2xl border-2 border-foreground/30 px-5 py-2.5 font-bold hover:bg-muted/50">
      <HomeIcon className="w-5 h-5" /> {t('cq_back')}
    </button>
  );
}

/** Cara del jugador con el anillo de su color en el tablero (amarillo yo, cada rival el suyo) */
export function ConqFace({ player, color, size = 'sm' }: { player: { avatar: string | null; slot: number }; color?: string; size?: 'sm' | 'lg' }) {
  return (
    <span className="shrink-0 rounded-full inline-flex" style={color ? { boxShadow: `0 0 0 3px ${color}` } : undefined}>
      <PlayerFace player={player} size={size} />
    </span>
  );
}

/** Muestra de color de la leyenda: el color del jugador con su trama (la misma del mapa) */
export function Swatch({ color, pattern }: { color: string; pattern?: 'stripes' | 'dots' | 'cross' | null }) {
  const ink = rgba(BRAND_RGB.navyDeep, 0.5);
  const bg = pattern === 'stripes' ? `repeating-linear-gradient(135deg, ${ink} 0 2px, transparent 2px 5px)`
    : pattern === 'dots' ? `radial-gradient(${ink} 1.2px, transparent 1.4px) 0 0 / 5px 5px`
    : pattern === 'cross' ? `repeating-linear-gradient(45deg, ${ink} 0 1.5px, transparent 1.5px 5px), repeating-linear-gradient(135deg, ${ink} 0 1.5px, transparent 1.5px 5px)`
    : null;
  return <span aria-hidden className="inline-block w-4 h-4 rounded-full ring-1 ring-white/40 shrink-0" style={{ background: bg ? `${bg}, ${color}` : color }} />;
}
