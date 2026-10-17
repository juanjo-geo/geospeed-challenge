import { useState, useEffect, useCallback } from 'react';
import { unlockAudio } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import Mascot from './Mascot';
import { lazy, Suspense } from 'react';
// El globo trae los polígonos del mapa (~100 KB): se carga aparte para no frenar el primer pintado
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Pantalla de carga (maquetas Carga y Carga_Computador APROBADA_v1): la mascota sobre un globo
 * que gira, wordmark, "¿Cuánto conoces el mundo?", barra turquesa y "Preparando tu próxima aventura…".
 * En vertical va en columna; en horizontal (celular o escritorio), arte a la izquierda y texto a la derecha.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2400);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  // Tocar en cualquier parte desbloquea el audio antes (la música puede sonar al entrar)
  const handleTap = useCallback(() => {
    if (!tapped) {
      setTapped(true);
      unlockAudio();
    }
  }, [tapped]);

  const shown = phase !== 'enter';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6 game-bg cursor-pointer transition-all duration-700 ease-out"
      style={{ opacity: phase === 'exit' ? 0 : 1, transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)' }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Ondas turquesa al pie */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[34%] pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
        <path d="M0,220 C240,150 480,290 720,230 C960,170 1200,250 1440,200 L1440,320 L0,320 Z" fill="hsl(var(--accent) / 0.07)" />
        <path d="M0,250 C300,190 520,300 800,250 C1060,205 1250,280 1440,240" fill="none" stroke="hsl(var(--accent) / 0.55)" strokeWidth="3" />
        <path d="M0,275 C260,230 560,320 860,275 C1100,240 1280,300 1440,270" fill="none" stroke="hsl(var(--accent) / 0.3)" strokeWidth="2" />
      </svg>
      {/* Destellos */}
      <span className="absolute left-[18%] top-[22%] text-accent/70 text-xl animate-pulse pointer-events-none" aria-hidden>✦</span>
      <span className="absolute right-[20%] top-[30%] text-accent/60 text-sm animate-pulse pointer-events-none" style={{ animationDelay: '0.7s' }} aria-hidden>✦</span>

      <div className="relative flex flex-col landscape:flex-row items-center gap-5 landscape:gap-[6vw]">
        {/* Arte: mascota sobre el globo */}
        <div
          className="relative aspect-[10/14] w-[min(62vw,32dvh,290px)] landscape:w-[min(32vw,50dvh,330px)] transition-all duration-1000 ease-out"
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)' }}
        >
          <div className="absolute bottom-0 left-[3%] w-[94%] rounded-full shadow-[0_0_60px_hsl(var(--accent)/0.35)]">
            <Suspense fallback={<div className="w-full aspect-square rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, hsl(var(--accent) / 0.35), hsl(var(--brand-navy-deep)) 70%)' }} />}>
              <SplashGlobe />
            </Suspense>
          </div>
          {/* Ondas donde la mascota "aterriza" */}
          <span className="absolute left-1/2 top-[30%] -translate-x-1/2 w-[30%] aspect-[3/1] rounded-[50%] border-2 border-accent/70 animate-ping pointer-events-none" aria-hidden />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[54%]">
            <div className="animate-mascot-float">
              <Mascot state="idle" className="w-full drop-shadow-[0_10px_24px_hsl(var(--primary)/0.45)]" />
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col items-center landscape:items-start text-center landscape:text-left">
          <h1
            className="leading-none transition-all duration-1000 ease-out delay-200"
            style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(16px)' }}
          >
            <Wordmark size="2xl" />
          </h1>
          <p
            className="mt-3 short:mt-2 text-2xl sm:text-3xl short:text-xl font-black leading-tight max-w-[16ch] transition-all duration-1000 ease-out delay-500"
            style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(10px)' }}
          >
            {t('home_tagline')}
          </p>
          <div className="mt-6 short:mt-4 w-[min(72vw,22rem)] h-3 rounded-full overflow-hidden border border-accent/30" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
            <div
              className="h-full rounded-full transition-all ease-out"
              style={{
                background: 'hsl(var(--accent))',
                width: phase === 'enter' ? '0%' : phase === 'hold' ? '88%' : '100%',
                transitionDuration: phase === 'hold' ? '2200ms' : '500ms',
                boxShadow: '0 0 12px hsl(var(--accent) / 0.6)',
              }}
            />
          </div>
          <p className="mt-2 text-xs sm:text-sm text-accent/90 font-semibold">{t('splash_loading')}</p>
        </div>
      </div>

      {!tapped && phase === 'hold' && (
        <p className="absolute bottom-6 short:bottom-2 text-[10px] tracking-widest uppercase animate-pulse text-foreground/40">
          {t('splash_tap')}
        </p>
      )}
    </div>
  );
}
