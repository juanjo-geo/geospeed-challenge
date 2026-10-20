import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { haversineDistance, calculateBasePoints, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playPerfect, playBad, playRoundTransition, playButtonTap } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst } from '@/lib/confetti';
import { trackEvent } from '@/lib/analytics';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';
import Mascot from './Mascot';
import Wordmark from '@/components/ui/Wordmark';
import Flag from '@/components/ui/Flag';
import { appNumberLocale } from '@/lib/format';

// ── Ciudades de la práctica: las más reconocibles del mundo ──
interface OnboardingCity {
  name: string;
  country: string;
  lat: number;
  lon: number;
  hintDelay: number; // segundos antes de la pista
}

const ONBOARDING_CITIES: OnboardingCity[] = [
  { name: 'París', country: 'Francia', lat: 48.86, lon: 2.35, hintDelay: 5 },
  { name: 'Tokio', country: 'Japón', lat: 35.68, lon: 139.69, hintDelay: 10 },
  { name: 'Nueva York', country: 'EE.UU.', lat: 40.71, lon: -74.01, hintDelay: 15 },
];

const MAX_TIME = 30;
const TOTAL_ROUNDS = 3;

type FeedbackTier = 'perfect' | 'great' | 'good' | 'ok' | 'learning';

// ── Feedback generoso: umbrales mucho más amables que en la partida real ──
function getOnboardingFeedback(distance: number): { emoji: string; tier: FeedbackTier; color: string } {
  if (distance < 100) return { emoji: '🎯', tier: 'perfect', color: 'text-accent' };
  if (distance < 500) return { emoji: '🔥', tier: 'great', color: 'text-accent' };
  if (distance < 1500) return { emoji: '💪', tier: 'good', color: 'text-accent' };
  if (distance < 3000) return { emoji: '👏', tier: 'ok', color: 'text-primary' };
  return { emoji: '🌍', tier: 'learning', color: 'text-primary' };
}

interface OnboardingGameProps {
  /** "¡Jugar de verdad!" o "Saltar práctica": el padre cobra la vida y arranca la partida real */
  onComplete: () => void;
  /** Salir sin jugar (la práctica no gasta vidas) */
  onGoHome: () => void;
}

type Phase = 'intro' | 'playing' | 'feedback' | 'tip' | 'celebration';

const pillStyle = { background: 'hsl(var(--brand-navy-deep) / 0.78)' } as const;

