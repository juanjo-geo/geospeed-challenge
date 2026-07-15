import { useState, useEffect, useCallback, useRef } from 'react';
import { haversineDistance, calculateBasePoints, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playPerfect, playBad, playRoundTransition } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst } from '@/lib/confetti';
import { trackEvent } from '@/lib/analytics';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';

// ── Onboarding cities — the most recognizable in the world ──
interface OnboardingCity {
  name: string;
  country: string;
  lat: number;
  lon: number;
  hintDelay: number; // seconds before hint appears
  tip: string;
  tipEn: string;
}

const ONBOARDING_CITIES: OnboardingCity[] = [
  {
    name: 'Paris',
    country: 'Francia',
    lat: 48.86,
    lon: 2.35,
    hintDelay: 5,
    tip: 'Consejo: Las ciudades europeas estan en la zona superior-derecha del mapa',
    tipEn: 'Tip: European cities are in the upper-right area of the map',
  },
  {
    name: 'Tokio',
    country: 'Japon',
    lat: 35.68,
    lon: 139.69,
    hintDelay: 10,
    tip: 'Consejo: Asia esta en el extremo derecho del mapa, Japon es una isla',
    tipEn: 'Tip: Asia is on the far right of the map, Japan is an island',
  },
  {
    name: 'Nueva York',
    country: 'Estados Unidos',
    lat: 40.71,
    lon: -74.01,
    hintDelay: 15,
    tip: 'Consejo: America esta en el lado izquierdo del mapa',
    tipEn: 'Tip: The Americas are on the left side of the map',
  },
];

const MAX_TIME = 30;
const TOTAL_ROUNDS = 3;

// ── Exaggerated feedback: much more encouraging thresholds ──
function getOnboardingFeedback(distance: number): { emoji: string; phrase: string; phraseEn: string; color: string; tier: 'perfect' | 'great' | 'good' | 'ok' | 'learning' } {
  if (distance < 100) return { emoji: '🎯', phrase: '!PERFECTO!', phraseEn: 'PERFECT!', color: 'text-green-400', tier: 'perfect' };
  if (distance < 500) return { emoji: '🔥', phrase: '!Increible!', phraseEn: 'Incredible!', color: 'text-green-400', tier: 'great' };
  if (distance < 1500) return { emoji: '💪', phrase: '!Muy bien!', phraseEn: 'Great job!', color: 'text-emerald-400', tier: 'good' };
  if (distance < 3000) return { emoji: '👏', phrase: '!Buen intento!', phraseEn: 'Good try!', color: 'text-yellow-400', tier: 'ok' };
  return { emoji: '🌍', phrase: '!Buen comienzo! Estas aprendiendo', phraseEn: 'Good start! You\'re learning!', color: 'text-amber-400', tier: 'learning' };
}

interface OnboardingGameProps {
  onComplete: () => void;
  onGoHome: () => void;
}

type Phase = 'intro' | 'playing' | 'feedback' | 'tip' | 'celebration';

