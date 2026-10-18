import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { unlockAudio } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
// El globo trae los polígonos del mapa (~100 KB): se carga aparte para no frenar el primer pintado
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface SplashScreenProps {
  onComplete: () => void;
}

const STARS = [
  'left-[8%] top-[14%]', 'right-[12%] top-[10%]', 'left-[20%] top-[48%]', 'right-[8%] top-[42%]',
  'left-[44%] top-[6%]', 'right-[30%] top-[62%]', 'left-[6%] top-[70%]',
];

/**
 * Pantalla de carga (maquetas Carga y Carga_Computador APROBADA_v1): el Explorador (isotipo aprobado,
 * public/mascot/explorer.webp) aterrizando sobre un globo que gira, wordmark, "¿Cuánto conoces el mundo?",
 * barra turquesa y "Preparando tu próxima aventura…".
 * En vertical va en columna; en horizontal (celular o escritorio), arte a la izquierda y texto a la derecha.
 * Los tamaños salen de las proporciones de la maqueta y se limitan por ancho y alto de pantalla.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    // Solo en desarrollo: ?splash deja la pantalla quieta para revisarla contra la maqueta
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('splash')) return () => clearTimeout(t1);
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
  const rise = (delay: number, dy = 16) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : `translateY(${dy}px)`,
    transitionDelay: `${delay}ms`,
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4 cursor-pointer transition-all duration-700 ease-out"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        background: 'hsl(var(--brand-navy-deep))',
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Halo azul más claro detrás del arte (arriba en vertical, a la izquierda en horizontal) */}
      <div
        className="absolute inset-0 pointer-events-none landscape:hidden"
        style={{ background: 'radial-gradient(ellipse 75% 50% at 50% 30%, hsl(212 85% 30%) 0%, hsl(var(--brand-navy)) 55%, transparent 100%)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none hidden landscape:block"
        style={{ background: 'radial-gradient(ellipse 50% 75% at 28% 45%, hsl(212 85% 30%) 0%, hsl(var(--brand-navy)) 55%, transparent 100%)' }}
        aria-hidden
      />

      {/* Ondas de luz al pie (líneas turquesa con brillo, como en la maqueta) */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-[22%] landscape:h-[38%] pointer-events-none" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="splash-wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.09" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.02" />
          </linearGradient>
          <filter id="splash-glow" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M0,170 C260,90 520,260 820,190 C1080,130 1260,200 1440,150 L1440,400 L0,400 Z" fill="url(#splash-wave-fill)" />
        <g fill="none" filter="url(#splash-glow)">
          <path d="M0,150 C280,60 560,250 860,180 C1100,125 1280,190 1440,140" stroke="hsl(var(--accent) / 0.9)" strokeWidth="3" />
          <path d="M0,210 C300,130 580,300 880,235 C1120,185 1300,250 1440,205" stroke="hsl(var(--accent) / 0.6)" strokeWidth="2.5" />
          <path d="M0,270 C260,210 600,350 900,290 C1140,245 1300,300 1440,270" stroke="hsl(205 90% 60% / 0.55)" strokeWidth="2" />
          <path d="M0,330 C320,280 640,390 940,345 C1160,315 1320,350 1440,330" stroke="hsl(var(--accent) / 0.35)" strokeWidth="2" />
        </g>
      </svg>

      {/* Polvo de estrellas */}
      {STARS.map((pos, k) => (
        <span key={k} className={`absolute ${pos} w-1 h-1 rounded-full bg-accent/60 animate-pulse pointer-events-none`} style={{ animationDelay: `${k * 0.4}s` }} aria-hidden />
      ))}

      <div className="relative flex flex-col landscape:flex-row items-center gap-[3dvh] landscape:gap-[5vw]">
        {/* Arte: el Explorador aterrizando sobre el globo (proporción de la maqueta ≈ 10:19) */}
        <div
          className="relative aspect-[10/19] w-[min(56vw,26dvh,370px)] landscape:w-[min(30vw,44dvh,390px)] transition-all duration-1000 ease-out"
          style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)' }}
        >
          {/* Globo con halo turquesa */}
          <div className="absolute bottom-0 left-0 w-full rounded-full shadow-[0_0_28px_6px_hsl(var(--accent)/0.55),0_0_90px_20px_hsl(205_90%_55%/0.35)]">
            <Suspense fallback={<div className="w-full aspect-square rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, hsl(212 75% 56%), hsl(var(--brand-navy-deep)) 75%)' }} />}>
              <SplashGlobe />
            </Suspense>
          </div>
          {/* Anillos de luz donde se posa la punta del pin */}
          <div className="absolute left-1/2 top-[44.6%] -translate-x-1/2 w-[44%] aspect-[4/1] pointer-events-none" aria-hidden>
            <span className="absolute inset-0 rounded-[50%] border-2 border-accent/80 shadow-[0_0_14px_hsl(var(--accent)/0.8)]" />
            <span className="absolute inset-[22%_24%] rounded-[50%] border-2 border-accent/90" />
            <span className="absolute inset-0 rounded-[50%] border-2 border-accent/60 animate-ping" />
          </div>
          {/* Destellos junto a la mascota */}
          <span className="absolute -left-[4%] top-[26%] text-accent text-[clamp(0.9rem,4vw,1.6rem)] animate-pulse drop-shadow-[0_0_8px_hsl(var(--accent))] pointer-events-none" aria-hidden>✦</span>
          <span className="absolute -right-[6%] top-[33%] text-accent text-[clamp(0.8rem,3.4vw,1.4rem)] animate-pulse drop-shadow-[0_0_8px_hsl(var(--accent))] pointer-events-none" style={{ animationDelay: '0.8s' }} aria-hidden>✦</span>
          {/* El Explorador */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[96%]">
            <div className="animate-mascot-float">
              <img
                src="/mascot/explorer.webp"
                alt=""
                width={512}
                height={512}
                decoding="async"
                draggable={false}
                className="w-full select-none drop-shadow-[0_14px_30px_hsl(var(--brand-navy-deep)/0.6)]"
              />
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="flex flex-col items-center landscape:items-start text-center landscape:text-left">
          <h1 className="leading-none transition-all duration-1000 ease-out" style={rise(200)}>
            <Wordmark size="custom" className="text-[min(13vw,7dvh,5.5rem)] landscape:text-[min(8.5vw,14dvh,6.5rem)]" />
          </h1>
          <p
            className="font-display mt-[1.5dvh] font-bold leading-[1.15] text-foreground text-[min(7.4vw,3.9dvh,2.75rem)] landscape:text-[min(4.4vw,7.5dvh,3.25rem)] whitespace-pre-line transition-all duration-1000 ease-out"
            style={rise(450, 10)}
          >
            {t('splash_tagline')}
          </p>
          <div
            className="mt-[3.5dvh] landscape:mt-[5dvh] w-[min(62vw,34dvh,30rem)] landscape:w-[min(42vw,72dvh,34rem)] h-[clamp(10px,1.8dvh,18px)] rounded-full overflow-hidden border border-accent/25 p-[2px]"
            style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}
          >
            <div
              className="h-full rounded-full transition-all ease-out"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--accent) / 0.85), hsl(var(--accent)))',
                width: phase === 'enter' ? '0%' : phase === 'hold' ? '88%' : '100%',
                transitionDuration: phase === 'hold' ? '2200ms' : '500ms',
                boxShadow: '0 0 14px hsl(var(--accent) / 0.75)',
              }}
            />
          </div>
          <p className="mt-[1.8dvh] font-semibold text-[min(3.8vw,2.1dvh,1.15rem)] landscape:text-[min(2vw,4dvh,1.25rem)] text-[hsl(205_95%_68%)]">
            {t('splash_loading')}
          </p>
        </div>
      </div>

      {!tapped && phase === 'hold' && (
        <p className="absolute bottom-3 short:bottom-1 text-[10px] tracking-widest uppercase animate-pulse text-foreground/40">
          {t('splash_tap')}
        </p>
      )}
    </div>
  );
}
