import { useState, useEffect, useCallback, useRef } from 'react';
import { City, getRandomCities, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { haversineDistance, calculateBasePoints, getMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playTick, playGameOver } from '@/lib/sounds';
import { useGameLayoutMode, useIsPortraitMobile, type GameLayoutMode } from '@/hooks/use-mobile';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const TRAINING_ROUNDS = 6;
const AUTO_ADVANCE_SECONDS = 5;

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

function getRoundFeedback(distance: number): { emoji: string; phrase: string; color: string } {
  if (distance < 50) return { emoji: '🎯', phrase: '¡PERFECTO!', color: 'text-green-400' };
  if (distance < 200) return { emoji: '🔥', phrase: '¡Increíble!', color: 'text-green-400' };
  if (distance < 500) return { emoji: '👏', phrase: '¡Muy bien!', color: 'text-emerald-400' };
  if (distance < 1000) return { emoji: '👍', phrase: 'Bien hecho', color: 'text-yellow-400' };
  if (distance < 2000) return { emoji: '👀', phrase: 'Casi...', color: 'text-orange-400' };
  if (distance < 5000) return { emoji: '🌍', phrase: 'Lejos...', color: 'text-red-400' };
  return { emoji: '😬', phrase: 'Muy lejos', color: 'text-red-500' };
}

export default function GameScreen({ difficulty, gameMode, onRoundComplete, onGameOver, seed, isTraining = false }: GameScreenProps) {
  const layoutMode = useGameLayoutMode();
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
  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const currentCity = cities[currentRound];

  // Reset timeLeft and roundStart when a new round begins
  useEffect(() => {
    if (!currentCity) return;
    roundStartRef.current = Date.now();
    setTimeLeft(MAX_TIME);
  }, [currentRound, currentCity]);

  // Single timer effect — pauses when waiting, portrait, or no city
  useEffect(() => {
    if (isWaiting || !currentCity || isPortraitMobile) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          playGameOver();
          onGameOver(rounds, 'timeout');
          return 0;
        }
        if (prev <= 6) playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentRound, isWaiting, currentCity, isPortraitMobile]);

  useEffect(() => {
    if (!isWaiting || !lastResult || isPortraitMobile) return;
    const timeout = setTimeout(() => setShowPopup(true), 2000);
    return () => clearTimeout(timeout);
  }, [isWaiting, lastResult, isPortraitMobile]);

  useEffect(() => {
    if (!showPopup || isPortraitMobile) return;
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

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (isWaiting || !currentCity) return;
    clearInterval(timerRef.current);
    playClick();

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

    setTimeout(() => totalPoints >= 500 ? playGood() : playBad(), 200);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setFloatPoints(totalPoints);
    setTimeout(() => { setScorePop(false); setFloatPoints(null); }, 600);
    setLastResult(result);
    setRounds(r => [...r, result]);
    setIsWaiting(true);
    onRoundComplete(result);
  }, [isWaiting, currentCity, onRoundComplete]);

  if (!currentCity) return null;

  const mult = lastResult ? getMultiplier(lastResult.timeUsed) : null;
  const feedback = lastResult ? getRoundFeedback(lastResult.distance) : null;
  const showStreak = streak >= 2;

  // Right panel visible only after click result (as overlay)
  const showRightPanel = isWide && showPopup && lastResult && feedback;

  // Layout classes based on mode — always 2 columns in wide (panel is overlay)
  const layoutClass = isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(10rem,15vw,13rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(9rem,14vw,11rem)_minmax(0,1fr)]'; // medium: sidebar + map

  return (
    <div
      className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass}`}
      role="main"
      aria-label="Pantalla de juego"
    >
      {/* Portrait blocker — covers gameplay when phone is rotated to portrait */}
      {isPortraitMobile && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 game-bg">
          <div className="animate-bounce" style={{ animationDuration: '2s' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
            </svg>
          </div>
          <p className="text-lg font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
            📱 GIRA TU TELÉFONO
          </p>
          <p className="text-sm text-muted-foreground text-center px-8">
            Gira tu teléfono a horizontal para seguir jugando
          </p>
        </div>
      )}

      {/* ──── Left sidebar (medium + wide) ──── */}
      {hasSidebar && (
        <div className="flex min-h-0 flex-col px-3 py-3 gap-0 border-r border-border game-panel overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="text-center pb-2 mb-2 border-b border-border/50">
            <span className="text-xl font-black tracking-wide" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
              📍 GEOSPEED
            </span>
          </div>

          {/* City to find */}
          <div className="shrink-0 mb-2 rounded-lg px-2 py-2 bg-primary/8 border border-primary/20 text-center">
            {isTraining && (
              <span className="inline-block mb-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[8px] font-bold text-blue-400 uppercase tracking-widest">
                🎓 Entrenamiento
              </span>
            )}
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5" id="city-label">Encuentra</p>
            <p className="text-sm font-black leading-tight break-words" style={{ color: 'hsl(var(--primary))' }} aria-labelledby="city-label">
              {currentCity.name}
            </p>
            {isTraining && !isWaiting && (
              <p className="mt-1 text-[9px] text-muted-foreground">
                🌍 Pista: <span className="font-bold text-foreground/80">{currentCity.country}</span>
              </p>
            )}
          </div>

          {/* Score */}
          <div className="text-center shrink-0 relative mb-2 pb-2 border-b border-border/50">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-none">Puntos</p>
            <p
              className={`text-xl font-mono font-black ${scorePop ? 'animate-score-pop' : ''}`}
              style={{ color: 'hsl(var(--primary))', textShadow: '0 0 16px hsl(var(--primary) / 0.4)' }}
              aria-live="polite"
            >
              {score.toLocaleString()}
            </p>
            {floatPoints !== null && (
              <span className="absolute left-1/2 -top-1 -translate-x-1/2 text-[10px] font-bold text-green-400 animate-float-up pointer-events-none">
                +{floatPoints.toLocaleString()}
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="text-center shrink-0 mb-2 pb-2 border-b border-border/50">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-none">Ronda</p>
            <p className="text-sm font-mono font-bold">{currentRound + 1}<span className="text-muted-foreground text-xs">/{totalRounds}</span></p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1">
              {Array.from({ length: totalRounds }).map((_, i) => {
                const round = rounds[i];
                let dotClass = 'bg-muted';
                if (round) {
                  dotClass = round.distance < 500 ? 'bg-green-500' : round.distance < 2000 ? 'bg-yellow-400' : 'bg-red-500';
                } else if (i === currentRound) {
                  dotClass = 'bg-primary animate-pulse';
                }
                return <div key={i} className={`h-2 w-2 rounded-full transition-colors duration-300 ${dotClass}`} />;
              })}
            </div>
          </div>

          {/* Streak + Multiplier */}
          <div className="flex flex-col gap-1 shrink-0 mb-2">
            {showStreak && (
              <div className="text-center animate-score-pop">
                <span className="inline-block rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                  🔥×{streak}{streak >= 3 && <span className="ml-0.5 text-[9px] opacity-80">+{(streak - 2) * 15}%</span>}
                </span>
              </div>
            )}
            {mult && (
              <div className="text-center">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  mult.value >= 2
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : mult.value >= 1
                    ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}>
                  {mult.emoji} {mult.label}
                </span>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="mt-auto shrink-0">
            <p className="text-center text-[8px] italic text-muted-foreground mb-1">Velocidad y precisión</p>
            <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isWaiting} />
          </div>
        </div>
      )}

      {/* ──── Map area (all modes) ──── */}
      <div className="relative flex-1 min-h-0 min-w-0">
        {/* Floating HUD overlay (compact mode only) */}
        {isCompact && (
          <div className="pointer-events-none absolute inset-x-2 top-2 z-20">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                    {isTraining ? '🎓 Entrenamiento' : 'Encuentra'}
                  </p>
                  <p className="break-words font-bold leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  {isTraining && !isWaiting && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      🌍 <span className="font-semibold text-foreground/80">{currentCity.country}</span>
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.5">R{currentRound + 1}/{totalRounds}</span>
                    {showStreak && (
                      <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 font-bold text-orange-400">
                        🔥×{streak}{streak >= 3 && ` +${(streak - 2) * 15}%`}
                      </span>
                    )}
                    {mult && (
                      <span className={`rounded-full px-1.5 py-0.5 font-bold ${
                        mult.value >= 2 ? 'bg-green-500/20 text-green-400' : mult.value >= 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {mult.emoji} {mult.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Puntos</p>
                  <p className={`text-lg font-mono font-bold leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
                    {score.toLocaleString()}
                  </p>
                  {floatPoints !== null && (
                    <span className="absolute -top-2 right-0 text-[10px] font-bold text-green-400 animate-float-up whitespace-nowrap pointer-events-none">
                      +{floatPoints.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-2 mt-1">
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
          hintZone={isTraining && !isWaiting ? { lat: currentCity.lat, lon: currentCity.lon } : null}
        />

        {/* Round result — overlay on wide */}
        {showRightPanel && (
          <div
            className="absolute top-3 right-3 z-10 w-[clamp(14rem,22vw,18rem)] animate-slide-in-right"
            role="dialog"
            aria-label="Resultado de la ronda"
          >
            <div className="flex flex-col justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-2xl backdrop-blur-md">
              {/* Feedback */}
              <div className="text-center">
                <span
                  className="text-5xl block animate-record-pop"
                  style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
                >{feedback.emoji}</span>
                <p className={`mt-1 text-lg font-black ${feedback.color}`}>{feedback.phrase}</p>
                {showStreak && (
                  <p className="mt-0.5 animate-score-pop text-sm font-bold text-orange-400">
                    🔥 Racha ×{streak}{streak >= 3 && ` (+${(streak - 2) * 15}%)`}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="text-center border-t border-border/50 pt-2">
                <h3 className="text-lg font-black" style={{ color: 'hsl(var(--primary))' }}>{lastResult.city.name}</h3>
                <p className="text-sm font-semibold text-foreground/80">{lastResult.city.country}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">Distancia</p>
                  <p className="font-mono text-sm font-bold">{formatDistance(lastResult.distance)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">Tiempo</p>
                  <p className="font-mono text-sm font-bold">{lastResult.timeUsed}s</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">Base</p>
                  <p className="font-mono text-sm font-bold">{lastResult.basePoints}</p>
                </div>
                {/* Total — highlighted */}
                <div className="rounded-lg p-2 text-center border" style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.35)' }}>
                  <p className="text-[10px] uppercase font-bold" style={{ color: 'hsl(var(--primary))' }}>Total</p>
                  <p className="font-mono text-sm font-black" style={{ color: 'hsl(var(--primary))', textShadow: '0 0 10px hsl(var(--primary) / 0.4)' }}>
                    {lastResult.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={advanceRound}
                className="w-full rounded-xl py-2.5 text-sm font-black transition-all active:scale-[0.97] btn-glow focus-visible:ring-2 focus-visible:ring-ring"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                aria-label={`Siguiente ronda, avance automático en ${autoAdvanceTimer} segundos`}
              >
                SIGUIENTE ({autoAdvanceTimer}s) →
              </button>
            </div>
          </div>
        )}

        {!isWide && showPopup && lastResult && feedback && (
          <div
            className="absolute top-2 right-2 z-10 w-[clamp(11rem,40vw,16rem)] animate-slide-in-right"
            role="dialog"
            aria-label="Resultado de la ronda"
          >
            <div className="flex max-h-[min(85dvh,24rem)] flex-col justify-center gap-1.5 overflow-y-auto rounded-xl border border-border/80 bg-card/65 p-2.5 shadow-2xl backdrop-blur-md">
              <div className="text-center">
                <span className="text-2xl block animate-record-pop">{feedback.emoji}</span>
                <p className={`text-xs font-black ${feedback.color}`}>{feedback.phrase}</p>
              </div>

              <div className="text-center border-t border-border/40 pt-1">
                <h3 className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>{lastResult.city.name}</h3>
                <p className="text-xs text-foreground/80">{lastResult.city.country}</p>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="text-[8px] text-muted-foreground uppercase">Distancia</p>
                  <p className="font-mono font-bold text-[11px]">{formatDistance(lastResult.distance)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="text-[8px] text-muted-foreground uppercase">Tiempo</p>
                  <p className="font-mono font-bold text-[11px]">{lastResult.timeUsed}s</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="text-[8px] text-muted-foreground uppercase">Base</p>
                  <p className="font-mono font-bold text-[11px]">{lastResult.basePoints}</p>
                </div>
                {/* Total — highlighted */}
                <div className="rounded-lg p-1.5 text-center border" style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.35)' }}>
                  <p className="text-[8px] uppercase font-bold" style={{ color: 'hsl(var(--primary))' }}>Total</p>
                  <p className="font-mono font-black text-[11px]" style={{ color: 'hsl(var(--primary))' }}>
                    {lastResult.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={advanceRound}
                className="w-full py-1.5 rounded-lg font-black text-xs transition-all active:scale-[0.97] btn-glow"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                SIGUIENTE ({autoAdvanceTimer}s) →
              </button>
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