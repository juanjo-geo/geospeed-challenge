import { useState, useEffect, useCallback, useRef } from 'react';
import { City, getRandomCities, type Difficulty, type GameMode } from '@/data/cities';
import { haversineDistance, calculateBasePoints, getMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playTick, playGameOver } from '@/lib/sounds';
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
            onGameOver({
              cities: roundsRef.current.length,
              totalScore: roundsRef.current.reduce((s, r) => s + r.totalPoints, 0),
              rounds: roundsRef.current,
            });
          }
          return 0;
        }
        if (prev <= 6) playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(globalTimerRef.current);
  }, [onGameOver, isPortraitMobile]);

  useEffect(() => {
    roundStartRef.current = Date.now();
  }, [currentIdx]);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    if (isAnimating || !currentCity || gameOverRef.current) return;
    playClick();
    const timeUsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);
    const totalPoints = Math.round(basePoints * mult.value);

    roundsRef.current.push({ city: currentCity, distance, totalPoints, timeUsed });
    setTimeout(() => totalPoints >= 500 ? playGood() : playBad(), 150);
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

  return (
    <div className={`h-[100dvh] flex overflow-hidden bg-background ${hasSidebar ? 'flex-row' : 'flex-col'}`} role="main" aria-label="Modo contrarreloj">
      {/* Portrait blocker */}
      {isPortraitMobile && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, hsl(150 40% 4%) 0%, hsl(150 30% 7%) 100%)' }}>
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
        <div className="w-[clamp(9rem,14vw,13rem)] shrink-0 flex flex-col p-3 gap-3 border-r border-border bg-card/50 overflow-y-auto">
          <div className="text-center mb-1">
            <span className="text-xl font-bold tracking-widest" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
              📍 GEOSPEED
            </span>
            <p className="text-xs text-red-400 font-bold mt-1 uppercase tracking-wider">⚡ Contrarreloj</p>
          </div>

          <div className="text-center shrink-0">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Encuentra</p>
            <p className="text-sm font-bold leading-tight" style={{ color: 'hsl(var(--primary))' }}>{currentCity.name}</p>
          </div>

          <div className="text-center shrink-0 relative">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Puntos</p>
            <p className={`text-lg font-mono font-bold ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
              {score.toLocaleString()}
            </p>
          </div>

          <div className="text-center shrink-0">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Ciudades</p>
            <p className="text-lg font-mono font-bold">{roundsRef.current.length}</p>
          </div>

          {lastPoints !== null && (
            <div className={`text-center py-1 px-2 rounded-lg font-bold text-xs shrink-0 transition-all ${
              lastPoints >= 500 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString()}
            </div>
          )}

          <div className="mt-auto shrink-0">
            <p className="text-[9px] text-center text-muted-foreground mb-1 uppercase tracking-wider">Tiempo</p>
            <div className={`text-center text-2xl font-mono font-black mb-1 ${isLow ? 'text-red-400 animate-pulse' : 'text-foreground'}`} aria-live="polite" aria-label={`${globalTime} segundos restantes`}>
              {globalTime}s
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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

      {/* ──── Map area ──── */}
      <div className="flex-1 relative min-h-0 min-w-0">
        {/* Floating HUD (compact only) */}
        {isCompact && (
          <div className="pointer-events-none absolute inset-x-2 top-2 z-20">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
                <div className="min-w-0 text-left">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Encuentra</p>
                  <p className="break-words font-bold leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.5">⚡ Contrarreloj</span>
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

                <div className="relative shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Puntos</p>
                  <p className={`text-lg font-mono font-bold leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
                    {score.toLocaleString()}
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">⏱ TIEMPO</span>
                    <span className={isLow ? 'font-bold text-destructive animate-pulse' : 'font-bold text-foreground'} aria-live="polite" aria-label={`${globalTime} segundos restantes`}>
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