import { useState, useEffect, useCallback, useRef } from 'react';
import { City, getRandomCities, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { haversineDistance, calculateBasePoints, getMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playTick, playGameOver } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticTick, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst } from '@/lib/confetti';
import { useGameLayoutMode, useIsPortraitMobile, type GameLayoutMode } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';
import { useA11y } from '@/contexts/AccessibilityContext';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const TRAINING_ROUNDS = 6;
const AUTO_ADVANCE_SECONDS = 5;

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
}

function getRoundFeedback(distance: number, palette?: ReturnType<typeof useA11y>['palette'], t?: (key: string) => string): { emoji: string; phrase: string; color: string } {
  const p = palette;
  if (distance < 50) return { emoji: '🎯', phrase: t?.('game_perfect') ?? '¡PERFECTO!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 200) return { emoji: '🔥', phrase: t?.('game_incredible') ?? '¡Increíble!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 500) return { emoji: '👏', phrase: t?.('game_veryGood') ?? '¡Muy bien!', color: p?.fair.tw ?? 'text-emerald-400' };
  if (distance < 1000) return { emoji: '👍', phrase: t?.('game_good') ?? 'Bien hecho', color: p?.medium.tw ?? 'text-yellow-400' };
  if (distance < 2000) return { emoji: '👀', phrase: t?.('game_almost') ?? 'Casi...', color: p?.warn.tw ?? 'text-orange-400' };
  if (distance < 5000) return { emoji: '🌍', phrase: t?.('game_far') ?? 'Lejos...', color: p?.bad.tw ?? 'text-red-400' };
  return { emoji: '😬', phrase: t?.('game_veryFar') ?? 'Muy lejos', color: p?.bad.tw ?? 'text-red-500' };
}