export default function OnboardingGame({ onComplete, onGoHome }: OnboardingGameProps) {
  const { t, locale } = useI18n();
  const layoutMode = useGameLayoutMode();
  const isCompact = layoutMode === 'compact';
  const isPortraitMobile = useIsPortraitMobile();

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [showHint, setShowHint] = useState(false);
  const [lastClick, setLastClick] = useState<{ lat: number; lon: number } | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState<number>(0);
  const [scorePop, setScorePop] = useState(false);

  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentCity = ONBOARDING_CITIES[currentRound];
  const isEn = locale === 'en';

  // ── Analytics: track onboarding start ──
  useEffect(() => {
    trackEvent('onboarding_start');
  }, []);

  // ── Timer: only runs during 'playing' phase ──
  useEffect(() => {
    if (phase !== 'playing' || isPortraitMobile) {
      clearInterval(timerRef.current);
      return;
    }

    roundStartRef.current = Date.now();
    setTimeLeft(MAX_TIME);
    setShowHint(false);
    setLastClick(null);
    setLastDistance(null);

    // Progressive hint timer
    hintTimerRef.current = setTimeout(() => {
      setShowHint(true);
    }, currentCity.hintDelay * 1000);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up — auto-place at a far location, still give encouraging feedback
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(hintTimerRef.current);
    };
  }, [phase, currentRound, isPortraitMobile]);

  const handleTimeUp = useCallback(() => {
    // Give them 0 points but still be encouraging
    setLastDistance(9999);
    setLastPoints(0);
    setPhase('feedback');
    playBad();
  }, []);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (phase !== 'playing') return;

    clearInterval(timerRef.current);
    clearTimeout(hintTimerRef.current);
    setShowHint(false);
    playClick();
    hapticTap();

    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    // Onboarding bonus: 1.5x points to make scores feel better
    const totalPoints = Math.round(basePoints * 1.5);

    setLastClick({ lat, lon });
    setLastDistance(distance);
    setLastPoints(totalPoints);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 600);

    // Sound + haptics based on distance
    setTimeout(() => {
      if (distance < 100) {
        playPerfect();
        hapticCelebration();
        fireStarBurst();
      } else if (distance < 500) {
        playGood();
        hapticCelebration();
        fireGoldBurst();
      } else if (distance < 1500) {
        playGood();
        hapticSuccess();
      } else {
        // Even for far distances, no bad sound in onboarding — use medium-ish
        hapticTap();
      }
    }, 200);

    setPhase('feedback');
  }, [phase, currentCity]);

  const advanceToTip = useCallback(() => {
    setPhase('tip');
  }, []);

  const advanceToNextRound = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      // Mark onboarding as done
      try {
        localStorage.setItem('geospeed_onboarding_done', 'true');
      } catch {}
      trackEvent('onboarding_complete', { score, rounds: TOTAL_ROUNDS });
      hapticCelebration();
      fireStarBurst();
      setTimeout(() => fireGoldBurst(), 300);
      setPhase('celebration');
    } else {
      playRoundTransition();
      setCurrentRound(r => r + 1);
      setPhase('playing');
    }
  }, [currentRound, score]);

  const startGame = useCallback(() => {
    setPhase('playing');
  }, []);

  // ── Feedback data ──
  const feedback = lastDistance !== null ? getOnboardingFeedback(lastDistance) : null;

  // ── INTRO SCREEN ──
  if (phase === 'intro') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 bg-background" data-game-container>
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-6xl mb-4">🌍</div>
          <h1
            className="text-3xl font-black mb-2"
            style={{
              fontFamily: 'Impact, system-ui',
              background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {isEn ? 'Learn the Basics!' : 'Aprende lo basico!'}
          </h1>
          <p className="text-foreground/70 text-sm leading-relaxed mb-2">
            {isEn
              ? 'We\'ll show you 3 famous cities. Click on the map where you think each one is. Don\'t worry — there\'s no pressure!'
              : 'Te mostraremos 3 ciudades famosas. Haz clic en el mapa donde creas que esta cada una. No te preocupes, sin presion!'}
          </p>
          <div className="flex flex-col gap-2 text-xs text-foreground/50 mb-6">
            <span>⏱ {isEn ? '30 seconds per city' : '30 segundos por ciudad'}</span>
            <span>💡 {isEn ? 'Hints appear if you need them' : 'Aparecen pistas si las necesitas'}</span>
            <span>🎉 {isEn ? 'Every click counts!' : 'Cada clic suma!'}</span>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-2xl text-lg font-black transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #F5D060 0%, #D48020 100%)',
              color: '#1a1a2e',
              boxShadow: '0 4px 20px rgba(245,192,66,0.4)',
            }}
          >
            {isEn ? 'Let\'s go!' : 'Vamos!'}
          </button>
          <button
            onClick={onGoHome}
            className="block mx-auto mt-3 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {isEn ? 'Skip tutorial' : 'Saltar tutorial'}
          </button>
        </div>
      </div>
    );
  }

  // ── CELEBRATION SCREEN ──
  if (phase === 'celebration') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 bg-background" data-game-container>
        <div className="text-center max-w-md animate-fade-in">
          <div className="text-8xl mb-2 animate-bounce">🏆</div>
          <h1
            className="text-4xl font-black mb-2"
            style={{
              fontFamily: 'Impact, system-ui',
              background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(240,160,48,0.4))',
            }}
          >
            {isEn ? 'You\'re Ready!' : 'Estas listo!'}
          </h1>
          <p className="text-foreground/70 text-base mb-1">
            {isEn ? 'You scored' : 'Tu puntuacion'}:{' '}
            <span className="font-black text-xl" style={{ color: 'hsl(var(--primary))' }}>
              {score.toLocaleString()}
            </span>
          </p>
          <p className="text-foreground/50 text-sm mb-6">
            {isEn
              ? 'Now try the real game with 13 rounds and tougher cities!'
              : 'Ahora prueba el juego real con 13 rondas y ciudades mas dificiles!'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onComplete}
              className="px-8 py-3.5 rounded-2xl text-lg font-black transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(180deg, #F5D060 0%, #D48020 100%)',
                color: '#1a1a2e',
                boxShadow: '0 4px 24px rgba(245,192,66,0.5)',
              }}
            >
              {isEn ? 'Play for real!' : 'Jugar de verdad!'}
            </button>
            <button
              onClick={onGoHome}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-foreground/60 hover:text-foreground/80 border border-border/50 hover:border-border transition-colors"
            >
              {isEn ? 'Back to menu' : 'Volver al menu'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TIP SCREEN (between rounds) ──
  if (phase === 'tip') {
    const nextCity = ONBOARDING_CITIES[currentRound + 1];
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-5 px-6 bg-background" data-game-container>
        <div className="text-center max-w-sm animate-fade-in">
          <div className="text-5xl mb-3">💡</div>
          <p className="text-foreground/80 text-base font-semibold leading-relaxed mb-4">
            {isEn ? currentCity.tipEn : currentCity.tip}
          </p>
          {nextCity && (
            <p className="text-foreground/50 text-sm mb-6">
              {isEn ? 'Next city' : 'Siguiente ciudad'}:{' '}
              <span className="font-black" style={{ color: 'hsl(var(--primary))' }}>{nextCity.name}</span>
              <span className="text-foreground/40"> ({nextCity.country})</span>
            </p>
          )}
          <button
            onClick={advanceToNextRound}
            className="px-8 py-3 rounded-2xl text-base font-black transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #F5D060 0%, #D48020 100%)',
              color: '#1a1a2e',
              boxShadow: '0 4px 20px rgba(245,192,66,0.4)',
            }}
          >
            {isEn ? 'Continue' : 'Continuar'} →
          </button>
        </div>
      </div>
    );
  }

  // ── FEEDBACK OVERLAY (shown after a click, before tip) ──
  const feedbackOverlay = phase === 'feedback' && feedback && (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="text-center max-w-sm px-6">
        {/* Big emoji */}
        <div
          className="text-7xl mb-2"
          style={{
            animation: 'onboarding-emoji-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
          }}
        >
          {feedback.emoji}
        </div>

        {/* Encouraging phrase */}
        <p className={`text-2xl font-black mb-1 ${feedback.color}`} style={{ fontFamily: 'Impact, system-ui' }}>
          {isEn ? feedback.phraseEn : feedback.phrase}
        </p>

        {/* Distance */}
        {lastDistance !== null && lastDistance < 9999 && (
          <p className="text-foreground/60 text-sm font-mono mb-1">
            {formatDistance(lastDistance)} {isEn ? 'away' : 'de distancia'}
          </p>
        )}

        {/* Points earned */}
        {lastPoints > 0 && (
          <p className="text-lg font-black mb-3" style={{ color: 'hsl(var(--primary))' }}>
            +{lastPoints.toLocaleString()} pts
          </p>
        )}

        {/* City reveal */}
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 mb-4 inline-block">
          <p className="text-lg font-black" style={{ color: 'hsl(var(--primary))' }}>{currentCity.name}</p>
          <p className="text-xs text-foreground/60">{currentCity.country}</p>
        </div>

        <br />

        <button
          onClick={advanceToTip}
          className="px-6 py-2.5 rounded-xl text-sm font-black transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #F5D060 0%, #D48020 100%)',
            color: '#1a1a2e',
            boxShadow: '0 4px 16px rgba(245,192,66,0.35)',
          }}
        >
          {currentRound + 1 >= TOTAL_ROUNDS
            ? (isEn ? 'See results' : 'Ver resultados')
            : (isEn ? 'Next' : 'Siguiente')} →
        </button>
      </div>
    </div>
  );

  // ── PLAYING PHASE — Map + HUD ──
  const layoutClass = isPortraitMobile
    ? 'flex flex-col'
    : isCompact
    ? 'flex flex-col'
    : 'grid grid-cols-[clamp(13rem,24vw,21rem)_minmax(0,1fr)]';

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass}`}
      data-game-container
    >
      {/* Inject onboarding keyframes */}
      <style>{`
        @keyframes onboarding-emoji-pop {
          0% { transform: scale(0.2) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes onboarding-hint-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.25; }
        }
      `}</style>

      {/* ── Portrait mobile top bar ── */}
      {isPortraitMobile && (
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-col gap-1.5 shrink-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>
                {currentRound + 1}/{TOTAL_ROUNDS}
              </span>
              <p className="text-sm font-black truncate">📍 {currentCity.name}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono font-bold text-sm ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }}>
                {score.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">🌍 {currentCity.country}</p>
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} compact />
          </div>
        </div>
      )}

      {/* ── Sidebar (medium + wide) ── */}
      {!isCompact && !isPortraitMobile && (
        <div
          className="flex min-h-0 flex-col gap-0 border-r border-border/60 bg-card overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ containerType: 'inline-size', paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          {/* Logo */}
          <div className="w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pb-2 mb-2 border-b border-border/50 shrink-0">
            <img src="/logo.png" alt="GeoSpeed" className="w-[37cqi] max-w-[100px] object-contain" />
            <span
              className="text-[22cqi] font-black tracking-tight"
              style={{
                fontFamily: 'Impact, system-ui',
                background: 'linear-gradient(180deg, #F5D060 0%, #F0A030 40%, #D48020 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 1px 4px rgba(240,160,48,0.3))',
              }}
            >
              GEOSPEED
            </span>
          </div>

          {/* Onboarding badge */}
          <div className="w-full flex justify-center mb-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              🎓 {isEn ? 'TUTORIAL' : 'TUTORIAL'}
            </span>
          </div>

          {/* City to find */}
          <div className="w-full shrink-0 mb-2 rounded-xl px-[6.7cqi] py-[5.4cqi] border border-primary/25 bg-primary/10 text-center">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1.5">
              {isEn ? 'FIND' : 'ENCUENTRA'}
            </p>
            <p
              className="text-[15.5cqi] font-black leading-tight text-center"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word' }}
            >
              {currentCity.name}
            </p>
            <p className="mt-1.5 text-xs text-foreground/50">
              🌍 <span className="font-bold text-foreground/75">{currentCity.country}</span>
            </p>
          </div>

          {/* Score */}
          <div className="w-full text-center shrink-0 relative mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">
              {isEn ? 'SCORE' : 'PUNTOS'}
            </p>
            <p
              className={`text-[20cqi] font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
            >
              {score.toLocaleString()}
            </p>
          </div>

          {/* Step indicator */}
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">
              {isEn ? 'ROUND' : 'RONDA'}
            </p>
            <p className="text-[15cqi] font-mono font-bold leading-none">
              {currentRound + 1}<span className="text-foreground/40 text-base">/{TOTAL_ROUNDS}</span>
            </p>
            {/* Big step dots */}
            <div className="mt-2 flex justify-center gap-2">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    i < currentRound
                      ? 'bg-emerald-400 scale-100'
                      : i === currentRound
                      ? 'bg-primary animate-pulse scale-110'
                      : 'bg-border scale-90'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Hint status */}
          <div className="w-full text-center shrink-0 mb-2">
            <p className="text-xs text-foreground/40">
              {showHint
                ? (isEn ? '💡 Hint active — look for the glow!' : '💡 Pista activa — busca el brillo!')
                : (isEn ? `💡 Hint in ${currentCity.hintDelay}s` : `💡 Pista en ${currentCity.hintDelay}s`)}
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Timer — green, non-stressful */}
          <div className="w-full shrink-0">
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} />
          </div>
        </div>
      )}

      {/* ── Map area ── */}
      <div className="relative h-full min-w-0 overflow-hidden">
        {/* Compact HUD overlay */}
        {isCompact && !isPortraitMobile && (
          <div className="pointer-events-none absolute z-20 hud-safe-top hud-safe-left hud-safe-right">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                    🎓 {isEn ? 'TUTORIAL' : 'TUTORIAL'}
                  </p>
                  <p className="break-words font-black leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    🌍 <span className="font-semibold text-foreground/80">{currentCity.country}</span>
                  </p>
                </div>
                <div className="w-px self-stretch bg-border/60 shrink-0" />
                <div className="relative shrink-0 text-center min-w-[3.5rem]">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{isEn ? 'SCORE' : 'PUNTOS'}</p>
                  <p className={`text-base font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }}>
                    {score.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                <span className="rounded-full bg-muted/80 px-1.5 py-0.5">
                  {currentRound + 1}/{TOTAL_ROUNDS}
                </span>
                {showHint && (
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-400">
                    💡 {isEn ? 'Hint' : 'Pista'}
                  </span>
                )}
              </div>
              <div className="mt-1.5">
                <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} compact />
              </div>
            </div>
          </div>
        )}

        {/* Soft vignette */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.35)' }} />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.35)' }} />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.35)' }} />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.35)' }} />

        {/* Floating city label on map (non-compact, non-portrait) */}
        {!isCompact && !isPortraitMobile && phase === 'playing' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md" style={{ background: 'hsl(var(--background) / 0.8)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">🎓 TUTORIAL</span>
              <span className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>{currentCity.name}</span>
              <span className="text-[10px] text-muted-foreground/60">{currentRound + 1}/{TOTAL_ROUNDS}</span>
            </div>
          </div>
        )}

        {/* Tutorial mode badge — bottom center */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[6] pointer-events-none">
          <span className="px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em]" style={{ background: 'hsl(var(--background) / 0.6)', color: 'hsl(142 71% 45% / 0.8)', border: '1px solid hsl(142 71% 45% / 0.2)' }}>
            🎓 TUTORIAL
          </span>
        </div>

        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={phase !== 'playing'}
          userClick={lastClick}
          correctLocation={phase === 'feedback' ? { lat: currentCity.lat, lon: currentCity.lon } : null}
          distanceKm={lastDistance}
          gameMode="world"
          hintZone={phase === 'playing' && showHint ? { lat: currentCity.lat, lon: currentCity.lon } : null}
        />

        {/* Feedback overlay */}
        {feedbackOverlay}
      </div>
    </div>
  );
}
