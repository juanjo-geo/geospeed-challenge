import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { City, getRandomCities, getProgressiveCities, getMapBounds, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
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
import { HudIconButton, InGameSettings } from './GameHud';
import { frameAnswer } from '@/lib/mapFraming';
import FitToBox from '@/components/ui/FitToBox';
import { appNumberLocale } from '@/lib/format';

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
  /** Segundos con un decimal, solo para mostrar ("Respuesta 4,7 s"). La puntuación usa timeUsed. */
  timeExact?: number;
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
  const { t, locale } = useI18n();
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
  // Ajustes rápidos del engranaje: mientras están abiertos la ronda queda en pausa
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);
  settingsOpenRef.current = settingsOpen;
  // Tamaño del área del mapa (para encuadrar la respuesta junto a la tarjeta)
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [mapArea, setMapArea] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMapArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
    const paused = isPortraitMobile || isPageHidden || settingsOpen;
    if (paused && pauseStartRef.current == null) pauseStartRef.current = Date.now();
    if (!paused && pauseStartRef.current != null) { pausedMsRef.current += Date.now() - pauseStartRef.current; pauseStartRef.current = null; }
  }, [isPortraitMobile, isPageHidden, settingsOpen]);

  // Reset timeLeft and roundStart when a new round begins
  useEffect(() => {
    if (!currentCity) return;
    roundStartRef.current = Date.now();
    pausedMsRef.current = 0;
    pauseStartRef.current = (isPortraitMobile || isPageHidden || settingsOpenRef.current) ? Date.now() : null;
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
    if (isWaiting || !currentCity || isPortraitMobile || isPageHidden || settingsOpen) {
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
  }, [currentRound, isWaiting, currentCity, isPortraitMobile, isPageHidden, settingsOpen]);

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
        if (settingsOpenRef.current) return prev; // en pausa con los ajustes abiertos
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
    const elapsedS = Math.max(0, (Date.now() - roundStartRef.current - pausedMsRef.current - pausedNow) / 1000);
    const timeUsed = Math.round(elapsedS);
    const timeExact = Math.round(elapsedS * 10) / 10;
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
      timeExact,
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
        setTimeout(() => { setDistanceRevealActive(true); fireDistanceReveal(distance, t('reveal_otherSide')); }, 400);
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

  const numberLocale = locale === 'en' ? 'en-US' : 'es-CO';
  const fmtSecs = (r: RoundResult) => (r.timeExact ?? r.timeUsed).toLocaleString(numberLocale, { maximumFractionDigits: 1 });
  // Respuesta: el mapa se acerca a tu punto y a la ciudad correcta, dejando libre lo que tapa la tarjeta
  const feedbackBounds = useMemo(() => {
    if (!showPopup || !lastResult || mapArea.w === 0) return null;
    const vw = typeof window !== 'undefined' ? window.innerWidth : mapArea.w;
    const clampPx = (min: number, pref: number, max: number) => Math.max(min, Math.min(pref, max));
    const cover = isPortraitMobile
      ? { bottom: 0.5 }
      : isCompact
      ? { right: clampPx(288, 0.48 * vw, 416) / mapArea.w }
      : isWide
      ? { right: clampPx(384, 0.36 * vw, 512) / mapArea.w }
      : { right: clampPx(352, 0.40 * vw, 480) / mapArea.w };
    return frameAnswer(
      { lat: lastResult.clickLat, lon: lastResult.clickLon },
      { lat: lastResult.city.lat, lon: lastResult.city.lon },
      mapArea.w, mapArea.h, cover, getMapBounds(gameMode),
    );
  }, [showPopup, lastResult, mapArea.w, mapArea.h, isPortraitMobile, isCompact, isWide, gameMode]);

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

      {/* ──── Barra lateral (medium + wide) — maqueta Partida_Computador: marca + modo, ¿Dónde está?,
           reloj (o tiempo de respuesta), PUNTOS, RONDA y racha en tarjetas ──── */}
      {hasSidebar && (
        <div
          className="flex min-h-0 flex-col gap-[3.2cqi] border-r-2 border-accent/50 bg-card overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ containerType: 'inline-size', paddingLeft: 'max(0.9rem, var(--sal))', paddingRight: '0.9rem', paddingTop: '1rem', paddingBottom: '1rem' }}
        >
          <div className="w-full flex flex-col items-center gap-[3.5cqi] shrink-0">
            <div className="flex items-center justify-center gap-[2.5cqi]">
              <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-[19cqi] max-w-[60px] object-contain" />
              <Wordmark size="custom" className="text-[11.5cqi]" />
            </div>
            <span className="rounded-full border-2 border-accent/50 px-[6cqi] py-[1.6cqi] text-[6.6cqi] font-semibold whitespace-nowrap">
              <span className="text-primary">{modeLabel}</span><span className="text-accent mx-[2cqi]">·</span>{diffLabel}
            </span>
          </div>

          {isTraining && (
            <div className="w-full flex justify-center shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground/70">
                {t('game_trainingPrefix')}
              </span>
            </div>
          )}

          {/* ¿Dónde está? */}
          <div className="w-full shrink-0 rounded-2xl border-2 border-accent/50 bg-background/40 px-[5cqi] py-[5.5cqi] text-center">
            <p className="text-[8.6cqi] font-bold leading-none mb-[2.5cqi]" id="city-label">{t('game_whereIs')}</p>
            <p
              className="text-[14.5cqi] font-extrabold leading-tight"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none', textShadow: '0 2px 10px hsl(var(--primary) / 0.25)' }}
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

          {/* Reloj de la ronda · en la respuesta, el tiempo que tardaste */}
          {isWaiting && lastResult ? (
            <div className="flex items-center gap-[4cqi] px-[2cqi] shrink-0">
              <ClockIcon className="w-[11cqi] h-[11cqi] text-accent shrink-0" />
              <span className="leading-tight">
                <span className="block text-[6.6cqi] text-muted-foreground">{t('game_answerTime')}</span>
                <span className="block text-[9.5cqi] font-bold">{fmtSecs(lastResult)} s</span>
              </span>
            </div>
          ) : (
            <div className="shrink-0 px-[1.5cqi]" role="timer" aria-label={`${timeLeft} s`}>
              <div className="flex items-center gap-[3.5cqi] mb-[2.5cqi]">
                <ClockIcon className="w-[10cqi] h-[10cqi] text-accent shrink-0" />
                <span className={`text-[9.5cqi] font-bold ${isTimerCritical ? 'text-destructive animate-pulse' : isTimerUrgent ? 'text-destructive' : ''}`}>{timeLeft} s</span>
              </div>
              <div className="h-[6cqi] min-h-[12px] rounded-full border-2 border-accent/50 bg-background/40 p-[2px]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(timeLeft / effectiveMaxTime) * 100}%`,
                    background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))',
                    boxShadow: timeLeft <= 5 ? 'none' : '0 0 10px hsl(var(--accent) / 0.6)',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>
          )}

          {/* PUNTOS */}
          <div className="relative w-full shrink-0 rounded-2xl border-2 border-accent/30 bg-background/40 px-[5cqi] py-[3.5cqi] flex items-center gap-[4.5cqi]">
            <span className="text-[12cqi] leading-none" aria-hidden>⭐</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide">{t('game_points')}</span>
              <span ref={scoreElRef} className={`block text-[11.5cqi] font-extrabold text-primary leading-none ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite">
                <CountUp value={score} />
              </span>
            </span>
            {floatPoints !== null && (
              <span className={`absolute right-[5cqi] top-[3cqi] font-bold text-accent pointer-events-none ${floatPoints >= 1000 ? 'text-sm animate-float-up-big' : 'text-xs animate-float-up'}`}>
                +{floatPoints.toLocaleString(numberLocale)}
              </span>
            )}
          </div>

          {/* RONDA */}
          <div className="w-full shrink-0 rounded-2xl border-2 border-accent/30 bg-background/40 px-[5cqi] py-[3.5cqi] flex items-center gap-[4.5cqi]">
            <BarsIcon className="w-[11cqi] h-[11cqi] text-accent shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide">{t('game_round')}</span>
              <span className="block text-[10.5cqi] font-extrabold leading-none">
                <span className="text-primary">{currentRound + 1}</span> / {totalRounds}
              </span>
            </span>
          </div>

          {/* Racha */}
          {showStreak && (
            <div className="w-full shrink-0 rounded-2xl border-2 border-primary/40 bg-background/40 px-[5cqi] py-[3cqi] flex items-center gap-[3.5cqi] animate-score-pop">
              <span className="text-[11cqi] leading-none" aria-hidden>🔥</span>
              <span className="text-[7cqi] font-bold leading-tight">
                <span className="text-primary text-[9.5cqi] font-extrabold">{streak}</span> {t('game_streakCount', { n: streak }).replace(/^\d+\s*/, '')}
                {streakPct > 0 && <span className="ml-1 text-accent">+{streakPct}%</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Encabezado compacto (barra sólida encima del mapa; antes flotaba y tapaba el norte del mapa) (móvil horizontal) — maqueta Partida_Movil_APROBADA_v1 ── */}
      {isCompact && (
        <div
          className="relative z-20 shrink-0 flex flex-col gap-1 bg-brand-navy-deep border-b-2 border-accent/30 shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
          style={{ paddingTop: 'max(0.35rem, var(--sat))', paddingBottom: '0.4rem', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <img src="/mascot/explorer-logo.webp" alt="" className="w-6 h-6 object-contain" />
              <Wordmark size="xs" className="hidden min-[520px]:inline" />
            </div>
            <div className="flex-1 min-w-0 flex justify-center">
              <div className="max-w-full truncate rounded-full border-2 border-accent/50 px-4 py-1 text-[15px] font-extrabold backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
                {isTraining && <span className="text-muted-foreground font-semibold">{t('game_trainingPrefix')} · </span>}
                {t('game_whereIs')} <span className="text-primary">{currentCity.name}</span>
                {isTraining && !isWaiting && <span className="text-muted-foreground font-semibold"> · {currentCity.country}</span>}
              </div>
            </div>
            {onToggleMusic && <HudIconButton size="sm" icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton size="sm" icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            {onExit && <HudIconButton size="sm" icon="close" label={t('game_exit')} onClick={confirmExit} />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="hidden min-[560px]:inline rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              <span className="text-primary">{modeLabel}</span> · {diffLabel}
            </span>
            <span className="rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              {t('game_round')} <span className="text-primary">{currentRound + 1}</span><span className="text-muted-foreground"> / {totalRounds}</span>
            </span>
            <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              <span className={`font-mono whitespace-nowrap ${timeLeft <= 3 && !isWaiting ? 'text-destructive animate-pulse' : timeLeft <= 5 && !isWaiting ? 'text-destructive' : ''}`}>⏱ {timeLeft} s</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(timeLeft / effectiveMaxTime) * 100}%`, background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))', transition: isWaiting ? 'none' : 'width 200ms linear' }} />
              </div>
            </div>
            <span className="relative rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              ⭐ <span ref={scoreElRef} className={`text-primary font-black ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite"><CountUp value={score} /></span> pts
              {floatPoints !== null && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-accent animate-float-up whitespace-nowrap">+{floatPoints.toLocaleString(appNumberLocale())}</span>
              )}
            </span>
          </div>
        </div>
      )}
      {/* ──── Map area (all modes) — h-full gives WorldMapCanvas explicit height in grid ──── */}
      {/* w-full: con margin auto, un ítem de grid se encoge al tamaño del canvas (800 px) en ultrawide */}
      <div ref={mapAreaRef} className={`relative w-full ${isCompact || isPortraitMobile ? 'flex-1 min-h-0' : 'h-full'} min-w-0 overflow-hidden`} style={{ maxWidth: maxMapWidth, margin: isUltraWide ? '0 auto' : undefined }}>

        {/* Música + salir (escritorio / tablet con panel lateral) */}
        {!isCompact && (
          <div className="absolute z-20 flex items-center gap-2.5" style={{ top: 'max(0.75rem, var(--sat))', right: 'max(0.75rem, var(--sar))' }}>
            {onToggleMusic && <HudIconButton icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            {onExit && <HudIconButton icon="close" label={t('game_exit')} onClick={confirmExit} />}
          </div>
        )}

        {/* Racha (móvil): abajo a la izquierda, como la maqueta */}
        {isCompact && showStreak && !isWaiting && (
          <div className="absolute z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))', left: 'max(0.5rem, var(--sal))' }}>
            <span className="rounded-full px-3 py-1.5 text-xs font-bold border-2 border-accent/40 backdrop-blur-md animate-score-pop" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
              🔥 <span className="text-primary">{streak}</span> {t('game_streakCount', { n: streak }).replace(/^\d+\s*/, '')}
            </span>
          </div>
        )}

        {/* "Toca el mapa para responder" */}
        {!isWaiting && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))' }}>
            <span className="rounded-full px-4 py-1.5 short:py-1 text-xs sm:text-sm font-semibold border border-border/60 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
              {isTouchDevice ? t('game_tapToAnswer') : t('game_clickToAnswer')}
            </span>
          </div>
        )}

        {/* Leyenda de pines durante la respuesta (maqueta Feedback) */}
        {showPopup && lastResult && !isPortraitMobile && (
          <div className="absolute z-[6] pointer-events-none rounded-xl border border-accent/40 px-3 py-2 short:py-1 backdrop-blur-md text-xs short:text-[11px] font-semibold flex flex-col gap-1 short:gap-0.5" style={{ bottom: 'max(0.75rem, var(--sab))', left: 'max(0.75rem, var(--sal))', background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
            <span className="flex items-center gap-2"><PinIcon color="hsl(var(--accent))" />{t('game_correctCity')}</span>
            <span className="flex items-center gap-2"><PinIcon color="hsl(var(--primary))" />{t('game_yourAnswer')}</span>
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
          viewBounds={feedbackBounds}
        />

        {/* Tarjeta de feedback — panel lateral en pantallas anchas */}
        {showRightPanel && (
          <div
            className="absolute inset-y-0 right-0 z-10 w-[clamp(24rem,36vw,32rem)] flex items-center animate-slide-in-right p-3 lg:p-4"
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <FitToBox center origin="center right">
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
              timeLabel={`${fmtSecs(lastResult)} s`}
              size="lg"
              natural
            />
            </FitToBox>
          </div>
        )}

        {!isWide && showPopup && lastResult && feedback && (
          <div
            className={`absolute z-10 flex animate-slide-in-right ${
              isPortraitMobile
                ? 'inset-x-0 bottom-0 justify-center pb-2 px-2'
                : isCompact
                ? 'top-0 bottom-1 right-0 w-[clamp(18rem,48vw,26rem)] items-start p-2'
                : 'inset-y-0 items-center right-0 w-[clamp(22rem,40vw,30rem)] p-3'
            }`}
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <FitToBox maxScale={isCompact ? 0.88 : 1} center={!isCompact && !isPortraitMobile} origin={isPortraitMobile ? 'bottom center' : isCompact ? 'top right' : 'center right'} className={isPortraitMobile ? 'max-h-[70dvh]' : ''}>
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
                timeLabel={`${fmtSecs(lastResult)} s`}
                size="md"
                natural
              />
            </FitToBox>
          </div>
        )}
      </div>
      {settingsOpen && <InGameSettings musicMuted={musicMuted} onToggleMusic={onToggleMusic} onClose={() => setSettingsOpen(false)} />}
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

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

function BarsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="3" y="13" width="4" height="8" rx="1.2" /><rect x="10" y="8" width="4" height="13" rx="1.2" /><rect x="17" y="3" width="4" height="18" rx="1.2" />
    </svg>
  );
}

function PinIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="9.5" r="2.6" fill="white" />
    </svg>
  );
}
