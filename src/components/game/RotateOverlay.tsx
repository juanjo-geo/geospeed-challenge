import { lazy, Suspense } from 'react';
import Wordmark from '@/components/ui/Wordmark';
import GlowWaves from '@/components/ui/GlowWaves';
import Mascot from './Mascot';
// Los mapas de las pantallas traen los polígonos: aparte, para no cargarlos con Index
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

/**
 * Aviso de giro (maqueta GeoSpeed_Girar_APROBADA_v1): teléfono vertical apagado → flecha →
 * teléfono horizontal con el mapa encendido y el Explorador asomándose, título, "Esperando el giro…",
 * ondas de luz y "Volver al inicio". Sin detección propia: el padre controla la visibilidad.
 */
export default function RotateOverlay({ t, beforeCountdown, onBack }: { t: (key: string) => string; beforeCountdown: boolean; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center min-h-[100dvh] text-center px-6 overflow-hidden" style={{ background: 'hsl(var(--brand-navy-deep))' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 30%, hsl(212 80% 24%) 0%, hsl(var(--brand-navy)) 55%, transparent 100%)' }}
        aria-hidden
      />
      <GlowWaves className="h-[26%]" />

      <div className="relative flex flex-col items-center w-full">
        <div className="flex items-center gap-2 mb-[3dvh]">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-11 h-11 object-contain" />
          <Wordmark size="md" />
        </div>

        {/* Ilustración: vertical → horizontal */}
        <div className="relative w-[min(86vw,44dvh,380px)] aspect-[10/8]" aria-hidden>
          {/* Teléfono vertical (antes) */}
          <div className="absolute left-[2%] top-0 w-[30%] aspect-[9/17] -rotate-6 rounded-[16%] border-2 border-accent/40 bg-background/60 p-[5%] opacity-55">
            <div className="w-full h-full rounded-[12%] overflow-hidden flex items-center">
              <div className="w-full aspect-[2/1]">
                <Suspense fallback={null}><WorldBackdrop tone="vivid" /></Suspense>
              </div>
            </div>
          </div>
          {/* Flecha de giro */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 80" fill="none">
            <defs>
              <marker id="rotate-arrow-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--accent))" />
              </marker>
            </defs>
            <path d="M30,14 C46,4 60,10 64,30" stroke="hsl(var(--accent))" strokeWidth="3.2" strokeLinecap="round" markerEnd="url(#rotate-arrow-head)" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--accent) / 0.8))' }} />
          </svg>
          {/* Teléfono horizontal (después) */}
          <div className="absolute left-[12%] top-[40%] w-[78%] aspect-[17/8.4] -rotate-3 rounded-[11%/22%] border-[3px] border-foreground/85 bg-background p-[2.2%] shadow-[0_0_28px_hsl(var(--accent)/0.55)]">
            <div className="w-full h-full rounded-[8%/16%] overflow-hidden">
              <Suspense fallback={<div className="w-full h-full" style={{ background: 'hsl(var(--brand-navy))' }} />}>
                <WorldBackdrop tone="vivid" />
              </Suspense>
            </div>
          </div>
          {/* El Explorador se asoma y celebra el giro */}
          <svg className="absolute left-[64%] top-[6%] w-[9%]" viewBox="0 0 20 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.4" strokeLinecap="round"><path d="M10 2v5" /><path d="M3 7l3.5 3" /><path d="M17 7l-3.5 3" /></svg>
          <div className="absolute left-[70%] top-[14%] w-[27%]">
            <Mascot state="idle" className="w-full animate-mascot-float drop-shadow-[0_8px_18px_hsl(var(--brand-navy-deep)/0.7)]" />
          </div>
        </div>

        <p className="mt-[3dvh] text-[min(10vw,5.2dvh,2.75rem)] font-extrabold leading-tight">
          {t('rotate_titleLead')} <span className="text-primary">{t('rotate_titleTail')}</span>
        </p>
        <p className="text-[min(4.2vw,2.2dvh,1.1rem)] font-semibold text-foreground/85 mt-1">{t('rotate_sub')}</p>

        <div className="mt-[3dvh] w-[min(80vw,22rem)] py-3 rounded-2xl border-2 border-accent/70 bg-background/40 shadow-[0_0_18px_hsl(var(--accent)/0.25)] flex flex-col items-center gap-1">
          <svg viewBox="0 0 48 28" className="w-12 h-7 text-foreground/90 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <rect x="13" y="6" width="22" height="16" rx="3" />
            <path d="M6 9a10 10 0 0 0 0 10" stroke="hsl(var(--accent))" /><path d="M4 19l2 0 0-2" stroke="hsl(var(--accent))" />
            <path d="M42 19a10 10 0 0 0 0-10" stroke="hsl(var(--accent))" /><path d="M44 9l-2 0 0 2" stroke="hsl(var(--accent))" />
          </svg>
          <span className="text-accent font-bold text-base">{t('rotate_waiting')}</span>
        </div>
        {beforeCountdown && <p className="text-xs text-muted-foreground mt-3">{t('rotate_countdownAfter')}</p>}

        <button onClick={onBack} className="mt-[5dvh] px-12 py-3 rounded-full border border-foreground/30 bg-background/80 backdrop-blur-sm text-sm font-bold hover:bg-muted transition-colors active:scale-[0.97]">
          {t('rotate_back')}
        </button>
      </div>
    </div>
  );
}
