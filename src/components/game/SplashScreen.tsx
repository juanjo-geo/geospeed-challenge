import { useState, useEffect, useCallback } from 'react';
import { unlockAudio } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Pantalla de carga (maqueta GeoSpeed_Carga_APROBADA_v1): logo, wordmark,
 * pregunta de marca y barra de progreso. Duración fija de 3 s; el rediseño
 * visual completo (globo + mascota) llega en F2.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  // Tap anywhere on splash to unlock audio early (enables music autoplay)
  const handleTap = useCallback(() => {
    if (!tapped) {
      setTapped(true);
      unlockAudio();
    }
  }, [tapped]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 transition-all duration-700 ease-out game-bg cursor-pointer"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.05)' : 'scale(1)',
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Logo */}
      <div
        className="relative mb-2 sm:mb-3 transition-all duration-1000 ease-out"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6) rotate(-10deg)' : 'scale(1) rotate(0deg)',
        }}
      >
        <img
          src="/logo.png"
          alt="GeoSpeed Logo"
          className="w-[72px] h-[72px] sm:w-[108px] sm:h-[108px] md:w-[132px] md:h-[132px] object-contain"
        />
      </div>

      {/* Wordmark */}
      <h1
        className="leading-none transition-all duration-1000 ease-out delay-200"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(20px)' : 'translateY(0)',
        }}
      >
        <Wordmark size="xl" />
      </h1>

      {/* Tagline */}
      <p
        className="mt-3 text-sm sm:text-base font-bold text-center transition-all duration-1000 ease-out delay-500"
        style={{
          color: 'hsl(var(--foreground))',
          opacity: phase === 'enter' ? 0 : 0.9,
          transform: phase === 'enter' ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        {t('home_tagline')}
      </p>

      {/* Loading bar — turquesa */}
      <div className="mt-6 sm:mt-8 w-40 sm:w-52 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--accent)/0.15)' }}>
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--accent)/0.7), hsl(var(--accent)))',
            width: phase === 'enter' ? '0%' : phase === 'hold' ? '85%' : '100%',
            transitionDuration: phase === 'hold' ? '2000ms' : '600ms',
            boxShadow: '0 0 8px hsl(var(--accent)/0.45)',
          }}
        />
      </div>
      <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground">{t('splash_loading')}</p>

      {/* Tap hint */}
      {!tapped && phase === 'hold' && (
        <p
          className="absolute bottom-8 text-[10px] tracking-widest uppercase animate-pulse"
          style={{ color: 'hsl(var(--foreground)/0.35)' }}
        >
          {t('splash_tap')}
        </p>
      )}
    </div>
  );
}
