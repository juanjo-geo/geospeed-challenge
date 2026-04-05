import { useState, useEffect, useCallback, useRef } from 'react';
import { City, getRandomCities, type Difficulty, type GameMode } from '@/data/cities';
import { haversineDistance, calculateBasePoints, getMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playTick, playGameOver } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticTick } from '@/lib/haptics';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import WorldMapCanvas from './WorldMapCanvas';

const GLOBAL_TIME = 60;
const POOL_SIZE = 40;

export interface TimeAttackResult {
  cities: number;
  totalScore: number;
  rounds: {
    city: City;
    distance: number;
    totalPoints: number;
    timeUsed: number;
  }[];
}

interface TimeAttackScreenProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onGameOver: (result: TimeAttackResult) => void;
}

export default function TimeAttackScreen({ difficulty, gameMode, onGameOver }: TimeAttackScreenProps) {
  const layoutMode = useGameLayoutMode();
  const isCompact = layoutMode === 'compact';
  const hasSidebar = layoutMode !== 'compact';
  const isPortraitMobile = useIsPortraitMobile();
  const [cities] = useState(() => getRandomCities(difficulty, POOL_SIZE, gameMode));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [globalTime, setGlobalTime] = useState(GLOBAL_TIME);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastClick, setLastClick] = useState<{ lat: number; lon: number } | null>(null);
  const [lastCorrect, setLastCorrect] = useState<{ lat: number; lon: number } | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [scorePop, setScorePop] = useState(false);
  const roundStartRef = useRef(Date.now());
  const roundsRef = useRef<TimeAttackResult['rounds']>([]);
  const gameOverRef = useRef(false);

  const currentCity = cities[currentIdx % cities.length];

  const globalTimerRef = useRef<ReturnType<typeof setInterval>>();
  // Keep a stable ref to onGameOver so the timer effect doesn't restart when the prop changes
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  // Global countdown timer
  useEffect(() => {
    if (isPortraitMobile) {
      clearInterval(globalTimerRef.current);
      return;
    }

    globalTimerRef.current = setInterval(() => {
      setGlobalTime(prev => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current);
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            playGameOver();
            hapticError();
            onGameOverRef.current({
              cities: roundsRef.current.length,
              totalScore: roundsRef.current.reduce((s, r) => s + r.totalPoints, 0),
              rounds: roundsRef.current,
            });
          }
          return 0;
        }
        if (prev <= 6) { playTick(); hapticTick(); }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(globalTimerRef.current);
  }, [isPortraitMobile]);

  useEffect(() => {
    roundStartRef.current = Date.now();
  }, [currentIdx]);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (isAnimating || !currentCity || gameOverRef.current) return;
    playClick();
    hapticTap();
    const timeUsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);
    const totalPoints = Math.round(basePoints * mult.value);

    roundsRef.current.push({ city: currentCity, distance, totalPoints, timeUsed });
    setTimeout(() => {
      if (totalPoints >= 500) { playGood(); hapticSuccess(); }
      else { playBad(); hapticError(); }
    }, 150);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 500);
    setLastClick({ lat, lon });
    setLastCorrect({ lat: currentCity.lat, lon: currentCity.lon });
    setLastDistance(distance);
    setLastPoints(totalPoints);
    setFlash(totalPoints >= 500 ? 'good' : 'bad');
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setLastClick(null);
      setLastCorrect(null);
      setLastDistance(null);
      setLastPoints(null);
      setFlash(null);
      setCurrentIdx(i => i + 1);
    }, 1500);
  }, [isAnimating, currentCity]);

  if (!currentCity) return null;

  const timePercent = (globalTime / GLOBAL_TIME) * 100;
  const isLow = globalTime <= 10;
  const isWide = layoutMode === 'wide';

  // Same grid layout as GameScreen — guarantees canvas gets defined height
  const layoutClass = isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(13rem,18vw,16rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(13rem,25vw,16rem)_minmax(0,1fr)]';

  return (
    <div className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass}`} role="main" aria-label="Modo contrareloj">
      {/* Portrait blocker */}
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

      {/* ──── Left sidebar (medium + wide) — estandarizado con GameScreen ──── */}
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

          {/* ── Mode badge ── */}
          <div className="w-full flex justify-center mb-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              ⚡ Contrareloj
            </span>
          </div>

          {/* ── Ciudad a encontrar ── */}
          <div className="w-full shrink-0 mb-2 rounded-xl px-3 py-3 border border-primary/25 bg-primary/10 text-center">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1.5">
              Encuentra
            </p>
            <p
              className="text-base font-black leading-tight text-center"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none' }}
            >
              {currentCity.name}
            </p>
          </div>

          {/* ── Puntuación ── */}
          <div className="w-full text-center shrink-0 relative mb-2 pb-2 border-b border-border/40">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">Puntos</p>
            <p className={`text-2xl font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
              {score.toLocaleString()}
            </p>
          </div>

          {/* ── Ciudades completadas ── */}
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">Ciudades</p>
            <p className="text-lg font-mono font-bold leading-none">{roundsRef.current.length}</p>
          </div>

          {/* ── Last round feedback ── */}
          {lastPoints !== null && (
            <div className={`w-full text-center py-1.5 px-2 rounded-lg font-bold text-sm shrink-0 transition-all mb-2 ${
              lastPoints >= 500 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString()}
            </div>
          )}

          {/* ── Timer ── */}
          <div className="w-full mt-auto shrink-0">
            <p className="text-xs text-center text-foreground/50 font-semibold uppercase tracking-widest mb-1">Tiempo</p>
            <div className={`text-center text-3xl font-mono font-black mb-1.5 ${isLow ? 'text-red-400 animate-pulse' : 'text-foreground'}`} aria-live="polite" aria-label={`${globalTime} segundos restantes`}>
              {globalTime}s
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${timePercent}%` }}
                role="progressbar"
                aria-valuenow={globalTime}
                aria-valuemax={GLOBAL_TIME}
              />
            </div>
          </div>
        </div>
      )}

      {/* ──── Map area — identical structure to GameScreen ──── */}
      <div className="relative h-full min-w-0 overflow-hidden">
        {/* Floating HUD (compact only) */}
        {isCompact && (
          <div className="pointer-events-none absolute z-20 hud-safe-top hud-safe-left hud-safe-right">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">⚡ Contrareloj</p>
                  <p className="break-words font-black leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.5">{roundsRef.current.length} ciudades</span>
                    {lastPoints !== null && (
                      <span className={`rounded-full px-1.5 py-0.5 font-bold ${
                        lastPoints >= 500 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-px self-stretch bg-border/60 shrink-0" />

                <div className="relative shrink-0 text-center min-w-[3.5rem]">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Puntos</p>
                  <p className={`text-lg font-mono font-bold leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
                    {score.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-1.5">
                <div className="mb-1 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground">⏱ TIEMPO</span>
                  <span className={isLow ? 'font-bold text-destructive animate-pulse' : 'font-bold text-foreground'} aria-live="polite">
                    {globalTime}s
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${timePercent}%` }}
                    role="progressbar"
                    aria-valuenow={globalTime}
                    aria-valuemax={GLOBAL_TIME}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={isAnimating}
          userClick={lastClick}
          correctLocation={lastCorrect}
          distanceKm={lastDistance}
          gameMode={gameMode}
        />

        {flash && (
          <div className={`absolute left-1/2 z-10 -translate-x-1/2 px-4 py-2 text-sm font-bold shadow-lg animate-fade-in rounded-xl ${isCompact ? 'top-[6rem]' : 'top-3'} ${
            flash === 'good' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`} role="status">
            {flash === 'good' ? `🎯 +${lastPoints?.toLocaleString()}` : `😬 +${lastPoints?.toLocaleString()}`}
            {lastDistance !== null && (
              <span className="text-xs ml-2 opacity-80">({formatDistance(lastDistance)})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}