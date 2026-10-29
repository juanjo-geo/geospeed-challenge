import { useState, useEffect, useLayoutEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { unlockAudio } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import GlowWaves from '@/components/ui/GlowWaves';
import { warmUpHomeGlyphs } from '@/lib/glyphWarmup';
// El globo trae los polígonos del mapa (~100 KB): se carga aparte para no frenar el primer pintado
const SplashGlobe = lazy(() => import('./SplashGlobe'));

interface SplashScreenProps {
  onComplete: () => void;
}

const STARS = [
  'left-[8%] top-[14%]', 'right-[12%] top-[10%]', 'left-[20%] top-[48%]', 'right-[8%] top-[42%]',
  'left-[44%] top-[6%]', 'right-[30%] top-[62%]', 'left-[6%] top-[70%]',
];

/** La pantalla empieza a salir 2,4 s después del primer pintado y tarda 0,6 s en irse. */
const HOLD_MS = 2400;
const EXIT_MS = 600;
/** Si React llegó tarde (celular lento, red mala), la pantalla se queda al menos esto más antes de salir. */
const MIN_HOLD_MS = 800;

/** Instante del primer pintado (la copia estática de index.html); si el navegador no lo informa, ahora. */
function firstPaintAt(): number {
  try {
    const entry = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
    if (entry) return entry.startTime;
  } catch { /* sin Performance API */ }
  return performance.now();
}

/**
 * Pantalla de carga (maquetas Carga y Carga_Computador APROBADA_v1): el Explorador (isotipo aprobado,
 * public/mascot/explorer.webp) aterrizando sobre un globo que gira, wordmark, "¿Cuánto conoces el mundo?",
 * barra turquesa y "Preparando tu próxima aventura…".
 * En vertical va en columna; en horizontal (celular o escritorio), arte a la izquierda y texto a la derecha.
 * Los tamaños salen de las proporciones de la maqueta y se limitan por ancho y alto de pantalla.
 *
 * index.html trae esta misma pantalla en HTML puro (#static-splash) para que se vea antes de que llegue el
 * JavaScript. Si está, React arranca directamente en 'hold' (sin repetir la entrada), la barra sigue donde
 * iba (misma animación CSS, con el tiempo ya transcurrido) y la copia estática se retira en el mismo cuadro
 * en que se pinta la de React: no hay parpadeo. La duración total se cuenta desde ese primer pintado.
 */
export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useI18n();
  const [handoff] = useState(() => {
    const staticEl = typeof document !== 'undefined' ? document.getElementById('static-splash') : null;
    return { staticEl, elapsed: staticEl ? Math.max(0, performance.now() - firstPaintAt()) : 0 };
  });
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>(handoff.staticEl ? 'hold' : 'enter');
  const [tapped, setTapped] = useState(false);
  // onComplete llega como función nueva en cada render de Index: con ella en las dependencias, cada
  // render durante la carga reiniciaba los temporizadores y alargaba la pantalla de carga.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useLayoutEffect(() => { handoff.staticEl?.remove(); }, [handoff]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!handoff.staticEl) timers.push(setTimeout(() => setPhase('hold'), 100));
    // Mientras la pantalla espera: precalienta los emojis del Inicio y pide la demo del banner, para que
    // el Inicio aparezca sin ese trabajo ni esa descarga pendientes
    timers.push(setTimeout(() => { warmUpHomeGlyphs(); void import('./AutoDemo'); }, 250));
    // Solo en desarrollo: ?splash deja la pantalla quieta para revisarla contra la maqueta
    if (!(import.meta.env.DEV && new URLSearchParams(window.location.search).has('splash'))) {
      const exitAt = Math.max(MIN_HOLD_MS, HOLD_MS - handoff.elapsed);
      timers.push(setTimeout(() => setPhase('exit'), exitAt));
      timers.push(setTimeout(() => onCompleteRef.current(), exitAt + EXIT_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [handoff]);

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
      <GlowWaves className="h-[15%] landscape:h-[26%]" />

      {/* Polvo de estrellas */}
      {STARS.map((pos, k) => (
        <span key={k} className={`absolute ${pos} w-1 h-1 rounded-full bg-accent/60 animate-pulse pointer-events-none`} style={{ animationDelay: `${k * 0.4}s` }} aria-hidden />
      ))}

      <div className="relative flex flex-col landscape:flex-row items-center gap-[3dvh] landscape:gap-[5vw]">
        {/* Arte: el Explorador aterrizando sobre el globo (proporción de la maqueta ≈ 10:19) */}
        <div
          className="relative aspect-[10/19] w-[min(56vw,26dvh,370px)] landscape:w-[min(30vw,44dvh,390px)] transition-transform duration-1000 ease-out"
          // Sin fundido de opacidad: la mascota es el elemento más grande del primer pintado y debe verse de inmediato
          style={{ transform: shown ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)' }}
        >
          {/* Globo con halo turquesa */}
          <div className="absolute bottom-0 left-0 w-full rounded-full shadow-[0_0_28px_6px_hsl(var(--accent)/0.55),0_0_90px_20px_hsl(205_90%_55%/0.35)]">
            <Suspense fallback={<div className="w-full aspect-square rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, hsl(212 75% 56%), hsl(var(--brand-navy-deep)) 75%)' }} />}>
              <SplashGlobe paused={phase === 'exit'} />
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
            className="font-display mt-[1.5dvh] font-bold leading-tight text-foreground text-[min(4.45vw,2.35dvh,1.65rem)] landscape:text-[min(2.65vw,4.5dvh,1.95rem)] whitespace-nowrap transition-all duration-1000 ease-out"
            style={rise(450, 10)}
          >
            {t('home_tagline')}
          </p>
          <div
            className="mt-[3.5dvh] landscape:mt-[5dvh] w-[min(62vw,34dvh,30rem)] landscape:w-[min(42vw,72dvh,34rem)] h-[clamp(10px,1.8dvh,18px)] rounded-full overflow-hidden border border-accent/25 p-[2px]"
            style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}
          >
            {/* La barra es la animación CSS splash-bar (index.css), empezada con el tiempo que ya corrió en la
                copia estática; al salir se suelta la animación y completa el 100 % con una transición */}
            <div
              className={`h-full rounded-full ${phase === 'exit' ? '' : 'splash-bar-run'}`}
              style={{
                background: 'linear-gradient(90deg, hsl(var(--accent) / 0.85), hsl(var(--accent)))',
                boxShadow: '0 0 14px hsl(var(--accent) / 0.75)',
                animationDelay: `-${Math.round(handoff.elapsed)}ms`,
                ...(phase === 'exit' ? { width: '100%', transition: 'width 500ms ease-out' } : null),
              }}
            />
          </div>
          <p className="mt-[1.8dvh] font-semibold text-[min(3.8vw,2.1dvh,1.15rem)] landscape:text-[min(2vw,4dvh,1.25rem)] text-[hsl(200_100%_78%)] [text-shadow:0_1px_8px_hsl(var(--brand-navy-deep)),0_0_2px_hsl(var(--brand-navy-deep))]">
            {t('splash_loading')}
          </p>
        </div>
      </div>

    </div>
  );
}
