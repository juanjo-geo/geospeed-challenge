import { useState, useEffect, useCallback, useRef } from 'react';
import { City, getRandomCities, getProgressiveCities, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import CountUp from '@/components/ui/CountUp';
import { haversineDistance, calculateBasePoints, getMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playPerfect, playMedium, playTick, playHeartbeat, playGameOver, playMultiplierX2, playRoundTransition, playTimeExpired, playStressBeat, playCountdown, playGo } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticTick, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst, fireRedBurst, fireDistanceReveal } from '@/lib/confetti';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import WorldMapCanvas from './WorldMapCanvas';
import CountdownIntro from './CountdownIntro';
import Mascot, { type MascotState } from './Mascot';
import { useA11y } from '@/contexts/AccessibilityContext';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';

const GLOBAL_TIME = 60;
const POOL_SIZE = 40;

function getContinentFromCoords(lat: number, lon: number): string | null {
  if (lat > 34 && lon >= -25 && lon <= 50) return 'Europe';
  if (lat >= -38 && lat <= 40 && lon >= -25 && lon <= 60 && !(lat > 34 && lon < 50)) return 'Africa';
  if (lon >= -170 && lon <= -30) return 'Americas';
  if (lon > 25 && lon <= 150 && lat > -12) return 'Asia';
  if (lat < -10 && lon > 100) return 'Oceania';
  return null;
}

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
  const { t } = useI18n();
  const layoutMode = useGameLayoutMode();
  const { palette } = useA11y();
  const isCompact = layoutMode === 'compact';
  const hasSidebar = layoutMode !== 'compact';
  const isPortraitMobile = useIsPortraitMobile();
  const [cities] = useState(() => getRandomCities(difficulty, POOL_SIZE, gameMode));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [score, setScore] = useState(0);
  const [globalTime, setGlobalTime] = useState(GLOBAL_TIME);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastClick, setLastClick] = useState<{ lat: number; lon: number } | null>(null);
  const [lastCorrect, setLastCorrect] = useState<{ lat: number; lon: number } | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [scorePop, setScorePop] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const roundStartRef = useRef(Date.now());
  const roundsRef = useRef<TimeAttackResult['rounds']>([]);
  const gameOverRef = useRef(false);
  const lastClickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const [taStarted, setTaStarted] = useState(false); // arranca tras la cuenta regresiva
  const [failShake, setFailShake] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const currentCity = cities[currentIdx % cities.length];

  const globalTimerRef = useRef<ReturnType<typeof setInterval>>();
  // Keep a stable ref to onGameOver so the timer effect doesn't restart when the prop changes
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  // Cuenta regresiva 3-2-1-GO antes de arrancar (igual que el Clásico)
  useEffect(() => {
    if (taStarted) return;
    if (isPortraitMobile) return; // no arrancar la cuenta mientras se pide girar el teléfono
    if (countdown <= 0) {
      const id = setTimeout(() => setTaStarted(true), 700);
      return () => clearTimeout(id);
    }
    if (countdown === 1) playGo();
    else playCountdown();
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [taStarted, countdown, isPortraitMobile]);

  // Al arrancar de verdad, reinicia el cronómetro de la 1ª ronda (no contar la cuenta regresiva)
  useEffect(() => { if (taStarted) roundStartRef.current = Date.now(); }, [taStarted]);

  // Global countdown timer — pauses when portrait on mobile / antes de arrancar
  useEffect(() => {
    if (isPortraitMobile || !taStarted) {
      clearInterval(globalTimerRef.current);
      return;
    }
    globalTimerRef.current = setInterval(() => {
      setGlobalTime(prev => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current);
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            playTimeExpired();
            setTimeout(() => playGameOver(), 300);
            hapticError();
            onGameOverRef.current({
              cities: roundsRef.current.length,
              totalScore: roundsRef.current.reduce((s, r) => s + r.totalPoints, 0),
              rounds: roundsRef.current,
            });
          }
          return 0;
        }
        if (prev <= 10) {
          playStressBeat(prev); // tensión creciente en los últimos 10s
          hapticTick();
          if (prev <= 3) playHeartbeat(); // latido de clímax en el final
        } else if (prev <= 12) {
          playTick(prev); hapticTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(globalTimerRef.current);
  }, [isPortraitMobile, taStarted]);

  useEffect(() => {
    roundStartRef.current = Date.now();
    setMascotState('idle');
  }, [currentIdx]);

  // Throttled cursor coordinate update
  const cursorThrottleRef = useRef(0);
  const handleCursorMove = useCallback((lat: number, lon: number) => {
    const now = Date.now();
    if (now - cursorThrottleRef.current < 100) return;
    cursorThrottleRef.current = now;
    setCursorCoords({ lat, lon });
  }, []);

  const handleMapClick = useCallback((lat: number, lon: number, viewportX?: number, viewportY?: number) => {
    if (isAnimating || !currentCity || gameOverRef.current) return;
    lastClickViewportRef.current = viewportX != null && viewportY != null ? { x: viewportX, y: viewportY } : undefined;
    playClick();
    hapticTap();
    const timeUsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);
    const totalPoints = Math.round(basePoints * mult.value);
    setMascotState(distance >= 2000 ? 'sad' : distance < 300 ? 'celebrate' : 'wink');

    roundsRef.current.push({ city: currentCity, distance, totalPoints, timeUsed });
    setTimeout(() => {
      // Tier S: Perfect (<50km) — rainbow confetti
      if (distance < 50) { playPerfect(); hapticCelebration(); fireStarBurst(lastClickViewportRef.current); }
      // Tier A: Excellent (<300km) — gold confetti
      else if (distance < 300) { playGood(); hapticCelebration(); fireGoldBurst(lastClickViewportRef.current); }
      // Tier B: Good (<1000km)
      else if (distance < 1000) { playGood(); hapticSuccess(); }
      // Tier C: Medium (<3000km)
      else if (distance < 3000) { playMedium(); hapticTap(); }
      // Tier D: Far — red burst
      else { playBad(); hapticError(); fireRedBurst(lastClickViewportRef.current); setFailShake(true); setTimeout(() => setFailShake(false), 450); }
      // Tier F: Epic fail (>5000km) — cinematic distance reveal
      if (distance >= 5000) { setTimeout(() => fireDistanceReveal(distance), 400); }
      // Speed bonus sound
      if (mult.value >= 1.8) { setTimeout(() => playMultiplierX2(), 300); }
    }, 150);
    setScore(s => s + totalPoints);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 500);
    setLastClick({ lat, lon });
    setLastCorrect({ lat: currentCity.lat, lon: currentCity.lon });
    setLastDistance(distance);
    setLastPoints(totalPoints);
    setFlash(distance < 1000 ? 'good' : 'bad');
    setIsAnimating(true);
    announce(t('sr_timeAttackResult', { city: currentCity.name, distance: Math.round(distance), points: totalPoints, time: globalTime }));

    setTimeout(() => {
      setIsAnimating(false);
      setLastClick(null);
      setLastCorrect(null);
      setLastDistance(null);
      setLastPoints(null);
      setFlash(null);
      setCurrentIdx(i => i + 1);
      playRoundTransition();
    }, 1500);
  }, [isAnimating, currentCity]);

  if (!currentCity) return null;

  if (!taStarted) {
    return isPortraitMobile ? null : <CountdownIntro count={countdown} label={`⚡ ${t('ta_timeAttack')}`} />;
  }

  const timePercent = (globalTime / GLOBAL_TIME) * 100;
  const isLow = globalTime <= 10;
  // Contador: color por presión — 30s amarillo, 20s naranja, 10s rojo
  const timeColor = globalTime <= 10 ? '#ef4444' : globalTime <= 20 ? '#f97316' : globalTime <= 30 ? '#facc15' : 'hsl(var(--foreground))';
  const isWide = layoutMode === 'wide';

  // Same grid layout as GameScreen — guarantees canvas gets defined height
  const layoutClass = isPortraitMobile
    ? 'flex flex-col'
    : isCompact
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(13rem,22vw,21rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(13rem,24vw,21rem)_minmax(0,1fr)]';

  return (
    <div className={`h-[100dvh] min-h-0 overflow-hidden bg-background ${layoutClass} ${globalTime <= 5 && !isAnimating ? 'vignette-urgent' : ''} ${(failShake || (globalTime <= 3 && !isAnimating)) ? 'animate-screen-shake' : ''}`} role="main" aria-label="Modo contrareloj" data-game-container>
      {/* Portrait top bar — stacked vertical layout */}
      {isPortraitMobile && (
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-col gap-1 shrink-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400">{t('ta_timeAttack')}</span>
              <span className="text-sm font-black truncate">📍 {currentCity.name}</span>
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}>
              <CountUp value={score} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">🌍 {currentCity.country}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{roundsRef.current.length} {t('ta_cities')}</span>
              <span className="font-mono font-bold tabular-nums inline-block" style={{ fontSize: '1.05rem', lineHeight: 1, color: timeColor }}>
                ⏱ {globalTime}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──── Left sidebar (medium + wide) — estandarizado con GameScreen ──── */}
      {hasSidebar && (
        <div
          className="flex min-h-0 flex-col gap-0 border-r border-border/60 bg-card overflow-y-auto overflow-x-hidden scrollbar-hidden"
          style={{ containerType: 'inline-size', paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          {/* ── Logo ── */}
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

          {/* ── Mode badge ── */}
          <div className="w-full flex justify-center mb-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              {t('ta_timeAttack')}
            </span>
          </div>

          {/* ── Ciudad a encontrar ── */}
          <div className="w-full shrink-0 mb-2 rounded-xl px-[6.7cqi] py-[5.4cqi] border border-primary/25 bg-primary/10 text-center">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1.5">
              {t('game_find')}
            </p>
            <p
              className="text-[15.5cqi] font-black leading-tight text-center"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none' }}
            >
              {currentCity.name}
            </p>
          </div>

          {/* ── Puntuación ── */}
          <div className="w-full text-center shrink-0 relative mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('game_score')}</p>
            <p className={`text-[20cqi] font-mono font-black leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
              <CountUp value={score} />
            </p>
          </div>

          {/* ── Ciudades completadas ── */}
          <div className="w-full text-center shrink-0 mb-2 pb-2 border-b border-border/40">
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">{t('ta_cities')}</p>
            <p className="text-[15cqi] font-mono font-bold leading-none">{roundsRef.current.length}</p>
          </div>

          {/* ── Feedback + mascota (una fila) ── */}
          <div className="w-full flex items-center justify-center gap-2.5 shrink-0 mb-2 min-h-[46px]">
            {lastPoints !== null && (
              <div className={`text-center py-1.5 px-2.5 rounded-lg font-bold text-sm ${
                lastPoints >= 500 ? `${palette.good.twBgSoft} ${palette.good.tw}` : `${palette.bad.twBgSoft} ${palette.bad.tw}`
              }`}>
                {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString()}
              </div>
            )}
            <Mascot
              state={mascotState}
              className={`w-[48cqi] max-w-[130px] shrink-0 select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(240,160,48,0.35)] ${mascotState === 'idle' ? 'animate-mascot-float' : ''}`}
            />
          </div>

          {/* ── Timer ── (sticky al fondo: siempre visible aunque el sidebar tenga poco alto) */}
          <div className="w-full shrink-0 sticky bottom-0 z-10 bg-card pt-2 mt-auto">
            <div className="text-center font-mono font-black mb-1.5 tabular-nums" style={{ fontSize: '2.25rem', lineHeight: 1.1, color: timeColor }} aria-live="polite" aria-label={t('ta_secondsLeft', { seconds: globalTime })}>
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

      {/* ──── Map area ──── */}
      <div className="relative h-full min-w-0 overflow-hidden">
        {/* Floating HUD (compact only) */}
        {isCompact && (
          <div className="pointer-events-none absolute z-20 hud-safe-top hud-safe-left hud-safe-right">
            <div className="rounded-2xl border border-border bg-card/82 px-3 py-2.5 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.32)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{t('ta_timeAttack')}</p>
                  <p className="break-words font-black leading-tight text-sm" style={{ color: 'hsl(var(--primary))' }}>
                    {currentCity.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-mono text-foreground/90">
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.5">{roundsRef.current.length} {t('ta_cities')}</span>
                    {lastPoints !== null && (
                      <span className={`rounded-full px-1.5 py-0.5 font-bold ${
                        lastPoints >= 500 ? `${palette.good.twBgSoft} ${palette.good.tw}` : `${palette.bad.twBgSoft} ${palette.bad.tw}`
                      }`}>
                        {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-px self-stretch bg-border/60 shrink-0" />

                <div className="relative shrink-0 text-center min-w-[3.5rem]">
                  <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{t('game_score')}</p>
                  <p className={`text-lg font-mono font-bold leading-none ${scorePop ? 'animate-score-pop' : ''}`} style={{ color: 'hsl(var(--primary))' }} aria-live="polite">
                    <CountUp value={score} />
                  </p>
                </div>
              </div>

              <div className="mt-1.5">
                <div className="mb-1 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground">⏱ TIEMPO</span>
                  <span className="font-bold tabular-nums inline-block" style={{ fontSize: '1.05rem', lineHeight: 1, color: timeColor }} aria-live="polite">
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

        {/* ── Command Center Overlays ── */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)' }} />
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.45)' }} />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.45)' }} />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.45)' }} />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 pointer-events-none z-[6]" style={{ borderColor: 'hsl(var(--primary) / 0.45)' }} />

        {/* Floating city HUD (medium/wide) */}
        {!isCompact && !isPortraitMobile && !isAnimating && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md" style={{ background: 'hsl(var(--background) / 0.8)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('game_find')}</span>
              <span className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>{currentCity.name}</span>
              <span className="text-[10px] text-muted-foreground/60">{roundsRef.current.length} ciudades</span>
            </div>
          </div>
        )}

        {/* Live coordinates */}
        {cursorCoords && !isAnimating && !isCompact && !isPortraitMobile && (
          <div className="absolute bottom-4 left-4 z-[6] pointer-events-none">
            <span className="text-base font-mono font-bold tabular-nums tracking-wide" style={{ color: 'hsl(var(--primary) / 0.7)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              {Math.abs(cursorCoords.lat).toFixed(1)}°{cursorCoords.lat >= 0 ? 'N' : 'S'}{' '}
              {Math.abs(cursorCoords.lon).toFixed(1)}°{cursorCoords.lon >= 0 ? 'E' : 'W'}
            </span>
          </div>
        )}

        {/* Distance scale */}
        {!isCompact && !isPortraitMobile && (
          <div className="absolute bottom-3 right-3 z-[6] pointer-events-none flex items-center gap-1.5">
            <div className="h-[2px] w-10" style={{ background: 'hsl(var(--primary) / 0.5)' }} />
            <span className="text-[9px] font-mono" style={{ color: 'hsl(var(--primary) / 0.5)' }}>500km</span>
          </div>
        )}

        {/* Mode label persistent */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[6] pointer-events-none">
          <span className="px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em]" style={{ background: 'hsl(var(--background) / 0.6)', color: 'hsl(var(--primary) / 0.7)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
            {MODE_CONFIG.find(m => m.key === gameMode)?.emoji} {MODE_CONFIG.find(m => m.key === gameMode)?.label}
          </span>
        </div>

        <WorldMapCanvas
          onMapClick={handleMapClick}
          onCursorMove={handleCursorMove}
          clickDisabled={isAnimating}
          userClick={lastClick}
          correctLocation={lastCorrect}
          distanceKm={lastDistance}
          gameMode={gameMode}
          highlightContinent={gameMode === 'world' && !isAnimating ? getContinentFromCoords(currentCity.lat, currentCity.lon) : null}
        />

        {flash && (
          <div className={`absolute left-1/2 z-10 -translate-x-1/2 px-4 py-2 text-sm font-bold shadow-lg animate-fade-in rounded-xl ${isCompact ? 'top-[6rem]' : 'top-3'} ${
            flash === 'good' ? `${palette.good.twBg}/90 text-white` : `${palette.bad.twBg}/90 text-white`
          }`} role="status">
            <div className="text-center leading-tight">
              <div className="text-sm sm:text-base font-black">{flash === 'good' ? '🎯' : '😬'} {currentCity.name}</div>
              <div className="text-[10px] sm:text-xs opacity-80">{currentCity.country}</div>
              <div className="text-xs sm:text-sm font-bold mt-0.5">+{lastPoints?.toLocaleString()}{lastDistance !== null ? ` · ${formatDistance(lastDistance)}` : ''}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}