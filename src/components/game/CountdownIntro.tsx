import { lazy, Suspense } from 'react';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import GlowWaves from '@/components/ui/GlowWaves';
import Mascot from './Mascot';
// El mapa de fondo trae los polígonos: aparte, para no cargarlo con Index
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

interface CountdownIntroProps {
  /** Número actual: 3, 2, 1 o 0 (0 = ¡GO!). */
  count: number;
  /** Etiqueta superior (ej. "Clásico · Mundo · Turista"). Opcional. */
  label?: string;
  /** Cancelar y volver al inicio (maqueta Cuenta_Regresiva_APROBADA_v1). Opcional. */
  onCancel?: () => void;
}

/** Marcas amarillas alrededor del anillo (diagonales, como en la maqueta). */
const TICKS = [-45, 45, 135, 225];

/**
 * CountdownIntro — Cuenta regresiva 3-2-1-GO unificada para TODOS los modos
 * (maqueta GeoSpeed_Cuenta_Regresiva_APROBADA_v1): mapa tenue de fondo, ondas de luz, "¡Prepárate!",
 * número amarillo grande dentro de un anillo turquesa con marcas, el Explorador al lado y Cancelar.
 * Es solo presentación: el temporizador (3→2→1→0) lo maneja cada modo y va pasando el valor por `count`.
 */
export default function CountdownIntro({ count, label, onCancel }: CountdownIntroProps) {
  const { t } = useI18n();
  const isGo = count <= 0;
  // "Clásico · Mundo · Turista": la región (parte central) va en amarillo
  const labelParts = label ? label.split(' · ') : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] overflow-hidden" style={{ background: 'hsl(var(--brand-navy-deep))' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65% 60% at 50% 45%, hsl(212 80% 24%) 0%, hsl(var(--brand-navy)) 55%, transparent 100%)' }}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-[6%] bottom-[4%] pointer-events-none" aria-hidden>
        <Suspense fallback={null}>
          <WorldBackdrop tone="faint" />
        </Suspense>
      </div>
      <GlowWaves className="h-[30%] landscape:h-[34%]" />

      {/* Barra superior: marca · etiqueta del modo */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between gap-2 px-4 sm:px-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <div className="flex items-center gap-2 animate-fade-in">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
          <Wordmark size="sm" />
        </div>
        {label && (
          <p className="hidden sm:block short:block px-5 short:px-3 py-1.5 short:py-1 rounded-full border border-accent/50 bg-background/40 text-sm short:text-xs font-semibold whitespace-nowrap animate-fade-in">
            {labelParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="text-muted-foreground mx-1.5">·</span>}
                <span className={i === 1 ? 'text-primary' : 'text-foreground'}>{part}</span>
              </span>
            ))}
          </p>
        )}
        <span className="w-11" aria-hidden />
      </div>
      {label && (
        <p className="sm:hidden short:hidden absolute top-16 px-3 py-1 rounded-full border border-accent/50 bg-background/40 text-[11px] font-semibold animate-fade-in">
          {labelParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted-foreground mx-1">·</span>}
              <span className={i === 1 ? 'text-primary' : 'text-foreground'}>{part}</span>
            </span>
          ))}
        </p>
      )}

      <div className="relative flex flex-col items-center landscape:mt-[4dvh]">
        <p className="font-extrabold leading-none text-[min(12vw,10dvh,4.75rem)] drop-shadow-[0_4px_14px_hsl(var(--brand-navy-deep)/0.8)] animate-fade-in">
          {isGo ? t('countdown_go') : t('countdown_title')}
        </p>

        {/* Anillo con el número; el Explorador se asoma por la derecha */}
        <div className="relative mt-[2.5dvh] w-[min(58vw,46dvh,19rem)] aspect-square flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3px] border-accent/90 shadow-[0_0_24px_hsl(var(--accent)/0.55),inset_0_0_24px_hsl(var(--accent)/0.25)]" aria-hidden />
          {TICKS.map(a => (
            <span key={a} className="absolute inset-0" style={{ transform: `rotate(${a}deg)` }} aria-hidden>
              <span className="absolute left-1/2 -top-[9%] w-[4%] h-[13%] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]" />
            </span>
          ))}
          {isGo && (
            <span className="absolute inset-[18%] rounded-full border-4 animate-ring-expand" style={{ borderColor: 'hsl(var(--accent))' }} aria-hidden />
          )}
          <span
            key={count}
            className={`relative font-black leading-none ${isGo
              ? 'text-[min(20vw,16dvh,6.5rem)] animate-go-impact'
              : 'text-[min(50vw,40dvh,16rem)] animate-countdown-zoom'
            }`}
            style={{ color: 'hsl(var(--primary))', textShadow: '0 0.05em 0 hsl(var(--primary-deep)), 0 0.1em 0.3em hsl(var(--brand-navy-deep) / 0.6)' }}
          >
            {isGo ? t('countdown_goShort') : count}
          </span>
          <div className="absolute left-[86%] top-[22%] w-[56%]">
            <Mascot state={isGo ? 'celebrate' : 'idle'} className="w-full animate-mascot-float drop-shadow-[0_10px_22px_hsl(var(--brand-navy-deep)/0.7)]" />
          </div>
        </div>

        <p className="mt-[3dvh] font-semibold text-foreground/90 text-[min(4.4vw,4.2dvh,1.3rem)] text-center px-6 animate-fade-in">
          {t('countdown_ready')}
        </p>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute left-4 sm:left-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          {t('cancel')}
        </button>
      )}
    </div>
  );
}
