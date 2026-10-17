import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { City, getRandomCities, getProgressiveCities, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { haversineDistance, calculateBasePoints, getMultiplier, getDifficultyMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playPerfect, playMedium, playTick, playHeartbeat, playStreak, playGameOver, playMultiplierX2, playRoundTransition, playTimeExpired } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticTick, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst, fireRedBurst, fireDistanceReveal } from '@/lib/confetti';
import { fireMultiplierFeedback, fireScoreFly, fireRoundFlash, fireStreakBorder } from '@/lib/juiceAnimations';
import { useGameLayoutMode, useIsPortraitMobile, type GameLayoutMode } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGamepad } from '@/hooks/useGamepad';
import { useUltraWide } from '@/hooks/useUltraWide';
import WorldMapCanvas from './WorldMapCanvas';
import Mascot, { type MascotState } from './Mascot';
import CountUp from '@/components/ui/CountUp';
import TimerBar from './TimerBar';
import { useA11y } from '@/contexts/AccessibilityContext';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';
import { getEquipped } from '@/lib/cosmetics';
import Wordmark from '@/components/ui/Wordmark';
import RoundFeedbackCard from './RoundFeedbackCard';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const TRAINING_ROUNDS = 6;
const AUTO_ADVANCE_SECONDS = 3;

/** Quick continent guess from lat/lon — used for map highlight hint */
function getContinentFromCoords(lat: number, lon: number): string | null {
  if (lat > 34 && lon >= -25 && lon <= 50) return 'Europe';
  if (lat >= -38 && lat <= 40 && lon >= -25 && lon <= 60 && !(lat > 34 && lon < 50)) return 'Africa';
  if (lon >= -170 && lon <= -30) return 'Americas';
  if (lon > 25 && lon <= 150 && lat > -12) return 'Asia';
  if (lat < -10 && lon > 100) return 'Oceania';
  return null;
}

export interface RoundResult {
  city: City;
  clickLat: number;
  clickLon: number;
  distance: number;
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  timeUsed: number;
}

interface GameScreenProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onRoundComplete: (result: RoundResult) => void;
  onGameOver: (rounds: RoundResult[], reason: 'timeout' | 'complete') => void;
  seed?: number;
  isTraining?: boolean;
  /** Override seconds per round (default 15) */
  maxTimeOverride?: number;
  /** Override number of rounds (default 13, training 6) */
  totalRoundsOverride?: number;
  /** Revenge mode: inject specific cities to replay */
  citiesOverride?: City[];
  /** Salir de la partida (botón × del HUD). Pide confirmación. */
  onExit?: () => void;
  /** Música: estado y toggle (el botón vive en el HUD durante la partida) */
  musicMuted?: boolean;
  onToggleMusic?: () => void;
}

function getRoundFeedback(distance: number, palette?: ReturnType<typeof useA11y>['palette'], t?: (key: string) => string): { emoji: string; phrase: string; color: string } {
  const p = palette;
  if (distance < 50) return { emoji: '🎯', phrase: t?.('game_perfect') ?? '¡PERFECTO!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 300) return { emoji: '🔥', phrase: t?.('game_incredible') ?? '¡Increíble!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 1000) return { emoji: '👏', phrase: t?.('game_veryGood') ?? '¡Muy bien!', color: p?.fair.tw ?? 'text-emerald-400' };
  if (distance < 2000) return { emoji: '👍', phrase: t?.('game_good') ?? 'Bien hecho', color: p?.medium.tw ?? 'text-yellow-400' };
  if (distance < 3000) return { emoji: '👀', phrase: t?.('game_almost') ?? 'Casi...', color: p?.warn.tw ?? 'text-orange-400' };
  if (distance < 5000) return { emoji: '🌍', phrase: t?.('game_far') ?? 'Lejos...', color: p?.bad.tw ?? 'text-red-400' };
  return { emoji: '😬', phrase: t?.('game_veryFar') ?? 'Muy lejos', color: p?.bad.tw ?? 'text-red-500' };
}

