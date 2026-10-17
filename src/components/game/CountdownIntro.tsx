import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import Mascot from './Mascot';

interface CountdownIntroProps {
  /** Número actual: 3, 2, 1 o 0 (0 = ¡GO!). */
  count: number;
  /** Etiqueta superior (ej. "Clásico · Mundo · Turista"). Opcional. */
  label?: string;
  /** Cancelar y volver al inicio (maqueta Cuenta_Regresiva_APROBADA_v1). Opcional. */
  onCancel?: () => void;
}

/**
 * CountdownIntro — Cuenta regresiva 3-2-1-GO unificada para TODOS los modos.
 * Es solo presentación: el temporizador (3→2→1→0) lo maneja cada modo y va
 * pasando el valor por `count`. Así el visual es idéntico en Clásico, Mundial,
 * Caos y Diario.
 */
export default function CountdownIntro({ count, label, onCancel }: CountdownIntroProps) {
  const { t } = useI18n();
  const isGo = count <= 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] game-bg overflow-hidden">
      {/* Barra superior: marca · etiqueta del modo */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 sm:px-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <div className="flex items-center gap-2 animate-fade-in">
          <img src="/logo.png" alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <Wordmark size="sm" />
        </div>
        {label && (
          <p className="hidden sm:block px-4 py-1.5 rounded-full border border-accent/40 text-xs sm:text-sm font-bold text-muted-foreground animate-fade-in">
            {label}
          </p>
        )}
        <span className="w-10" aria-hidden />
      </div>
      {label && (
        <p className="sm:hidden absolute top-14 px-3 py-1 rounded-full border border-accent/40 text-[11px] font-bold text-muted-foreground animate-fade-in">
          {label}
        </p>
      )}

      <p className="text-3xl sm:text-5xl short:text-3xl font-black mb-2 sm:mb-4 short:mb-1 animate-fade-in">{isGo ? t('countdown_go') : t('countdown_title')}</p>

      <div className="relative flex items-center justify-center">
        {isGo && (
          <div
            className="absolute w-24 h-24 rounded-full border-4 animate-ring-expand"
            style={{ borderColor: 'hsl(var(--accent))' }}
          />
        )}
        <div className="absolute w-40 h-40 sm:w-56 sm:h-56 short:w-36 short:h-36 rounded-full border-4 border-accent/50" aria-hidden />
        <div
          key={count}
          className={`font-black font-mono ${isGo
            ? 'text-7xl sm:text-9xl md:text-[10rem] short:text-6xl animate-go-impact'
            : 'text-8xl sm:text-9xl short:text-7xl animate-countdown-zoom'
          }`}
          style={{ color: 'hsl(var(--primary))', textShadow: '0 6px 0 hsl(var(--primary-deep))' }}
        >
          {isGo ? t('countdown_goShort') : count}
        </div>
        <Mascot state={isGo ? 'celebrate' : 'wink'} className="absolute -right-24 sm:-right-36 short:-right-28 w-16 sm:w-24 short:w-16 animate-mascot-float" />
      </div>

      <p className="text-muted-foreground mt-6 sm:mt-8 short:mt-4 text-sm sm:text-base animate-fade-in">
        {t('countdown_ready')}
      </p>

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
