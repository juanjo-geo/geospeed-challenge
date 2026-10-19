import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getRandomCities, getMapBounds, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import CountUp from '@/components/ui/CountUp';
import { haversineDistance, calculateBasePoints, getMultiplier, getDifficultyMultiplier, formatDistance } from '@/lib/gameUtils';
import { playClick, playGood, playBad, playPerfect, playMedium, playTick, playHeartbeat, playMultiplierX2, playRoundTransition, playTimeExpired, playStressBeat, playCountdown, playGo } from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticTick, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst, fireRedBurst, fireDistanceReveal } from '@/lib/confetti';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import WorldMapCanvas from './WorldMapCanvas';
import CountdownIntro from './CountdownIntro';
import Mascot, { type MascotState } from './Mascot';
import { useA11y } from '@/contexts/AccessibilityContext';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import { type RoundResult, getRoundFeedback } from './GameScreen';
import { appNumberLocale } from '@/lib/format';
import RoundFeedbackCard from './RoundFeedbackCard';
import FitToBox from '@/components/ui/FitToBox';
import { frameAnswer } from '@/lib/mapFraming';
import { preloadCountryPhoto } from '@/lib/countryPhotos';

const GLOBAL_TIME = 60;
const POOL_SIZE = 40;
/** Cuánto se ve la tarjeta de respuesta (la misma del Clásico). El reloj global sigue: SIGUIENTE avanza antes. */
const CAOS_FEEDBACK_MS = 2000;

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
  /** Misma forma que las rondas del Clásico: permite reutilizar el cierre y el detalle por ronda */
  rounds: RoundResult[];
}

interface TimeAttackScreenProps {
  difficulty: Difficulty;
  gameMode: GameMode;
  onGameOver: (result: TimeAttackResult) => void;
  onExit?: () => void;
  musicMuted?: boolean;
  onToggleMusic?: () => void;
}