export default function GameScreen({ difficulty, gameMode, onRoundComplete, onGameOver, seed, isTraining = false, maxTimeOverride, totalRoundsOverride, citiesOverride, onExit, musicMuted, onToggleMusic }: GameScreenProps) {
  const { t } = useI18n();
  const layoutMode = useGameLayoutMode();
  const { palette } = useA11y();
  const isCompact = layoutMode === 'compact';
  const isWide = layoutMode === 'wide';
  const hasSidebar = layoutMode !== 'compact'; // medium + wide
  const isPortraitMobile = useIsPortraitMobile();
  const effectiveMaxTime = maxTimeOverride ?? MAX_TIME;
  const totalRounds = totalRoundsOverride ?? (isTraining ? TRAINING_ROUNDS : TOTAL_ROUNDS);
  // Revenge mode uses injected cities; otherwise player-selected difficulty
  const [cities] = useState(() =>
    citiesOverride
      ? citiesOverride
      : getRandomCities(difficulty, totalRounds, gameMode, seed),
  );
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(effectiveMaxTime);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [distanceRevealActive, setDistanceRevealActive] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(AUTO_ADVANCE_SECONDS);
  const [scorePop, setScorePop] = useState(false);
  const [floatPoints, setFloatPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [failShake, setFailShake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const scoreElRef = useRef<HTMLParagraphElement>(null);

  const currentCity = cities[currentRound];

  // Cosméticos equipados (pin + trail) para que se VEAN en el mapa
  const equippedPin = getEquipped('pin');
  const equippedTrail = getEquipped('trail');
  const pinConfig = equippedPin?.config as { fill?: string; stroke?: string; glow?: string; size?: number } | undefined;
  const trailConfig = equippedTrail?.config as { color?: string; colors?: string[]; width?: number; style?: string; glow?: boolean } | undefined;

  // Hint circle: reset on each new round, reveal after 5 s of no click (training only)
  useEffect(() => {
    setShowHint(false);
    if (!isTraining || !currentCity) return;
    const hintTimer = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(hintTimer);
  }, [currentRound, isTraining, currentCity]);

  // Hide hint as soon as the player clicks (isWaiting becomes true)
  useEffect(() => {
    if (isWaiting) setShowHint(false);
  }, [isWaiting]);

  // Tiempo en pausa (vertical / app oculta) que NO cuenta para el multiplicador de velocidad
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  useEffect(() => {
    const paused = isPortraitMobile || isPageHidden;
    if (paused && pauseStartRef.current == null) pauseStartRef.current = Date.now();
    if (!paused && pauseStartRef.current != null) { pausedMsRef.current += Date.now() - pauseStartRef.current; pauseStartRef.current = null; }
  }, [isPortraitMobile, isPageHidden]);

  // Reset timeLeft and roundStart when a new round begins
  useEffect(() => {
    if (!currentCity) return;
    roundStartRef.current = Date.now();
    pausedMsRef.current = 0;
    pauseStartRef.current = (isPortraitMobile || isPageHidden) ? Date.now() : null;
    setTimeLeft(effectiveMaxTime);
    announce(t('sr_announceRound', { round: currentRound + 1, city: currentCity.name, time: effectiveMaxTime }), 'assertive');
  }, [currentRound, currentCity, t]);

  // Pause game when app loses focus / user switches apps (mobile)
  useEffect(() => {
    const onVisibility = () => setIsPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onVisibility);
    window.addEventListener('focus', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, []);

  // Single timer effect — pauses when waiting, portrait, or no city
  useEffect(() => {
    if (isWaiting || !currentCity || isPortraitMobile || isPageHidden) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          playTimeExpired();
          setTimeout(() => playGameOver(), 300);
          hapticError();
          // Fuera del updater de estado: evita "Cannot update Index while rendering GameScreen"
          setTimeout(() => onGameOver(rounds, 'timeout'), 0);
          return 0;
        }
        if (prev <= 4) { playHeartbeat(); hapticTick(); } // Last 3s: heartbeat
        else if (prev <= 6) { playTick(prev); hapticTick(); } // 5-6s: ticks with rising pitch
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound, isWaiting, currentCity, isPortraitMobile, isPageHidden]);

  useEffect(() => {
    if (!isWaiting || !lastResult) return;
    // If distance reveal is playing (>5000km), wait for it to finish before showing feedback
    const delay = distanceRevealActive ? 2800 : 1200;
    const timeout = setTimeout(() => setShowPopup(true), delay);
    return () => clearTimeout(timeout);
  }, [isWaiting, lastResult, distanceRevealActive]);

  useEffect(() => {
    if (!showPopup) return;
    setAutoAdvanceTimer(AUTO_ADVANCE_SECONDS);
    const interval = setInterval(() => {
      setAutoAdvanceTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          advanceRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopup, isPortraitMobile]);

  const advanceRound = useCallback(() => {
    if (currentRound + 1 >= totalRounds) {
      onGameOver(rounds, 'complete');
    } else {
      // ── Phase 4: Round flash summary before transition ──
      if (lastResult) {
        fireRoundFlash(lastResult.totalPoints, lastResult.city.name, lastResult.distance < 1500);
      }
      setCurrentRound(r => r + 1);
      setIsWaiting(false);
      setShowPopup(false);
      setDistanceRevealActive(false);
      setLastResult(null);
      playRoundTransition();
    }
  }, [currentRound, rounds, lastResult, onGameOver]);

  // Keyboard shortcuts (desktop)
  useKeyboardShortcuts({
    'Space': () => { if (isWaiting && showPopup) advanceRound(); },
    'Enter': () => { if (isWaiting && showPopup) advanceRound(); },
  }, true);

  // Gamepad support
  const gamepadState = useGamepad((action) => {
    if (action === 'advance' && isWaiting && showPopup) advanceRound();
    if (action === 'confirm' && !isWaiting && currentCity) {
      // Confirm at map center when using gamepad (no crosshair cursor yet)
      // Future: use gamepad right-stick crosshair position
    }
    if (action === 'zoom_in') { /* future: trigger zoom in */ }
    if (action === 'zoom_out') { /* future: trigger zoom out */ }
  });

  // Ultra-wide display support
  const { isUltraWide, maxMapWidth } = useUltraWide();

  // Throttled cursor coordinate update (60fps is too much, 10fps is enough)
  const cursorThrottleRef = useRef(0);
  const handleCursorMove = useCallback((lat: number, lon: number) => {
    const now = Date.now();
    if (now - cursorThrottleRef.current < 100) return; // ~10fps
    cursorThrottleRef.current = now;
    setCursorCoords({ lat, lon });
  }, []);

  const lastClickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);

  const handleMapClick = useCallback((lat: number, lon: number, viewportX?: number, viewportY?: number) => {
    if (isWaiting || !currentCity) return;
    lastClickViewportRef.current = viewportX != null && viewportY != null ? { x: viewportX, y: viewportY } : undefined;
    clearInterval(timerRef.current);
    playClick();
    hapticTap();

    const pausedNow = pauseStartRef.current != null ? Date.now() - pauseStartRef.current : 0;
    const timeUsed = Math.max(0, Math.round((Date.now() - roundStartRef.current - pausedMsRef.current - pausedNow) / 1000));
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);

    // Resilient streak: threshold 1500km, fail = halve (not reset), cap x1.60
    const newStreak = distance < 1500 ? streak + 1 : Math.max(0, Math.floor(streak / 2));
    setStreak(newStreak);
    // Reacción emocional de la mascota (juice Capa 6)
    setMascotState(
      distance >= 2000 ? 'sad'
        : newStreak >= 3 ? 'fire'
        : distance < 300 ? 'celebrate'
        : 'wink'
    );

    // Streak bonus: +10% per level starting at streak ≥ 2, capped at x1.60
    const streakBonus = newStreak >= 2 ? Math.min(1.6, 1 + (newStreak - 1) * 0.10) : 1;
    const totalPoints = Math.round(basePoints * mult.value * streakBonus * getDifficultyMultiplier(difficulty));

    const result: RoundResult = {
      city: currentCity,
      clickLat: lat,
      clickLon: lon,
      distance,
      basePoints,
      multiplier: mult.value,
      totalPoints,
      timeUsed,
    };

    setTimeout(() => {
      // Tier S: Perfect (<50km) — rainbow confetti + perfect chord
      if (distance < 50) { playPerfect(); hapticCelebration(); fireStarBurst(lastClickViewportRef.current); }
      // Tier A: Excellent (<300km) — gold confetti + good sound
      else if (distance < 300) { playGood(); hapticCelebration(); fireGoldBurst(lastClickViewportRef.current); }
      // Tier B: Good (<1000km) — good sound, no confetti
      else if (distance < 1000) { playGood(); hapticSuccess(); }
      // Tier C: Medium (<3000km) — neutral feedback
      else if (distance < 3000) { playMedium(); hapticTap(); }
      // Tier D: Far (3000km+) — bad sound + red burst
      else { playBad(); hapticError(); fireRedBurst(lastClickViewportRef.current); setFailShake(true); setTimeout(() => setFailShake(false), 450); }
      // Tier F: Epic fail (>5000km) — cinematic distance reveal (delays feedback panel)
      if (distance >= 5000) {
        setTimeout(() => { setDistanceRevealActive(true); fireDistanceReveal(distance); }, 400);
        setTimeout(() => setDistanceRevealActive(false), 2800);
      }
      // Speed multiplier bonus sound (top tier speed)
      if (mult.value >= 1.8) { setTimeout(() => playMultiplierX2(), 350); }
      // ── Phase 4: Multiplier mega-feedback (top of screen, finishes before feedback popup) ──
      if (mult.value >= 1.5) {
        setTimeout(() => fireMultiplierFeedback(mult.value, newStreak, lastClickViewportRef.current), 150);
      }
      // Streak sound: pitch rises with each consecutive good round
      if (newStreak >= 2) { setTimeout(() => playStreak(newStreak), 300); }
      // ── Phase 4: Streak fire border glow ──
      if (newStreak >= 3) {
        setTimeout(() => fireStreakBorder(newStreak), 400);
      }
    }, 200);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setFloatPoints(totalPoints);
    // ── Phase 4: Score fly animation from click to score counter ──
    if (lastClickViewportRef.current && scoreElRef.current) {
      const scoreRect = scoreElRef.current.getBoundingClientRect();
      const scoreTo = { x: scoreRect.left + scoreRect.width / 2, y: scoreRect.top + scoreRect.height / 2 };
      setTimeout(() => fireScoreFly(totalPoints, lastClickViewportRef.current!, scoreTo), 300);
    }
    setTimeout(() => { setScorePop(false); setFloatPoints(null); }, 600);
    setLastResult(result);
    setRounds(r => [...r, result]);
    setIsWaiting(true);
    onRoundComplete(result);
    // Screen reader announcement
    const fb = getRoundFeedback(distance, palette, t);
    announce(t('sr_announceResult', { feedback: fb.phrase, city: currentCity.name, country: currentCity.country, distance: Math.round(distance), points: totalPoints, round: currentRound + 1, total: totalRounds }));
  }, [isWaiting, currentCity, onRoundComplete, t]);

  useEffect(() => { setMascotState('idle'); }, [currentRound]);

  if (!currentCity) return null;

  const mult = lastResult ? getMultiplier(lastResult.timeUsed) : null;
  const diffMult = getDifficultyMultiplier(difficulty);
  const feedback = lastResult ? getRoundFeedback(lastResult.distance, palette, t) : null;
  const showStreak = streak >= 2;
  const streakPct = streak >= 2 ? Math.min(60, (streak - 1) * 10) : 0;
  const streakBonusNow = streak >= 2 ? Math.min(1.6, 1 + (streak - 1) * 0.10) : 1;
  const modeLabel = t(`mode_${gameMode}` as never) || MODE_CONFIG.find(m => m.key === gameMode)?.label || gameMode;
  const diffLabel = t(`diff_${difficulty}` as never) || difficulty;
  const isTouchDevice = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  const confirmExit = () => { if (onExit && window.confirm(t('game_exitConfirm'))) onExit(); };
  // Estable entre renders: WorldMapCanvas lo usa como dependencia de la animación del trazo
  const pinLabels = useMemo(() => ({ you: t('game_yourAnswer'), correct: t('game_correctCity') }), [t]);
  // Objetos estables: si se recrean en cada render (tic del auto-avance), WorldMapCanvas reinicia
  // la animación del trazo y nunca llega a mostrar la ciudad correcta ni las etiquetas.
  const userClickPt = useMemo(() => lastResult ? { lat: lastResult.clickLat, lon: lastResult.clickLon } : null, [lastResult]);
  const correctPt = useMemo(() => lastResult ? { lat: lastResult.city.lat, lon: lastResult.city.lon } : null, [lastResult]);

  // Near-miss detection — motivate the player when they were close to a better tier
  const nearMissMsg = (() => {
    if (!lastResult) return null;
    const d = lastResult.distance;
    const t2 = lastResult.timeUsed;
    // Close to perfect distance (<50km threshold)
    if (d >= 50 && d < 80) return '¡A ' + Math.round(d - 50) + 'km del PERFECTO!';
    // Close to speed x2 tier (needs <~3s for x1.8+)
    if (t2 >= 4 && t2 <= 5 && d < 500) {
      const betterMult = getMultiplier(t2 - 2).value;
      if (betterMult > (mult?.value ?? 0)) return '¡' + (t2 - 3) + 's más rápido = ×' + betterMult.toFixed(1) + '!';
    }
    // Close to excellent (<300km threshold)
    if (d >= 300 && d < 400) return '¡A ' + Math.round(d - 300) + 'km del EXCELENTE!';
    return null;
  })();
  const isTimerCritical = timeLeft <= 3 && !isWaiting;
  const isTimerUrgent = timeLeft <= 5 && !isWaiting;

  // Right panel visible only after click result (as overlay)
  const showRightPanel = isWide && showPopup && lastResult && feedback;

  // Layout classes based on mode — always 2 columns in wide (panel is overlay)
  const layoutClass = isPortraitMobile
    ? 'flex flex-col' // Portrait: stacked vertically (top bar + map)
    : isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(13rem,22vw,21rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(13rem,24vw,21rem)_minmax(0,1fr)]'; // medium: sidebar + map

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass} ${isTimerUrgent ? 'vignette-urgent' : ''} ${(isTimerCritical || failShake) ? 'animate-screen-shake' : ''}`}
      role="main"
      aria-label="Pantalla de juego"
      data-game-container
    >
      {/* Portrait top bar — stacked vertical layout for mobile portrait */}
      {isPortraitMobile && (
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-col gap-1.5 shrink-0 z-20">
          {/* Row 1: City + Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>
                {currentRound + 1}/{totalRounds}
              </span>
              <p className="text-sm font-black truncate">📍 {currentCity.name}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}>
                <CountUp value={score} />
              </span>
            </div>
          </div>
          {/* Row 2: Country + Timer */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">🌍 {currentCity.country}</p>
            <TimerBar timeLeft={timeLeft} maxTime={effectiveMaxTime} isRunning={!isWaiting} compact />
          </div>
        </div>
      )}

      {/* ──── Left sidebar (medium + wide) — idéntico en dark/light y training/normal ──── */}
      {hasSidebar && (
        <div
          className="flex min-h-0 flex-col gap-0 border-r border-border/60 bg-card overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ containerType: 'inline-size', paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          {/* ── Logo ── */}
          <div className="w-full flex flex-col items-center gap-1.5 pb-2 mb-2 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo.png" alt="GeoSpeed" className="w-[22cqi] max-w-[64px] object-contain" />
              <Wordmark size="sm" />
            </div>
            <span className="rounded-full border border-accent/40 px-3 py-0.5 text-[6.5cqi] font-bold text-muted-foreground">
              <span className="text-primary">{modeLabel}</span> · {diffLabel}
            </span>
          </div>

          {/* ── Training badge (mismo estilo dark y light) ── */}
          {isTraining && (
            <div className="w-full flex justify-center mb-2 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground/70">
                {t('game_trainingPrefix')}
              </span>
            </div>
          )}

          {/* ── Ciudad a encontrar ── */}
          <div className="w-full shrink-0 mb-2 rounded-xl px-[6.7cqi] py-[5.4cqi] border border-primary/25 bg-primary/10 text-center">
            <p className="text-[10cqi] font-semibold text-foreground/70 leading-none mb-1.5" id="city-label">
              {t('game_whereIs')}
            </p>
            <p
              className="text-[15.5cqi] font-black leading-tight text-center"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none' }}
              aria-labelledby="city-label"
            >
              {currentCity.name}
            </p>
            {isTraining && !isWaiting && (
              <p className="mt-1.5 text-xs text-foreground/50">
                🌍 <span className="font-bold text-foreground/75">{currentCity.country}</span>
              </p>
            )}
          </div>

          {/* ── Puntuación ── */}
          <div className="w-full text-center shrink-0 relative mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">⭐ {t('game_points')}</p>
            <p
              ref={scoreElRef}
              className={`text-[20cqi] font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
              aria-live="polite"
            >
              <CountUp value={score} />
            </p>
            {floatPoints !== null && (
              <span className={`absolute left-1/2 -top-1 -translate-x-1/2 font-bold pointer-events-none ${
                floatPoints >= 1000 ? 'text-sm text-green-400 animate-float-up-big' : 'text-xs text-green-400 animate-float-up'
              }`}>
                +{floatPoints.toLocaleString()}{floatPoints >= 1000 ? ' 🔥' : ''}
              </span>
            )}
            {diffMult > 1 && (
              <span className="mt-1.5 inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[7cqi] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>
                🎯 ×{diffMult} <span className="opacity-70">dif.</span>
              </span>
            )}
          </div>

          {/* ── Progreso de rondas ── */}
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('game_round')}</p>
            <p className="text-[15cqi] font-mono font-bold leading-none">
              {currentRound + 1}<span className="text-foreground/40 text-base">/{totalRounds}</span>
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {Array.from({ length: totalRounds }).map((_, i) => {
                const round = rounds[i];
                let dotClass = 'bg-border';
                if (round) {
                  dotClass = round.distance < 500 ? palette.good.twBg : round.distance < 2000 ? palette.medium.twBg : palette.bad.twBg;
                } else if (i === currentRound) {
                  dotClass = 'bg-primary animate-pulse';
                }
                return <div key={i} className={`h-2 w-2 rounded-full transition-colors duration-300 ${dotClass}`} />;
              })}
            </div>
          </div>

          {/* ── Racha, multiplicador y mascota (en una sola fila) ── */}
          <div className="w-full flex items-center justify-center gap-2.5 shrink-0 mb-2 min-h-[46px]">
            {(showStreak || mult) && (
              <div className="flex flex-col items-center gap-1.5">
                {showStreak && (
                  <div className="text-center animate-score-pop">
                    <span className="inline-block rounded-full bg-primary/15 border border-primary/40 px-2 py-0.5 text-[4cqi] font-bold text-primary">
                      🔥 {t('game_streakCount', { n: streak })}{streakPct > 0 && <span className="ml-0.5 text-[10px] opacity-80">+{streakPct}%</span>}
                    </span>
                  </div>
                )}
                {mult && (
                  <div className="text-center">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[4cqi] font-bold ${
                      mult.value >= 1.5 ? `${palette.good.twBgSoft} ${palette.good.twBorder} ${palette.good.tw}`
                      : mult.value >= 1.0 ? `${palette.medium.twBgSoft} ${palette.medium.twBorder} ${palette.medium.tw}`
                      : `${palette.bad.twBgSoft} ${palette.bad.twBorder} ${palette.bad.tw}`
                    }`}>
                      {mult.emoji} {mult.label}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Mascot
              state={mascotState}
              className={`w-[48cqi] max-w-[130px] shrink-0 select-none pointer-events-none drop-shadow-[0_4px_10px_hsl(var(--primary)/0.35)] ${mascotState === 'idle' ? 'animate-mascot-float' : ''}`}
            />
          </div>

          {/* ── Timer ── (sticky al fondo: siempre visible aunque el sidebar tenga poco alto, p.ej. Samsung S23 FE landscape) */}
          <div className="w-full shrink-0 sticky bottom-0 z-10 bg-card pt-2 mt-auto">
            <TimerBar timeLeft={timeLeft} maxTime={effectiveMaxTime} isRunning={!isWaiting} />
          </div>
        </div>
      )}

      {/* ──── Map area (all modes) — h-full gives WorldMapCanvas explicit height in grid ──── */}
      <div className="relative h-full min-w-0 overflow-hidden" style={{ maxWidth: maxMapWidth, margin: isUltraWide ? '0 auto' : undefined }}>
        {/* ── HUD compacto (móvil horizontal) — maqueta Partida_Movil_APROBADA_v1 ── */}
        {isCompact && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-1"
            style={{ paddingTop: 'max(0.35rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                <Wordmark size="xs" className="hidden min-[520px]:inline" />
              </div>
              <div className="flex-1 min-w-0 flex justify-center">
                <div className="max-w-full truncate rounded-full border border-accent/40 px-3 py-1 text-sm font-black backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
                  {isTraining && <span className="text-muted-foreground font-semibold">{t('game_trainingPrefix')} · </span>}
                  {t('game_whereIs')} <span className="text-primary">{currentCity.name}</span>
                  {isTraining && !isWaiting && <span className="text-muted-foreground font-semibold"> · {currentCity.country}</span>}
                </div>
              </div>
              {onToggleMusic && (
                <button
                  onClick={onToggleMusic}
                  className="pointer-events-auto w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-sm backdrop-blur-md transition-all active:scale-90"
                  style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}
                  aria-label={musicMuted ? t('music_on') : t('music_off')}
                >
                  {musicMuted ? '🔇' : '🔊'}
                </button>
              )}
              {onExit && (
                <button
                  onClick={confirmExit}
                  className="pointer-events-auto w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-base backdrop-blur-md transition-all active:scale-90"
                  style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}
                  aria-label={t('game_exit')}
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="hidden min-[560px]:inline rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
                <span className="text-primary">{modeLabel}</span> · {diffLabel}
              </span>
              <span className="rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
                {t('game_round')} <span className="text-primary">{currentRound + 1}</span><span className="text-muted-foreground"> / {totalRounds}</span>
              </span>
              <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
                <span className={`font-mono whitespace-nowrap ${timeLeft <= 3 && !isWaiting ? 'text-destructive animate-pulse' : timeLeft <= 5 && !isWaiting ? 'text-destructive' : ''}`}>⏱ {timeLeft} s</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(timeLeft / effectiveMaxTime) * 100}%`, background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))', transition: isWaiting ? 'none' : 'width 200ms linear' }} />
                </div>
              </div>
              <span className="relative rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
                ⭐ <span ref={scoreElRef} className={`text-primary font-black ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite"><CountUp value={score} /></span> pts
                {floatPoints !== null && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-accent animate-float-up whitespace-nowrap">+{floatPoints.toLocaleString()}</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Música + salir (escritorio / tablet con panel lateral) */}
        {!isCompact && (onExit || onToggleMusic) && (
          <div className="absolute z-20 flex items-center gap-2" style={{ top: 'max(0.5rem, var(--sat))', right: 'max(0.5rem, var(--sar))' }}>
            {onToggleMusic && (
              <button
                onClick={onToggleMusic}
                className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-base backdrop-blur-md transition-all active:scale-90"
                style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}
                aria-label={musicMuted ? t('music_on') : t('music_off')}
              >
                {musicMuted ? '🔇' : '🔊'}
              </button>
            )}
            {onExit && (
              <button
                onClick={confirmExit}
                className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-lg backdrop-blur-md transition-all active:scale-90"
                style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}
                aria-label={t('game_exit')}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Racha (móvil): abajo a la izquierda, como la maqueta */}
        {isCompact && showStreak && !isWaiting && (
          <div className="absolute z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))', left: 'max(0.5rem, var(--sal))' }}>
            <span className="rounded-full px-3 py-1 text-xs font-bold border border-primary/50 backdrop-blur-md animate-score-pop" style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
              🔥 <span className="text-primary">{streak}</span> {t('game_streakCount', { n: streak }).replace(/^\d+\s*/, '')}
            </span>
          </div>
        )}

        {/* "Toca el mapa para responder" */}
        {!isWaiting && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))' }}>
            <span className="rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold border border-border/60 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
              {isTouchDevice ? t('game_tapToAnswer') : t('game_clickToAnswer')}
            </span>
          </div>
        )}

        {/* Gamepad connected indicator */}
        {gamepadState.connected && !isCompact && !isPortraitMobile && (
          <div className="absolute bottom-10 left-4 z-[6] pointer-events-none flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--primary) / 0.6)' }}>
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <circle cx="8" cy="12" r="1.5" fill="currentColor" />
              <circle cx="16" cy="12" r="1.5" fill="currentColor" />
              <line x1="11" y1="9" x2="13" y2="9" />
            </svg>
            <span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(var(--primary) / 0.5)' }}>
              GAMEPAD
            </span>
          </div>
        )}

        <WorldMapCanvas
          onMapClick={handleMapClick}
          onCursorMove={handleCursorMove}
          clickDisabled={isWaiting}
          userClick={userClickPt}
          correctLocation={correctPt}
          distanceKm={lastResult?.distance ?? null}
          gameMode={gameMode}
          hintZone={isTraining && !isWaiting && showHint ? { lat: currentCity.lat, lon: currentCity.lon } : null}
          highlightContinent={gameMode === 'world' && !isWaiting ? getContinentFromCoords(currentCity.lat, currentCity.lon) : null}
          pinConfig={pinConfig}
          trailConfig={trailConfig}
          pinLabels={pinLabels}
          showZoomControls={!isWaiting}
        />

        {/* Tarjeta de feedback — panel lateral en pantallas anchas */}
        {showRightPanel && (
          <div
            className="absolute inset-y-0 right-0 z-10 w-[clamp(24rem,36vw,32rem)] flex items-center animate-slide-in-right p-3 lg:p-4"
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <RoundFeedbackCard
              result={lastResult}
              feedback={feedback}
              mascot={mascotState}
              streak={streak}
              streakBonus={streakBonusNow}
              diffMult={diffMult}
              multLabel={mult?.label ?? ''}
              nearMissMsg={nearMissMsg}
              autoAdvanceTimer={autoAdvanceTimer}
              onNext={advanceRound}
              size="lg"
            />
          </div>
        )}

        {!isWide && showPopup && lastResult && feedback && (
          <div
            className={`absolute z-10 flex animate-slide-in-right ${
              isPortraitMobile
                ? 'inset-x-0 bottom-0 justify-center pb-2 px-2'
                : isCompact
                ? 'top-[4.75rem] bottom-1 right-0 w-[clamp(18rem,48vw,26rem)] items-start p-2'
                : 'inset-y-0 items-center right-0 w-[clamp(22rem,40vw,30rem)] p-3'
            }`}
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <div className="w-full max-h-full flex">
              <RoundFeedbackCard
                result={lastResult}
                feedback={feedback}
                mascot={mascotState}
                streak={streak}
                streakBonus={streakBonusNow}
                diffMult={diffMult}
                multLabel={mult?.label ?? ''}
                nearMissMsg={nearMissMsg}
                autoAdvanceTimer={autoAdvanceTimer}
                onNext={advanceRound}
                size="md"
              />
            </div>
          </div>
        )}
      </div>
      {/* Right panel removed — now rendered as overlay inside map area */}
    </div>
  );
}

function ModeLabel({ gameMode, compact }: { gameMode: GameMode; compact?: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`absolute left-1/2 z-10 -translate-x-1/2 pointer-events-none transition-opacity duration-1000 ${compact ? 'top-[6rem]' : 'top-3'}`} style={{ opacity: visible ? 1 : 0 }}>
      <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-background/70 backdrop-blur-sm text-xs sm:text-sm font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--primary))' }}>
        {MODE_CONFIG.find(m => m.key === gameMode)?.emoji} {MODE_CONFIG.find(m => m.key === gameMode)?.label}
      </span>
    </div>
  );
}