/** Tarjeta centrada de las pantallas de práctica (intro, consejo, final). */
function OnboardingCard({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-layer game-bg" data-game-container>
      <div className={`modal-panel relative w-full max-w-md rounded-3xl border border-border bg-card/80 backdrop-blur-md p-5 sm:p-6 short:p-4 text-center animate-fade-in-up ${wide ? 'short:max-w-2xl short:grid short:grid-cols-2 short:gap-5 short:items-center' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function OnboardingGame({ onComplete, onGoHome }: OnboardingGameProps) {
  const { t } = useI18n();
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

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentCity = ONBOARDING_CITIES[currentRound];

  // Props del mapa memoizadas (el mapa compara por identidad: si cambian en cada render, el trazo se reinicia)
  const correctPt = useMemo(() => ({ lat: currentCity.lat, lon: currentCity.lon }), [currentCity]);
  const pinLabels = useMemo(() => ({ you: t('game_yourAnswer'), correct: t('game_correctCity') }), [t]);

  useEffect(() => { trackEvent('onboarding_start'); }, []);

  const handleTimeUp = useCallback(() => {
    // 0 puntos, pero el mensaje sigue siendo amable
    setLastDistance(Infinity); // tiempo agotado: sin punto en el mapa
    setLastPoints(0);
    setPhase('feedback');
    playBad();
  }, []);

  // ── Temporizador: solo en 'playing' y con el teléfono en horizontal ──
  useEffect(() => {
    if (phase !== 'playing' || isPortraitMobile) {
      clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(MAX_TIME);
    setShowHint(false);
    setLastClick(null);
    setLastDistance(null);

    hintTimerRef.current = setTimeout(() => setShowHint(true), currentCity.hintDelay * 1000);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeout(handleTimeUp, 0); // fuera del updater de setState
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(hintTimerRef.current);
    };
  }, [phase, currentRound, isPortraitMobile, currentCity.hintDelay, handleTimeUp]);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (phase !== 'playing') return;
    clearInterval(timerRef.current);
    clearTimeout(hintTimerRef.current);
    setShowHint(false);
    playClick();
    hapticTap();

    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    // Bonus de práctica: ×1.5 para que los puntos se sientan bien
    const totalPoints = Math.round(calculateBasePoints(distance) * 1.5);

    setLastClick({ lat, lon });
    setLastDistance(distance);
    setLastPoints(totalPoints);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 600);

    setTimeout(() => {
      if (distance < 100) { playPerfect(); hapticCelebration(); fireStarBurst(); }
      else if (distance < 500) { playGood(); hapticCelebration(); fireGoldBurst(); }
      else if (distance < 1500) { playGood(); hapticSuccess(); }
      else hapticTap(); // sin sonido de error en la práctica
    }, 200);

    setPhase('feedback');
  }, [phase, currentCity]);

  const advanceToNextRound = useCallback(() => {
    playButtonTap();
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      try { localStorage.setItem('geospeed_onboarding_done', 'true'); localStorage.setItem('geospeed_tutorial_seen', 'true'); } catch { /* sin almacenamiento */ }
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

  const skipPractice = useCallback(() => {
    try { localStorage.setItem('geospeed_onboarding_done', 'true'); localStorage.setItem('geospeed_tutorial_seen', 'true'); } catch { /* sin almacenamiento */ }
    trackEvent('onboarding_skip');
    playButtonTap();
    onComplete();
  }, [onComplete]);

  const feedback = lastDistance !== null ? getOnboardingFeedback(lastDistance) : null;
  const titleWithAccent = (text: string) => {
    const w = text.split(' ');
    return <>{w.slice(0, -1).join(' ')} <span className="text-primary">{w[w.length - 1]}</span></>;
  };

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <OnboardingCard wide>
        <button onClick={() => { playButtonTap(); onGoHome(); }} className="absolute right-3 top-3 w-8 h-8 rounded-full border border-border/60 bg-muted/40 flex items-center justify-center hover:bg-muted active:scale-95" aria-label={t('close')}>×</button>
        <div>
        <div className="flex items-center justify-center gap-2 mb-2 short:mb-1">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-7 h-7 object-contain" />
          <Wordmark size="sm" />
        </div>
        <Mascot state="happy" className="w-20 sm:w-24 short:w-14 mx-auto animate-mascot-float" />
        <span className="inline-block mt-2 rounded-full border border-accent/50 bg-accent/10 px-3 py-0.5 text-xs font-bold text-accent">🎓 {t('ob_badge')}</span>
        <h1 className="text-2xl sm:text-3xl short:text-xl font-black mt-2 leading-tight">{titleWithAccent(t('ob_introTitle'))}</h1>
        <p className="text-sm short:text-xs text-muted-foreground mt-2 leading-relaxed">{t('ob_introDesc')}</p>
        </div>
        <div>
        <div className="grid grid-cols-3 gap-2 mt-4 short:mt-0">
          {[['⏱️', t('ob_introTime')], ['💡', t('ob_introHints')], ['❤️', t('ob_noLife')]].map(([e, l]) => (
            <div key={l} className="rounded-2xl border border-border bg-muted/20 p-2">
              <span className="text-xl block" aria-hidden>{e}</span>
              <span className="block text-[10px] sm:text-xs text-muted-foreground font-semibold leading-tight mt-0.5">{l}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { playButtonTap(); setPhase('playing'); }} className="btn3d mt-5 short:mt-3 w-full py-3.5 short:py-2.5 rounded-2xl font-black text-lg short:text-base text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          {t('ob_start')}
        </button>
        <button onClick={skipPractice} className="mt-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          {t('ob_skip')}
        </button>
        </div>
      </OnboardingCard>
    );
  }

  // ── FINAL DE LA PRÁCTICA ──
  if (phase === 'celebration') {
    return (
      <OnboardingCard>
        <Mascot state="cheer" className="w-24 sm:w-28 short:w-16 mx-auto" />
        <h1 className="text-3xl sm:text-4xl short:text-2xl font-black mt-2 leading-tight">{titleWithAccent(t('ob_readyTitle'))}</h1>
        <p className="mt-2 text-sm sm:text-base">
          {t('ob_youScored')}: <span className="font-black font-mono text-xl text-primary">{score.toLocaleString(appNumberLocale())}</span> <span className="text-muted-foreground">pts</span>
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('ob_readyDesc')}</p>
        <button onClick={() => { playButtonTap(); onComplete(); }} className="btn3d mt-5 short:mt-3 w-full py-3.5 short:py-2.5 rounded-2xl font-black text-lg short:text-base text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          ▶ {t('ob_playReal')}
        </button>
        <button onClick={() => { playButtonTap(); onGoHome(); }} className="mt-2.5 w-full rounded-2xl py-2.5 border border-border bg-muted/20 font-bold text-sm hover:bg-muted transition-colors active:scale-[0.98]">
          🏠 {t('ob_backHome')}
        </button>
      </OnboardingCard>
    );
  }

  // ── CONSEJO ENTRE RONDAS ──
  if (phase === 'tip') {
    const nextCity = ONBOARDING_CITIES[currentRound + 1];
    return (
      <OnboardingCard>
        <span className="text-5xl short:text-4xl block" aria-hidden>💡</span>
        <p className="mt-3 text-base sm:text-lg short:text-sm font-semibold leading-relaxed">{t(`ob_tip${currentRound}` as never)}</p>
        {nextCity && (
          <p className="mt-3 text-sm text-muted-foreground flex items-center justify-center gap-2">
            {t('ob_nextCity')}: <Flag country={nextCity.country} className="w-6" /> <span className="font-black text-primary">{nextCity.name}</span>
          </p>
        )}
        <button onClick={advanceToNextRound} className="btn3d mt-5 short:mt-3 w-full py-3 short:py-2.5 rounded-2xl font-black text-base text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          {t('ob_continue')} →
        </button>
      </OnboardingCard>
    );
  }

  // ── FEEDBACK (tras tocar el mapa) ──
  const feedbackCard = phase === 'feedback' && feedback && (
    <div className={`absolute z-30 flex animate-slide-in-right ${isPortraitMobile ? 'inset-x-0 bottom-0 justify-center p-2' : 'inset-y-0 right-0 items-center p-2'}`} role="dialog">
      <div className={`flex flex-col gap-2 rounded-3xl border border-border/80 bg-card/90 p-4 short:p-3 shadow-2xl backdrop-blur-md text-center ${isPortraitMobile ? 'w-full max-w-md' : 'w-[clamp(16rem,36vw,22rem)] max-h-[94%] overflow-y-auto'}`}>
        <span className="text-5xl short:text-3xl block" aria-hidden>{feedback.emoji}</span>
        <p className={`text-2xl short:text-lg font-black ${feedback.color}`}>{t(`ob_fb_${feedback.tier}` as never)}</p>
        <p className="font-black text-lg short:text-base flex items-center justify-center gap-2">
          <Flag country={currentCity.country} className="w-6" /> {currentCity.name}
          <span className="text-xs font-semibold text-muted-foreground">· {currentCity.country}</span>
        </p>
        {lastDistance !== null && Number.isFinite(lastDistance) && (
          <p className="text-sm font-mono text-muted-foreground">📍 {formatDistance(lastDistance)} {t('ob_away')}</p>
        )}
        {lastPoints > 0 && (
          <p className="text-2xl short:text-xl font-black font-mono text-primary">+{lastPoints.toLocaleString(appNumberLocale())} <span className="text-sm text-foreground">pts</span></p>
        )}
        <button onClick={() => { playButtonTap(); setPhase('tip'); }} className="btn3d mt-1 w-full py-2.5 short:py-2 rounded-2xl font-black text-sm sm:text-base text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          {currentRound + 1 >= TOTAL_ROUNDS ? t('ob_seeResults') : t('ob_next')} →
        </button>
      </div>
    </div>
  );

  const hintText = showHint ? t('ob_hintActive') : t('ob_hintIn', { s: currentCity.hintDelay });
  const dots = (
    <div className="flex justify-center gap-2">
      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i < currentRound ? 'bg-accent' : i === currentRound ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
      ))}
    </div>
  );

  // ── PARTIDA DE PRÁCTICA: mapa + HUD (mismo patrón que el Clásico) ──
  const layoutClass = isPortraitMobile || isCompact ? 'flex flex-col' : 'grid grid-cols-[clamp(13rem,24vw,21rem)_minmax(0,1fr)]';

  return (
    <div className={`h-[100dvh] min-h-0 overflow-hidden game-bg ${layoutClass}`} data-game-container>
      {/* Barra superior en vertical */}
      {isPortraitMobile && (
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-col gap-1.5 shrink-0 z-20">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black truncate">{t('game_whereIs')} <span className="text-primary">{currentCity.name}</span></p>
            <span className={`font-mono font-black text-sm text-primary ${scorePop ? 'animate-score-pop' : ''}`}>⭐ {score.toLocaleString(appNumberLocale())}</span>
          </div>
          <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} compact />
        </div>
      )}

      {/* Panel lateral (escritorio y tablet) */}
      {!isCompact && !isPortraitMobile && (
        <div className="flex min-h-0 flex-col border-r border-border/60 game-panel overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ containerType: 'inline-size', paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
          <div className="w-full flex flex-col items-center gap-1.5 pb-2 mb-2 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-center gap-2">
              <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-[22cqi] max-w-[64px] object-contain" />
              <Wordmark size="sm" />
            </div>
            <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-0.5 text-[6.5cqi] font-bold text-accent">🎓 {t('ob_badge')}</span>
          </div>
          <div className="w-full shrink-0 mb-2 rounded-xl px-[6.7cqi] py-[5.4cqi] border border-primary/25 bg-primary/10 text-center">
            <p className="text-[10cqi] font-semibold text-foreground/70 leading-none mb-1.5">{t('game_whereIs')}</p>
            <p className="text-[15.5cqi] font-black leading-tight text-primary" style={{ wordBreak: 'break-word' }}>{currentCity.name}</p>
            <p className="mt-1.5 text-xs text-foreground/60 flex items-center justify-center gap-1.5"><Flag country={currentCity.country} className="w-5" /> {currentCity.country}</p>
          </div>
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">⭐ {t('game_points')}</p>
            <p className={`text-[20cqi] font-mono font-black leading-none text-primary ${scorePop ? 'animate-score-pop' : ''}`}>{score.toLocaleString(appNumberLocale())}</p>
          </div>
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('game_round')}</p>
            <p className="text-[15cqi] font-mono font-bold leading-none mb-2">{currentRound + 1}<span className="text-foreground/40 text-base">/{TOTAL_ROUNDS}</span></p>
            {dots}
          </div>
          <p className="w-full text-center text-xs text-muted-foreground shrink-0">💡 {hintText}</p>
          <div className="flex-1" />
          <Mascot state={showHint ? 'thinking' : 'happy'} className="w-[42cqi] max-w-[120px] mx-auto mb-2 animate-mascot-float" />
          <div className="w-full shrink-0">
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} />
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="relative flex-1 h-full min-h-0 min-w-0 overflow-hidden">
        {/* HUD compacto (celular horizontal) */}
        {isCompact && !isPortraitMobile && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-1"
            style={{ paddingTop: 'max(0.35rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}>
            <div className="flex items-center gap-2">
              <img src="/mascot/explorer-logo.webp" alt="" className="w-6 h-6 object-contain shrink-0" />
              <div className="flex-1 min-w-0 flex justify-center">
                <div className="max-w-full truncate rounded-full border border-accent/40 px-3 py-1 text-sm font-black backdrop-blur-md" style={pillStyle}>
                  {t('game_whereIs')} <span className="text-primary">{currentCity.name}</span>
                </div>
              </div>
              <button onClick={() => { playButtonTap(); onGoHome(); }} className="pointer-events-auto w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-base backdrop-blur-md active:scale-90" style={pillStyle} aria-label={t('game_exit')}>×</button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="rounded-full px-2 py-0.5 border border-accent/50 backdrop-blur-md whitespace-nowrap text-accent" style={pillStyle}>🎓 {t('ob_badge')} · {currentRound + 1}/{TOTAL_ROUNDS}</span>
              <div className="flex-1 min-w-[90px] rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md" style={pillStyle}>
                <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={phase === 'playing'} compact />
              </div>
              <span className="rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={pillStyle}>
                ⭐ <span className={`text-primary font-black ${scorePop ? 'animate-score-pop' : ''}`}>{score.toLocaleString(appNumberLocale())}</span> pts
              </span>
            </div>
          </div>
        )}

        {/* "Toca el mapa" + estado de la pista */}
        {phase === 'playing' && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))' }}>
            <span className="rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold border border-border/60 backdrop-blur-md whitespace-nowrap" style={pillStyle}>
              {isCompact || isPortraitMobile ? `💡 ${hintText}` : t('game_tapToAnswer')}
            </span>
          </div>
        )}

        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={phase !== 'playing'}
          userClick={lastClick}
          correctLocation={phase === 'feedback' ? correctPt : null}
          distanceKm={lastDistance !== null && Number.isFinite(lastDistance) ? lastDistance : null}
          gameMode="world"
          hintZone={phase === 'playing' && showHint ? correctPt : null}
          pinLabels={pinLabels}
          showZoomControls={phase === 'playing'}
        />

        {feedbackCard}
      </div>
    </div>
  );
}
