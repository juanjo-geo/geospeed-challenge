import { useI18n } from '@/i18n';

interface CountdownIntroProps {
  /** Número actual: 3, 2, 1 o 0 (0 = ¡GO!). */
  count: number;
  /** Etiqueta superior (ej. "Clásico — Medio"). Opcional. */
  label?: string;
}

/**
 * CountdownIntro — Cuenta regresiva 3-2-1-GO unificada para TODOS los modos.
 * Es solo presentación: el temporizador (3→2→1→0) lo maneja cada modo y va
 * pasando el valor por `count`. Así el visual es idéntico en Clásico, Mundial,
 * Caos y Diario.
 */
export default function CountdownIntro({ count, label }: CountdownIntroProps) {
  const { t } = useI18n();
  const isGo = count <= 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] game-bg overflow-hidden">
      <img src="/logo.png" alt="GeoSpeed" className="w-12 sm:w-14 md:w-16 object-contain mb-3 sm:mb-4 animate-fade-in" />

      {label && (
        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4 animate-fade-in">
          {label}
        </p>
      )}

      <div className="relative flex items-center justify-center">
        {isGo && (
          <div
            className="absolute w-24 h-24 rounded-full border-4 animate-ring-expand"
            style={{ borderColor: 'hsl(var(--primary))' }}
          />
        )}
        <div
          key={count}
          className={`font-black font-mono ${isGo
            ? 'text-8xl sm:text-9xl md:text-[10rem] animate-go-impact'
            : 'text-7xl sm:text-8xl md:text-9xl animate-countdown-zoom'
          }`}
          style={{ color: 'hsl(var(--primary))' }}
        >
          {isGo ? 'GO!' : count}
        </div>
      </div>

      <p className="text-muted-foreground mt-4 sm:mt-6 text-xs sm:text-sm animate-fade-in">
        {isGo ? t('countdown_go') : t('countdown_ready')}
      </p>
    </div>
  );
}