export default function GameScreen({ difficulty, gameMode, onRoundComplete, onGameOver, seed, isTraining = false }: GameScreenProps) {
  const { t } = useI18n();
  const layoutMode = useGameLayoutMode();
  const { palette } = useA11y();
  const isCompact = layoutMode === 'compact';
  const isWide = layoutMode === 'wide';
  const hasSidebar = layoutMode !== 'compact'; // medium + wide
  const isPortraitMobile = useIsPortraitMobile();
  const totalRounds = isTraining ? TRAINING_ROUNDS : TOTAL_ROUNDS;
  const [cities] = useState(() => getRandomCities(difficulty, totalRounds, gameMode, seed));
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(AUTO_ADVANCE_SECONDS);
  const [scorePop, setScorePop] = useState(false);
  const [floatPoints, setFloatPoints] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const currentCity = cities[currentRound];

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

  // Reset timeLeft and roundStart when a new round begins
  useEffect(() => {
    if (!currentCity) return;
    roundStartRef.current = Date.now();
    setTimeLeft(MAX_TIME);
    announce(t('sr_announceRound', { round: currentRound + 1, city: currentCity.name, time: MAX_TIME }), 'assertive');
  }, [currentRound, currentCity, t]);

  // Single timer effect — pauses when waiting, portrait, or no city
  useEffect(() => {
    if (isWaiting || !currentCity) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          playGameOver();
          hapticError();
          onGameOver(rounds, 'timeout');
          return 0;
        }
        if (prev <= 6) { playTick(); hapticTick(); }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound, isWaiting, currentCity, isPortraitMobile]);

  useEffect(() => {
    if (!isWaiting || !lastResult) return;
    const timeout = setTimeout(() => setShowPopup(true), 2000);
    return () => clearTimeout(timeout);
  }, [isWaiting, lastResult, isPortraitMobile]);

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
      setCurrentRound(r => r + 1);
      setIsWaiting(false);
      setShowPopup(false);
      setLastResult(null);
    }
  }, [currentRound, rounds, lastResult, onGameOver]);

  // Keyboard shortcuts (desktop)
  useKeyboardShortcuts({
    'Space': () => { if (isWaiting && showPopup) advanceRound(); },
    'Enter': () => { if (isWaiting && showPopup) advanceRound(); },
  }, true);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (isWaiting || !currentCity) return;
    clearInterval(timerRef.current);
    playClick();
    hapticTap();

    const timeUsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);

    // Compute streak before scoring so bonus applies immediately
    const newStreak = distance < 1000 ? streak + 1 : 0;
    setStreak(newStreak);

    // Streak bonus: +15% per level starting at streak ≥ 3 (×1.15, ×1.30, ×1.45…)
    const streakBonus = newStreak >= 3 ? 1 + (newStreak - 2) * 0.15 : 1;
    const totalPoints = Math.round(basePoints * mult.value * streakBonus);

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
      if (totalPoints >= 1000) { playGood(); hapticCelebration(); fireStarBurst(); }
      else if (totalPoints >= 500) { playGood(); hapticSuccess(); }
      else { playBad(); hapticError(); }
    }, 200);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setFloatPoints(totalPoints);
    setTimeout(() => { setScorePop(false); setFloatPoints(null); }, 600);
    setLastResult(result);
    setRounds(r => [...r, result]);
    setIsWaiting(true);
    onRoundComplete(result);
    // Screen reader announcement
    const fb = getRoundFeedback(distance, palette, t);
    announce(t('sr_announceResult', { feedback: fb.phrase, city: currentCity.name, country: currentCity.country, distance: Math.round(distance), points: totalPoints, round: currentRound + 1, total: totalRounds }));
  }, [isWaiting, currentCity, onRoundComplete, t]);

  if (!currentCity) return null;

  const mult = lastResult ? getMultiplier(lastResult.timeUsed) : null;
  const feedback = lastResult ? getRoundFeedback(lastResult.distance, palette, t) : null;
  const showStreak = streak >= 2;

  // Right panel visible only after click result (as overlay)
  const showRightPanel = isWide && showPopup && lastResult && feedback;

  // Layout classes based on mode — always 2 columns in wide (panel is overlay)
  const layoutClass = isPortraitMobile
    ? 'flex flex-col' // Portrait: stacked vertically (top bar + map)
    : isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(22rem,28vw,28rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(22rem,30vw,28rem)_minmax(0,1fr)]'; // medium: sidebar + map

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass}`}
      role="main"
      aria-label="Pantalla de juego"
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
                {score.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Row 2: Country + Timer */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">🌍 {currentCity.country}</p>
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isWaiting} compact />
          </div>
        </div>
      )}

      {/* ──── Left sidebar (medium + wide) — idéntico en dark/light y training/normal ──── */}
      {hasSidebar && (
        <div
          className="flex min-h-0 flex-col gap-0 border-r border-border/60 bg-card overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          {/* ── Logo ── */}
          <div className="w-full text-center pb-2 mb-2 border-b border-border/50 shrink-0">
            <span className="text-lg font-black tracking-wide" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
              📍 GEOSPEED
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
          <div className="w-full shrink-0 mb-2 rounded-xl px-3 py-3 border border-primary/25 bg-primary/10 text-center">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1.5" id="city-label">
              {t('game_find')}
            </p>
            <p
              className="text-base font-black leading-tight text-center"
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
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('game_score')}</p>
            <p
              className={`text-2xl font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
              aria-live="polite"
            >
              {score.toLocaleString()}
            </p>
            {floatPoints !== null && (
              <span className="absolute left-1/2 -top-1 -translate-x-1/2 text-xs font-bold text-green-400 animate-float-up pointer-events-none">
                +{floatPoints.toLocaleString()}
              </span>
            )}
          </div>

          {/* ── Progreso de rondas ── */}
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('game_round')}</p>
            <p className="text-lg font-mono font-bold leading-none">
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

          {/* ── Racha y multiplicador ── */}
          {(showStreak || mult) && (
            <div className="w-full flex flex-col gap-1.5 shrink-0 mb-2">
              {showStreak && (
                <div className="text-center animate-score-pop">
                  <span className="inline-block rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-xs font-bold text-orange-400">
                    🔥×{streak}{streak >= 3 && <span className="ml-0.5 text-[10px] opacity-80">+{(streak - 2) * 15}%</span>}
                  </span>
                </div>
              )}
              {mult && (
                <div className="text-center">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${
                    mult.value >= 2 ? `${palette.good.twBgSoft} ${palette.good.twBorder} ${palette.good.tw}`
                    : mult.value >= 1 ? `${palette.medium.twBgSoft} ${palette.medium.twBorder} ${palette.medium.tw}`
                    : `${palette.bad.twBgSoft} ${palette.bad.twBorder} ${palette.bad.tw}`
                  }`}>
                    {mult.emoji} {mult.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Timer ── */}
          <div className="w-full mt-auto shrink-0">
            <p className="text-center text-[10px] italic text-foreground/40 mb-1">Velocidad y precisión</p>
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isWaiting} />
          </div>
        </div>
      )}

      {/* ──── Map area (all modes) — h-full gives WorldMapCanvas explicit height in grid ──── */}
      <div className="relative h-full min-w-0 overflow-hidden">
        {/* Floating HUD overlay (compact mode only) */}
        {isCompact && (
          <div className="pointer-events-none absolute z-20 hud-safe-top hud-safe-left hud-safe-right">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              {/* Top row: city info (centered) + score (right) */}
              <div className="flex items-center gap-3">
                {/* City info — centered within its space */}
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                    {isTraining ? t('game_trainingPrefix') : t('game_find')}
                  </p>
                  <p className="break-words font-black leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  {isTraining && !isWaiting && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      🌍 <span className="font-semibold text-foreground/80">{currentCity.country}</span>
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px self-stretch bg-border/60 shrink-0" />

                {/* Score — right side */}
                <div className="relative shrink-0 text-center min-w-[3.5rem]">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{t('game_score')}</p>
                  <p className={`text-base font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
                    {score.toLocaleString()}
                  </p>
                  {floatPoints !== null && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-400 animate-float-up whitespace-nowrap pointer-events-none">
                      +{floatPoints.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges row: round + streak + multiplier — centered */}
              <div className="mt-1.5 flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                <span className="rounded-full bg-muted/80 px-1.5 py-0.5">R{currentRound + 1}/{totalRounds}</span>
                {showStreak && (
                  <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 font-bold text-orange-400">
                    🔥×{streak}{streak >= 3 && ` +${(streak - 2) * 15}%`}
                  </span>
                )}
                {mult && (
                  <span className={`rounded-full px-1.5 py-0.5 font-bold ${
                    mult.value >= 2 ? `${palette.good.twBgSoft} ${palette.good.tw}` : mult.value >= 1 ? `${palette.medium.twBgSoft} ${palette.medium.tw}` : `${palette.bad.twBgSoft} ${palette.bad.tw}`
                  }`}>
                    {mult.emoji} {mult.label}
                  </span>
                )}
              </div>

              {/* Timer */}
              <div className="mt-1.5">
                <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isWaiting} compact />
              </div>
            </div>
          </div>
        )}

        <ModeLabel gameMode={gameMode} compact={isCompact} />
        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={isWaiting}
          userClick={lastResult ? { lat: lastResult.clickLat, lon: lastResult.clickLon } : null}
          correctLocation={lastResult ? { lat: lastResult.city.lat, lon: lastResult.city.lon } : null}
          distanceKm={lastResult?.distance ?? null}
          gameMode={gameMode}
          hintZone={isTraining && !isWaiting && showHint ? { lat: currentCity.lat, lon: currentCity.lon } : null}
          highlightContinent={gameMode === 'world' && !isWaiting ? getContinentFromCoords(currentCity.lat, currentCity.lon) : null}
        />

        {/* Round result — overlay on wide */}
        {showRightPanel && (
          <div
            className="absolute inset-y-0 right-0 z-10 w-[clamp(24rem,38vw,34rem)] flex items-center animate-slide-in-right"
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xl backdrop-blur-md max-h-[90%] overflow-y-auto">
              {/* Feedback */}
              <div className="text-center">
                <span
                  className="text-6xl block animate-record-pop"
                  style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
                >{feedback.emoji}</span>
                <p className={`mt-1.5 text-xl font-black ${feedback.color}`}>{feedback.phrase}</p>
                {showStreak && (
                  <p className={`mt-0.5 animate-score-pop text-sm font-bold ${palette.warn.tw}`}>
                    🔥 Racha ×{streak}{streak >= 3 && ` (+${(streak - 2) * 15}%)`}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="text-center border-t border-border/50 pt-2.5">
                <h3 className="text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>{lastResult.city.name}</h3>
                <p className="text-sm font-semibold text-foreground/80">{lastResult.city.country}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <p className="text-[11px] uppercase text-muted-foreground">{t('game_distance')}</p>
                  <p className="font-mono text-base font-bold">{formatDistance(lastResult.distance)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <p className="text-[11px] uppercase text-muted-foreground">{t('game_time')}</p>
                  <p className="font-mono text-base font-bold">{lastResult.timeUsed}s</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                  <p className="text-[11px] uppercase text-muted-foreground">{t('game_base')}</p>
                  <p className="font-mono text-base font-bold">{lastResult.basePoints}</p>
                </div>
                {/* Total — highlighted */}
                <div className="rounded-lg p-2.5 text-center border" style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.35)' }}>
                  <p className="text-[11px] uppercase font-bold" style={{ color: 'hsl(var(--primary))' }}>{t('game_total')}</p>
                  <p className="font-mono text-lg font-black" style={{ color: 'hsl(var(--primary))', textShadow: '0 0 10px hsl(var(--primary) / 0.4)' }}>
                    {lastResult.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={advanceRound}
                className="w-full rounded-xl py-3 text-sm font-black transition-all active:scale-[0.97] btn-glow focus-visible:ring-2 focus-visible:ring-ring"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                aria-label={t('game_next') + ', ' + t('game_nextAutoAdvance', { seconds: autoAdvanceTimer })}
              >
                {t('game_nextAutoAdvance', { seconds: autoAdvanceTimer })}
              </button>
              {!isPortraitMobile && (
                <p className="text-[8px] text-muted-foreground text-center mt-1 opacity-60">{t('game_keyboardHint')}</p>
              )}
            </div>
          </div>
        )}

        {!isWide && showPopup && lastResult && feedback && (
          <div
            className={`absolute z-10 flex animate-slide-in-right ${
              isPortraitMobile
                ? 'inset-x-0 bottom-0 justify-center pb-2 px-2'
                : `inset-y-0 items-center ${isCompact ? 'right-0 w-[clamp(17rem,70vw,26rem)]' : 'right-0 w-[clamp(22rem,45vw,30rem)]'}`
            }`}
            role="dialog"
            aria-label={t('game_resultLabel')}
          >
            <div className={`flex flex-col justify-center gap-2 overflow-y-auto rounded-xl border border-border/80 bg-card/65 p-3 shadow-2xl backdrop-blur-md ${
              isPortraitMobile ? 'w-full max-h-[50vh]' : 'max-h-[90%]'
            }`}>
              <div className="text-center">
                <span className="text-3xl block animate-record-pop">{feedback.emoji}</span>
                <p className={`text-sm font-black ${feedback.color}`}>{feedback.phrase}</p>
              </div>

              <div className="text-center border-t border-border/40 pt-1.5">
                <h3 className="text-base font-black" style={{ color: 'hsl(var(--primary))' }}>{lastResult.city.name}</h3>
                <p className="text-xs text-foreground/80">{lastResult.city.country}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">{t('game_distance')}</p>
                  <p className="font-mono font-bold text-xs">{formatDistance(lastResult.distance)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">{t('game_time')}</p>
                  <p className="font-mono font-bold text-xs">{lastResult.timeUsed}s</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">{t('game_base')}</p>
                  <p className="font-mono font-bold text-xs">{lastResult.basePoints}</p>
                </div>
                {/* Total — highlighted */}
                <div className="rounded-lg p-2 text-center border" style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.35)' }}>
                  <p className="text-[9px] uppercase font-bold" style={{ color: 'hsl(var(--primary))' }}>{t('game_total')}</p>
                  <p className="font-mono font-black text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {lastResult.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={advanceRound}
                className="w-full py-2 rounded-lg font-black text-xs transition-all active:scale-[0.97] btn-glow"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {t('game_nextAutoAdvance', { seconds: autoAdvanceTimer })}
              </button>
              {!isPortraitMobile && (
                <p className="text-[8px] text-muted-foreground text-center mt-1 opacity-60">{t('game_keyboardHint')}</p>
              )}
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