export default function TimeAttackScreen({ difficulty, gameMode, onGameOver, onExit, musicMuted, onToggleMusic }: TimeAttackScreenProps) {
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
  // Ronda recién respondida → tarjeta de respuesta (antes era un aviso pequeño arriba)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [mapArea, setMapArea] = useState({ w: 0, h: 0 });
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
  // La foto del país se descarga mientras el jugador busca la ciudad
  useEffect(() => { if (currentCity) preloadCountryPhoto(currentCity.country, 'sm'); }, [currentCity]);
  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMapArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [taStarted]);
  useEffect(() => () => clearTimeout(advanceTimerRef.current), []);

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
            hapticError();
            // Fuera del updater de setState (avisar al padre durante el render dispara un warning de React).
            // El sonido de cierre lo pone FinalResultScreen.
            setTimeout(() => onGameOverRef.current({
              cities: roundsRef.current.length,
              totalScore: roundsRef.current.reduce((s, r) => s + r.totalPoints, 0),
              rounds: roundsRef.current,
            }), 0);
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

  const pinLabels = useMemo(() => ({ you: t('game_yourAnswer'), correct: t('game_correctCity') }), [t]);

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
    const elapsedMs = Date.now() - roundStartRef.current;
    const timeUsed = Math.round(elapsedMs / 1000);
    const timeExact = Math.round(elapsedMs / 100) / 10;
    const distance = haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    const basePoints = calculateBasePoints(distance);
    const mult = getMultiplier(timeUsed);
    const totalPoints = Math.round(basePoints * mult.value * getDifficultyMultiplier(difficulty));
    setMascotState(distance >= 2000 ? 'sad' : distance < 300 ? 'celebrate' : 'wink');

    const round: RoundResult = { city: currentCity, clickLat: lat, clickLon: lon, distance, basePoints, multiplier: mult.value, totalPoints, timeUsed, timeExact };
    roundsRef.current.push(round);
    setLastResult(round);
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
      if (distance >= 5000) { setTimeout(() => fireDistanceReveal(distance, t('reveal_otherSide')), 400); }
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
    setIsAnimating(true);
    announce(t('sr_timeAttackResult', { city: currentCity.name, distance: Math.round(distance), points: totalPoints, time: globalTime }));

    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(advance, CAOS_FEEDBACK_MS);
  }, [isAnimating, currentCity]);

  // Siguiente ciudad (al acabar el tiempo de la tarjeta o al tocar SIGUIENTE)
  function advance() {
    clearTimeout(advanceTimerRef.current);
    setIsAnimating(false);
    setLastClick(null);
    setLastCorrect(null);
    setLastDistance(null);
    setLastPoints(null);
    setLastResult(null);
    setCurrentIdx(i => i + 1);
    playRoundTransition();
  }

  // Encuadre de la respuesta junto a la tarjeta (igual que el Clásico)
  const feedbackBounds = useMemo(() => {
    if (!lastResult || mapArea.w === 0) return null;
    const vw = typeof window !== 'undefined' ? window.innerWidth : mapArea.w;
    const clampPx = (min: number, pref: number, max: number) => Math.max(min, Math.min(pref, max));
    const cover = isPortraitMobile
      ? { bottom: 0.5 }
      : isCompact
      ? { right: clampPx(288, 0.48 * vw, 416) / mapArea.w }
      : layoutMode === 'wide'
      ? { right: clampPx(384, 0.36 * vw, 512) / mapArea.w }
      : { right: clampPx(352, 0.40 * vw, 480) / mapArea.w };
    return frameAnswer(
      { lat: lastResult.clickLat, lon: lastResult.clickLon },
      { lat: lastResult.city.lat, lon: lastResult.city.lon },
      mapArea.w, mapArea.h, cover, getMapBounds(gameMode),
    );
  }, [lastResult, mapArea.w, mapArea.h, isPortraitMobile, isCompact, layoutMode, gameMode]);

  if (!currentCity) return null;

  const modeLabel = t(`mode_${gameMode}` as never) || MODE_CONFIG.find(m => m.key === gameMode)?.label || gameMode;
  const diffLabel = t(`diff_${difficulty}` as never) || difficulty;

  if (!taStarted) {
    return isPortraitMobile ? null : <CountdownIntro count={countdown} label={`⚡ ${t('ta_hud')} · ${modeLabel} · ${diffLabel}`} onCancel={onExit} />;
  }

  const timePercent = (globalTime / GLOBAL_TIME) * 100;
  const isLow = globalTime <= 10;
  // Contador: color por presión — 30s amarillo, 20s naranja, 10s rojo
  const timeColor = globalTime <= 10 ? 'hsl(var(--destructive))' : globalTime <= 20 ? 'hsl(24 95% 55%)' : globalTime <= 30 ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
  const isWide = layoutMode === 'wide';
  const isTouchDevice = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  const confirmExit = () => { if (onExit && window.confirm(t('game_exitConfirm'))) onExit(); };
  const pillStyle = { background: 'hsl(var(--brand-navy-deep) / 0.78)' } as const;

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
          {/* ── Logo + modo ── */}
          <div className="w-full flex flex-col items-center gap-1.5 pb-2 mb-2 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-center gap-2">
              <img src="/mascot/explorer-logo.webp" alt="GeoSpeed" className="w-[22cqi] max-w-[64px] object-contain" />
              <Wordmark size="sm" />
            </div>
            <span className="rounded-full border border-destructive/50 bg-destructive/10 px-3 py-0.5 text-[6.5cqi] font-bold text-foreground">
              ⚡ <span className="text-destructive">{t('ta_hud')}</span> · {modeLabel} · {diffLabel}
            </span>
          </div>

          {/* ── Ciudad a encontrar ── */}
          <div className="w-full shrink-0 mb-2 rounded-xl px-[6.7cqi] py-[5.4cqi] border border-primary/25 bg-primary/10 text-center">
            <p className="text-[10cqi] font-semibold text-foreground/70 leading-none mb-1.5">
              {t('game_whereIs')}
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
            <p className="text-[10cqi] font-semibold text-foreground/50 uppercase tracking-widest leading-none mb-1">⭐ {t('game_points')}</p>
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
                {lastPoints >= 500 ? '🎯' : '😬'} +{lastPoints.toLocaleString(appNumberLocale())}
              </div>
            )}
            <Mascot
              state={mascotState}
              className={`w-[48cqi] max-w-[130px] shrink-0 select-none pointer-events-none drop-shadow-[0_4px_10px_hsl(var(--primary)/0.35)] ${mascotState === 'idle' ? 'animate-mascot-float' : ''}`}
            />
          </div>

          {/* ── Timer ── (sticky al fondo: siempre visible aunque el sidebar tenga poco alto) */}
          <div className="w-full shrink-0 sticky bottom-0 z-10 bg-card pt-2 mt-auto">
            <div className="text-center font-mono font-black mb-1.5 tabular-nums" style={{ fontSize: '2.25rem', lineHeight: 1.1, color: timeColor }} aria-live="polite" aria-label={t('ta_secondsLeft', { seconds: globalTime })}>
              {globalTime}s
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${timePercent}%`, background: timeColor }}
                role="progressbar"
                aria-valuenow={globalTime}
                aria-valuemax={GLOBAL_TIME}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Encabezado compacto (barra sólida encima del mapa; antes flotaba y tapaba el norte del mapa) (móvil horizontal), mismo patrón que el Clásico ── */}
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
              <div className="max-w-full truncate rounded-full border border-accent/40 px-3 py-1 text-sm font-black backdrop-blur-md" style={pillStyle}>
                {t('game_whereIs')} <span className="text-primary">{currentCity.name}</span>
              </div>
            </div>
            {onToggleMusic && (
              <button onClick={onToggleMusic} className="pointer-events-auto w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-sm backdrop-blur-md transition-all active:scale-90" style={pillStyle} aria-label={musicMuted ? t('music_on') : t('music_off')}>
                {musicMuted ? '🔇' : '🔊'}
              </button>
            )}
            {onExit && (
              <button onClick={confirmExit} className="pointer-events-auto w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-base backdrop-blur-md transition-all active:scale-90" style={pillStyle} aria-label={t('game_exit')}>
                ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="hidden min-[560px]:inline rounded-full px-2 py-0.5 border border-destructive/50 backdrop-blur-md whitespace-nowrap" style={pillStyle}>
              ⚡ <span className="text-destructive">{t('ta_hud')}</span> · {diffLabel}
            </span>
            <span className="rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md whitespace-nowrap" style={pillStyle}>
              🏙️ <span className="text-primary">{roundsRef.current.length}</span> {t('ta_cities')}
            </span>
            <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2 py-0.5 border border-border/60 backdrop-blur-md" style={pillStyle}>
              <span className={`font-mono whitespace-nowrap ${isLow ? 'animate-pulse' : ''}`} style={{ color: timeColor }}>⏱ {globalTime} s</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timePercent}%`, background: timeColor }} />
              </div>
            </div>
            <span className="relative rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={pillStyle}>
              ⭐ <span className={`text-primary font-black ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite"><CountUp value={score} /></span> pts
            </span>
          </div>
        </div>
      )}
      {/* ──── Map area ──── */}
      <div ref={mapAreaRef} className={`relative ${isCompact || isPortraitMobile ? 'flex-1 min-h-0' : 'h-full'} min-w-0 overflow-hidden`}>

        {/* Música + salir (con panel lateral) */}
        {!isCompact && (onExit || onToggleMusic) && (
          <div className="absolute z-20 flex items-center gap-2" style={{ top: 'max(0.5rem, var(--sat))', right: 'max(0.5rem, var(--sar))' }}>
            {onToggleMusic && (
              <button onClick={onToggleMusic} className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-base backdrop-blur-md transition-all active:scale-90" style={pillStyle} aria-label={musicMuted ? t('music_on') : t('music_off')}>
                {musicMuted ? '🔇' : '🔊'}
              </button>
            )}
            {onExit && (
              <button onClick={confirmExit} className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-lg backdrop-blur-md transition-all active:scale-90" style={pillStyle} aria-label={t('game_exit')}>
                ×
              </button>
            )}
          </div>
        )}

        {/* "Toca el mapa para responder" */}
        {!isAnimating && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))' }}>
            <span className="rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold border border-border/60 backdrop-blur-md whitespace-nowrap" style={pillStyle}>
              {isTouchDevice ? t('game_tapToAnswer') : t('game_clickToAnswer')}
            </span>
          </div>
        )}

        <WorldMapCanvas
          onMapClick={handleMapClick}
          onCursorMove={handleCursorMove}
          clickDisabled={isAnimating}
          userClick={lastClick}
          correctLocation={lastCorrect}
          distanceKm={lastDistance}
          gameMode={gameMode}
          highlightContinent={gameMode === 'world' && !isAnimating ? getContinentFromCoords(currentCity.lat, currentCity.lon) : null}
          pinLabels={pinLabels}
          showZoomControls={!isAnimating}
          viewBounds={feedbackBounds}
        />

        {/* Tarjeta de respuesta — la misma del Clásico, en modo rápido */}
        {isAnimating && lastResult && (() => {
          const fb = getRoundFeedback(lastResult.distance, palette, t);
          const mult = getMultiplier(lastResult.timeUsed);
          const props = {
            result: lastResult,
            feedback: fb,
            mascot: mascotState,
            streak: 0,
            streakBonus: 1,
            diffMult: getDifficultyMultiplier(difficulty),
            multLabel: mult.label,
            nearMissMsg: null,
            autoAdvanceTimer: 0,
            onNext: advance,
            timeLabel: `${(lastResult.timeExact ?? lastResult.timeUsed).toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 })} s`,
            natural: true,
            quick: true,
          };
          return isWide ? (
            <div className="absolute inset-y-0 right-0 z-10 w-[clamp(24rem,36vw,32rem)] flex items-center animate-slide-in-right p-3 lg:p-4" role="dialog" aria-label={t('game_resultLabel')}>
              <FitToBox center origin="center right"><RoundFeedbackCard {...props} size="lg" /></FitToBox>
            </div>
          ) : (
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
                <RoundFeedbackCard {...props} size="md" />
              </FitToBox>
            </div>
          );
        })()}
      </div>
    </div>
  );
}