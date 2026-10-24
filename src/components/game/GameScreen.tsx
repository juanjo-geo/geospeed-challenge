import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ChallengeGhost } from '@/lib/challenges';
import { GhostSideCard, GhostChip, GhostPulse, GhostCompare } from './GhostRace';
import TrainingTip from './TrainingTip';
import { City, getProgressiveCities, getMapBounds, isPackMode, type Difficulty, type GameMode, MODE_CONFIG } from '@/data/cities';
import { getRandomItems, isFlag, isFeature, isMonument, isSpecial, usesShapeFile, itemTitle, itemSubtitle, itemFlagUrl, itemPhotoUrl, featureTypeEmoji, featureTypeLabel, type Category } from '@/lib/catalog';
import { preloadLandmarkPhoto } from '@/lib/landmarkPhotos';
import { countryDistance } from '@/lib/flagScoring';
import { featureDistance } from '@/lib/featureScoring';
import { useFeatureShapes, usePackShapes } from '@/hooks/useFeatureShapes';
import { haversineDistance } from '@/lib/gameUtils';
import { closeness, scaleForMode, scoreRound, difficultyHundredths, speedMultiplier, comboLevelOf, COMBO_LEVELS, GOOD_MIN, PERFECT_KM, SCALE_KM, type Quality } from '@/lib/scoring';
import { playClick, playBad, playMedium, playTick, playHeartbeat, playGameOver, playMultiplierX2, playRoundTransition, playTimeExpired } from '@/lib/sounds';
import { hapticTap, hapticError, hapticTick } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst, fireRedBurst, fireDistanceReveal } from '@/lib/confetti';
import { fireMultiplierFeedback, fireScoreFly, fireRoundFlash } from '@/lib/juiceAnimations';
import { playComboFeedback, resetComboJuice } from '@/lib/comboJuice';
import ComboFx, { useComboFx } from './ComboFx';
import { useGameLayoutMode, useIsPortraitMobile, type GameLayoutMode } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGamepad } from '@/hooks/useGamepad';
import { useUltraWide } from '@/hooks/useUltraWide';
import WorldMapCanvas from './WorldMapCanvas';
import Mascot, { type MascotState, reactionForDistance } from './Mascot';
import CountUp from '@/components/ui/CountUp';
import TimerBar from './TimerBar';
import { useA11y } from '@/contexts/AccessibilityContext';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';
import { getEquipped } from '@/lib/cosmetics';
import Wordmark from '@/components/ui/Wordmark';
import RoundFeedbackCard from './RoundFeedbackCard';
import { HudIconButton, InGameSettings } from './GameHud';
import { frameAnswer, feedbackCover, PIN_LEGEND_CORNER } from '@/lib/mapFraming';
import FitToBox from '@/components/ui/FitToBox';
import { appNumberLocale } from '@/lib/format';
import { preloadCountryPhoto } from '@/lib/countryPhotos';
import { factIdOf, getPlaceFact, keyFact, usePlaceFacts } from '@/lib/placeFacts';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const TRAINING_ROUNDS = 6;
/** Segundos que la tarjeta de respuesta queda antes de avanzar sola (JuanJo 2026-10-21: +1 s, era 3) */
const AUTO_ADVANCE_SECONDS = 4;
/** Tiempo para ver la línea y los km entre la respuesta y la ciudad antes de que la tarjeta tape el mapa.
 *  JuanJo (2026-10-18): 2 s más que antes → 3,2 s; con el anuncio "¡al otro lado del mundo!" (≥ 5.000 km), 6,2 s. */
const DISTANCE_VIEW_MS = 3200;
/** Franja con un dato del lugar al acertar (Fase 8): 1,5 s, sin pausar nada */
const FACT_STRIP_MS = 1500;
const DISTANCE_VIEW_EPIC_MS = 6200;

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
  /** Puntaje v2: cercanía 0–1.000 (en el Mundial, los puntos de la banda) */
  basePoints: number;
  /** Puntaje v2: rapidez (×0,4–×2,2) */
  multiplier: number;
  totalPoints: number;
  timeUsed: number;
  /** Segundos con un decimal ("Respuesta 4,7 s"); el puntaje v2 usa este tiempo (en décimas) */
  timeExact?: number;
  /** Puntaje v2: aciertos buenos seguidos tras la ronda, multiplicador y nivel de combo (0–4) */
  combo?: number;
  comboMult?: number;
  comboLevel?: number;
  quality?: Quality;
  diffMult?: number;
  /** Esta ronda rompió un combo de 2 o más */
  brokeCombo?: boolean;
  /** Entrenamiento con reloj (Fase 4): se acabó el tiempo sin responder; cuenta como fallo y la tanda sigue */
  timedOut?: boolean;
  /** Banderas (Fase 6): punto "correcto" dibujado en el mapa (la frontera más cercana; el propio clic si cayó dentro) */
  targetLat?: number;
  targetLon?: number;
  /** Banderas: el clic cayó dentro del país */
  inside?: boolean;
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
  /** Reto contra un rival que ya jugó: su partida ronda por ronda (Fase 3, carrera contra el fantasma) */
  ghost?: ChallengeGhost | null;
  /** Entrenamiento sin reloj (Fase 4): sin cuenta regresiva por ciudad */
  noClock?: boolean;
  /** Texto de la confirmación al salir con la × (Sprint: salir cuenta como derrota) */
  exitConfirm?: string;
  /** Rótulo del modo en el HUD en vez de "región · dificultad" (Sprint) */
  hudLabel?: string;
  /** Qué se ubica (Fase 6): ciudades o banderas. Los ítems inyectados (citiesOverride) mandan por su `kind`. */
  category?: Category;
}

/** Tamaño del nombre en la tarjeta "¿Dónde está?" según su palabra más larga: "Kilimanjaro" o "Johannesburgo" no deben partirse a mitad */
function sidebarNameSize(name: string, compact = false): string {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  if (compact) return longest > 12 ? 'text-[8cqi]' : 'text-[9.5cqi]';
  return longest > 12 ? 'text-[9.5cqi]' : longest > 9 ? 'text-[11.5cqi]' : 'text-[14.5cqi]';
}

/** Etiqueta del pin correcto según el tipo de ítem (Fase 6): país/borde para banderas, dentro/borde/trazo/punto para lugares y monumentos */
export function correctPinLabel(r: { city: Pick<City, 'kind' | 'geom'>; inside?: boolean }, t: (key: string) => string, cityName?: string): string {
  if (r.city.kind === 'flag') return r.inside ? t('flag_inside') : t('flag_border');
  if (r.city.kind === 'monument') return t('feat_correct');
  if (r.city.kind === 'feature' || r.city.kind === 'division') return r.inside ? t('feat_inside') : r.city.geom === 'line' ? t('feat_nearest') : r.city.geom === 'area' ? t('feat_edge') : t('feat_correct');
  return cityName ?? t('game_correctCity');
}

/**
 * Distancia "equivalente al mapa del mundo" para la frase y la reacción de la mascota: en un pack de país la cercanía
 * usa 150 km de escala (no 1.500), así que 150 km en Colombia se sienten como 1.500 en el mundo. El puntaje no cambia.
 */
export function feedbackKm(distance: number, mode: string): number {
  if (distance < PERFECT_KM || !isPackMode(mode)) return distance;
  return distance * (SCALE_KM.world / scaleForMode(mode));
}

export function getRoundFeedback(distance: number, palette?: ReturnType<typeof useA11y>['palette'], t?: (key: string) => string): { emoji: string; phrase: string; color: string } {
  const p = palette;
  if (distance < PERFECT_KM) return { emoji: '🎯', phrase: t?.('game_perfect') ?? '¡PERFECTO!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 300) return { emoji: '🔥', phrase: t?.('game_incredible') ?? '¡Increíble!', color: p?.good.tw ?? 'text-green-400' };
  if (distance < 1000) return { emoji: '👏', phrase: t?.('game_veryGood') ?? '¡Muy bien!', color: p?.fair.tw ?? 'text-emerald-400' };
  if (distance < 2000) return { emoji: '👍', phrase: t?.('game_good') ?? 'Bien hecho', color: p?.medium.tw ?? 'text-yellow-400' };
  if (distance < 3000) return { emoji: '👀', phrase: t?.('game_almost') ?? 'Casi...', color: p?.warn.tw ?? 'text-orange-400' };
  if (distance < 5000) return { emoji: '🌍', phrase: t?.('game_far') ?? 'Lejos...', color: p?.bad.tw ?? 'text-red-400' };
  return { emoji: '😬', phrase: t?.('game_veryFar') ?? 'Muy lejos', color: p?.bad.tw ?? 'text-red-500' };
}

export default function GameScreen({ difficulty, gameMode, onRoundComplete, onGameOver, seed, isTraining = false, maxTimeOverride, totalRoundsOverride, citiesOverride, onExit, musicMuted, onToggleMusic, ghost, noClock = false, exitConfirm, hudLabel, category = 'cities' }: GameScreenProps) {
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
      : getRandomItems(category, difficulty, totalRounds, gameMode, seed),
  );
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(effectiveMaxTime);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(AUTO_ADVANCE_SECONDS);
  const [scorePop, setScorePop] = useState(false);
  const [floatPoints, setFloatPoints] = useState<number | null>(null);
  // Combo (puntaje v2): aciertos buenos seguidos. En ref para que el clic siempre lea el valor actual.
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  // Juice del combo: destello en cada acierto con combo, contador que se apaga al romperse
  const [comboHit, setComboHit] = useState(0);
  const [brokeLevel, setBrokeLevel] = useState<number | null>(null);
  const { fxClass, fire: fireComboFx } = useComboFx();
  useEffect(() => { resetComboJuice(); return () => resetComboJuice(); }, []);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [failShake, setFailShake] = useState(false);
  // Ficha del lugar (Fase 8): las cifras se descargan al empezar; la franja del acierto dura 1,5 s
  const placeFacts = usePlaceFacts();
  const [factStrip, setFactStrip] = useState<string | null>(null);
  const factStripTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (factStripTimer.current) clearTimeout(factStripTimer.current); }, []);
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
  // La foto del país se descarga mientras el jugador busca la ciudad: la tarjeta la muestra sin esperar
  useEffect(() => {
    if (!currentCity) return;
    preloadCountryPhoto(currentCity.country, 'sm');
    // Monumentos: la foto es la pregunta, así que la del siguiente se pide desde ya (y la de este, por si acaso)
    for (const it of [currentCity, cities[currentRound + 1]]) {
      if (it && isMonument(it)) { preloadLandmarkPhoto(it, 'lg'); preloadLandmarkPhoto(it, 'sm'); }
    }
  }, [currentCity, cities, currentRound]);

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
    announce(noClock ? t('sr_announceRoundNoClock', { round: currentRound + 1, city: itemTitle(currentCity, locale) }) : t('sr_announceRound', { round: currentRound + 1, city: itemTitle(currentCity, locale), time: effectiveMaxTime }), 'assertive');
  }, [currentRound, currentCity, t]);

  // ── Carrera contra el fantasma (Fase 3): el rival ya jugó estas mismas ciudades ──
  // Su aviso sale en el segundo exacto (décimas) en que respondió; las pausas no cuentan, igual que para el reloj.
  const ghostRound = useMemo(() => ghost?.rounds.find(r => r.round_no === currentRound + 1) ?? null, [ghost, currentRound]);
  const [ghostAnswered, setGhostAnswered] = useState(false);
  const [ghostPulse, setGhostPulse] = useState(false);
  useEffect(() => { setGhostAnswered(false); setGhostPulse(false); }, [currentRound]);
  useEffect(() => {
    if (!ghostRound || ghostRound.time_s == null || ghostAnswered || isWaiting) return;
    if (isPortraitMobile || isPageHidden || settingsOpen) return;
    const elapsed = Date.now() - roundStartRef.current - pausedMsRef.current;
    const id = setTimeout(() => { setGhostAnswered(true); setGhostPulse(true); }, Math.max(0, ghostRound.time_s * 1000 - elapsed));
    return () => clearTimeout(id);
  }, [ghostRound, ghostAnswered, isWaiting, isPortraitMobile, isPageHidden, settingsOpen]);
  useEffect(() => {
    if (!ghostPulse) return;
    const id = setTimeout(() => setGhostPulse(false), 2400);
    return () => clearTimeout(id);
  }, [ghostPulse]);
  // Puntaje del rival en vivo: las ciudades anteriores y esta si ya respondió (o si ya respondí yo)
  const ghostScore = useMemo(
    () => (ghost ? ghost.rounds.reduce((s, r) => s + (r.round_no <= currentRound || (r.round_no === currentRound + 1 && (ghostAnswered || isWaiting)) ? r.points : 0), 0) : 0),
    [ghost, currentRound, ghostAnswered, isWaiting],
  );

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

  // Entrenamiento con reloj: al acabarse el tiempo se registra un fallo (se asigna tras handleMapClick)
  const timeoutMissRef = useRef<() => void>(() => {});
  // Single timer effect — pauses when waiting, portrait, or no city (sin reloj en el entrenamiento: no corre)
  useEffect(() => {
    if (isWaiting || !currentCity || isPortraitMobile || isPageHidden || settingsOpen || noClock) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Entrenamiento: se acabó el tiempo = fallo de esta ciudad; la tanda sigue
          if (isTraining) { setTimeout(() => timeoutMissRef.current(), 0); return 0; }
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
    // Primero se ve la distancia sobre el mapa; con el anuncio de error épico (≥ 5.000 km), más tiempo
    const delay = lastResult.distance >= 5000 ? DISTANCE_VIEW_EPIC_MS : DISTANCE_VIEW_MS;
    const timeout = setTimeout(() => setShowPopup(true), delay);
    return () => clearTimeout(timeout);
  }, [isWaiting, lastResult]);

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
    // Bandera o lugar (Fase 6): distancia al contorno — 0 dentro, si no al borde o al trazo más cercano (el servidor mide igual)
    const flagHit = isFlag(currentCity) ? countryDistance(currentCity.name, lat, lon) : usesShapeFile(currentCity) ? featureDistance(currentCity, lat, lon) : null;
    const distance = flagHit ? flagHit.km : haversineDistance(lat, lon, currentCity.lat, currentCity.lon);
    // Puntaje v2: cercanía × rapidez × combo × dificultad (src/lib/scoring.ts; el servidor lo recalcula igual)
    const prevLevel = comboLevelOf(comboRef.current);
    const sc = scoreRound(closeness(distance, scaleForMode(gameMode)), timeExact, comboRef.current, difficultyHundredths(difficulty));
    const newStreak = sc.combo;
    comboRef.current = sc.combo;
    setCombo(sc.combo);
    // Reacción de la mascota: en EN LLAMAS siempre celebra
    setMascotState(sc.comboLevel >= 4 ? 'cheer' : reactionForDistance(feedbackKm(distance, gameMode), newStreak));
    const mult = { value: sc.speed };
    const totalPoints = sc.points;

    const result: RoundResult = {
      city: currentCity,
      clickLat: lat,
      clickLon: lon,
      distance,
      basePoints: sc.closeness,
      multiplier: sc.speed,
      totalPoints,
      timeUsed,
      timeExact,
      combo: sc.combo,
      comboMult: sc.comboMult,
      comboLevel: sc.comboLevel,
      quality: sc.quality,
      diffMult: sc.diffMult,
      brokeCombo: sc.broke,
      targetLat: flagHit?.nearest.lat,
      targetLon: flagHit?.nearest.lon,
      inside: flagHit?.inside,
    };

    // Juice del combo en el mismo instante del clic: sonido (tono por nivel), vibración, música y
    // efectos visuales juntos (src/lib/comboJuice.ts, ComboFx)
    playComboFeedback(sc, prevLevel, { perfect: distance < PERFECT_KM });
    // Acierto: franja con un dato del lugar ("Medellín · 2,6 millones de habitantes") durante 1,5 s
    if (sc.quality === 'good') {
      const f = keyFact(currentCity, getPlaceFact(factIdOf(currentCity)), t as never, locale);
      if (factStripTimer.current) clearTimeout(factStripTimer.current);
      setFactStrip(f ? `${itemTitle(currentCity, locale)} · ${f}` : null);
      if (f) factStripTimer.current = setTimeout(() => setFactStrip(null), FACT_STRIP_MS);
    }
    fireComboFx(sc.comboLevel, sc.broke, sc.quality !== 'miss');
    if (sc.quality !== 'miss' && sc.comboLevel >= 2) setComboHit(h => h + 1);
    if (sc.broke) { setBrokeLevel(prevLevel); setTimeout(() => setBrokeLevel(null), 600); }

    setTimeout(() => {
      // Confeti: cercanía perfecta (estrellas) o acierto bueno desde ¡Turbo! (oro)
      if (distance < PERFECT_KM) fireStarBurst(lastClickViewportRef.current);
      else if (sc.quality === 'good' && sc.comboLevel >= 3) fireGoldBurst(lastClickViewportRef.current);
      // Fallo: si rompió un combo ya sonó la campana descendente (nunca un buzzer); si no, el sonido de siempre
      if (sc.quality === 'miss') {
        if (distance >= 3000) {
          if (!sc.broke) { playBad(); hapticError(); setFailShake(true); setTimeout(() => setFailShake(false), 450); }
          fireRedBurst(lastClickViewportRef.current);
        } else if (!sc.broke) { playMedium(); hapticTap(); }
      }
      // Error épico (≥ 5.000 km): anuncio de la distancia (retrasa la tarjeta)
      if (distance >= 5000) {
        setTimeout(() => fireDistanceReveal(distance, t('reveal_otherSide')), 400);
      }
      // Rapidez alta: sonido extra y anuncio del multiplicador de velocidad
      if (mult.value >= 1.8) { setTimeout(() => playMultiplierX2(), 350); }
      if (mult.value >= 1.5) {
        setTimeout(() => fireMultiplierFeedback(mult.value, newStreak, lastClickViewportRef.current), 150);
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
    const fb = getRoundFeedback(feedbackKm(distance, gameMode), palette, t);
    announce(t(isTraining ? 'sr_announceResultTraining' : 'sr_announceResult', { feedback: fb.phrase, city: itemTitle(currentCity, locale), country: itemSubtitle(currentCity, locale), distance: Math.round(distance), points: totalPoints, round: currentRound + 1, total: totalRounds }));
  }, [isWaiting, currentCity, onRoundComplete, t, gameMode, difficulty]);

  timeoutMissRef.current = () => {
    if (isWaiting || !currentCity) return;
    comboRef.current = 0;
    setCombo(0);
    setMascotState('down');
    playTimeExpired();
    hapticError();
    const result: RoundResult = {
      city: currentCity, clickLat: currentCity.lat, clickLon: currentCity.lon, distance: 0,
      basePoints: 0, multiplier: 0, totalPoints: 0, timeUsed: effectiveMaxTime, timeExact: effectiveMaxTime,
      combo: 0, comboMult: 1, comboLevel: 0, quality: 'miss', diffMult: 1, timedOut: true,
    };
    setLastResult(result);
    setRounds(r => [...r, result]);
    setIsWaiting(true);
    onRoundComplete(result);
  };

  useEffect(() => { setMascotState('idle'); }, [currentRound]);

  if (!currentCity) return null;

  const feedback = lastResult
    ? (lastResult.timedOut ? { emoji: '⏰', phrase: t('train_timeUp'), color: palette?.bad.tw ?? 'text-red-400' } : getRoundFeedback(feedbackKm(lastResult.distance, gameMode), palette, t))
    : null;
  // Combo visible desde "Buen ritmo" (2 aciertos buenos seguidos)
  const comboLevel = comboLevelOf(combo);
  const showStreak = comboLevel >= 1 && !isTraining; // el entrenamiento no tiene puntaje (ni combo visible)
  const comboKey = COMBO_LEVELS[comboLevel].key;
  const comboMultNow = COMBO_LEVELS[comboLevel].tenths / 10;
  // Contador visible: el combo actual o, durante 0,6 s, el que se acaba de romper (se apaga)
  const counterLevel = showStreak ? comboLevel : brokeLevel ?? 0;
  const counterKey = COMBO_LEVELS[counterLevel].key;
  const counterMult = COMBO_LEVELS[counterLevel].tenths / 10;
  const counterOut = !showStreak && brokeLevel != null && brokeLevel >= 1;
  const pinFx = useMemo(() => (lastResult && lastResult.quality !== 'miss' ? { level: lastResult.comboLevel ?? 0 } : null), [lastResult]);
  const modeLabel = t(`mode_${gameMode}` as never) || MODE_CONFIG.find(m => m.key === gameMode)?.label || gameMode;
  const diffLabel = t(`diff_${difficulty}` as never) || difficulty;
  const isTouchDevice = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  const confirmExit = () => { if (onExit && window.confirm(exitConfirm ?? t('game_exitConfirm'))) onExit(); };
  // Estable entre renders: WorldMapCanvas lo usa como dependencia de la animación del trazo
  const pinLabels = useMemo(() => ({
    you: t('game_yourAnswer'),
    correct: lastResult ? correctPinLabel(lastResult, t) : t('game_correctCity'),
  }), [t, lastResult]);
  // Contornos de los lugares (Fase 6b): se cargan al entrar si la partida los usa; el país/lugar se resalta al responder
  const featureShapes = useFeatureShapes(cities.some(isFeature));
  const packShapes = usePackShapes(cities.find((c) => c.kind === 'division')?.id ?? null);
  const highlightShape = useMemo(
    () => {
      if (!lastResult || !usesShapeFile(lastResult.city) || !lastResult.city.id) return null;
      const src = lastResult.city.kind === 'division' ? packShapes : featureShapes;
      return src?.[lastResult.city.id] ?? null;
    },
    [lastResult, featureShapes, packShapes],
  );
  // Objetos estables: si se recrean en cada render (tic del auto-avance), WorldMapCanvas reinicia
  // la animación del trazo y nunca llega a mostrar la ciudad correcta ni las etiquetas.
  const userClickPt = useMemo(() => lastResult && !lastResult.timedOut ? { lat: lastResult.clickLat, lon: lastResult.clickLon } : null, [lastResult]);
  const correctPt = useMemo(() => lastResult ? { lat: lastResult.targetLat ?? lastResult.city.lat, lon: lastResult.targetLon ?? lastResult.city.lon } : null, [lastResult]);
  // El pin del rival solo aparece después de responder (nunca antes: se vería dónde clicó)
  const ghostPt = useMemo(
    () => (isWaiting && ghost && ghostRound?.click_lat != null && ghostRound.click_lon != null
      ? { lat: ghostRound.click_lat, lon: ghostRound.click_lon, label: ghost.name, distanceKm: ghostRound.distance_km }
      : null),
    [isWaiting, ghost, ghostRound],
  );

  const numberLocale = locale === 'en' ? 'en-US' : 'es-CO';
  const fmtSecs = (r: RoundResult) => (r.timeExact ?? r.timeUsed).toLocaleString(numberLocale, { maximumFractionDigits: 1 });
  // Respuesta: el mapa se acerca a tu punto y a la ciudad correcta, dejando libre lo que tapa la tarjeta
  const cover = useMemo(
    () => (showPopup && lastResult && mapArea.w > 0 ? feedbackCover(isPortraitMobile ? 'portrait' : isCompact ? 'compact' : isWide ? 'wide' : 'medium', mapArea.w) : null),
    [showPopup, lastResult, mapArea.w, isPortraitMobile, isCompact, isWide],
  );
  const feedbackBounds = useMemo(() => {
    if (!cover || !lastResult) return null;
    return frameAnswer(
      lastResult.timedOut ? { lat: lastResult.city.lat, lon: lastResult.city.lon } : { lat: lastResult.clickLat, lon: lastResult.clickLon },
      { lat: lastResult.targetLat ?? lastResult.city.lat, lon: lastResult.targetLon ?? lastResult.city.lon },
      mapArea.w, mapArea.h, cover, getMapBounds(gameMode), ghostPt ? [ghostPt] : [],
    );
  }, [cover, lastResult, mapArea.w, mapArea.h, gameMode, ghostPt]);
  // Las etiquetas del mapa evitan la tarjeta y la leyenda de pines (no hay leyenda en vertical)
  const labelAvoid = useMemo(() => (cover ? { ...cover, corner: isPortraitMobile ? undefined : PIN_LEGEND_CORNER } : null), [cover, isPortraitMobile]);

  // Casi: motivar cuando faltó poco para el siguiente escalón (puntaje v2)
  const nearMissMsg = (() => {
    if (!lastResult) return null;
    const d = lastResult.distance;
    const scale = scaleForMode(gameMode);
    // A pocos km de la cercanía perfecta (1.000 a menos de 25 km)
    if (d >= PERFECT_KM && d < PERFECT_KM * 2) return t('game_nearPerfect', { km: Math.max(1, Math.round(d - PERFECT_KM)) });
    // Acierto regular que estuvo cerca de ser bueno (y sumar al combo)
    const goodKm = scale * Math.log(1000 / (GOOD_MIN - 0.5));
    if (lastResult.quality === 'regular' && d - goodKm < scale * 0.12) return t('game_nearGood', { km: Math.max(1, Math.round(d - goodKm)) });
    // Rápido pero no tanto: 2 s menos subían la rapidez
    const te = lastResult.timeExact ?? lastResult.timeUsed;
    if (te >= 3 && te <= 6 && lastResult.quality === 'good') {
      const better = speedMultiplier(te - 2);
      return t('game_nearSpeed', { s: 2, mult: better.toLocaleString(numberLocale, { maximumFractionDigits: 2 }) });
    }
    return null;
  })();
  // Carrera contra el fantasma: la ronda del rival junto a la mía (o que no llegó a esta ciudad)
  const ghostCompare = ghost && lastResult ? (
    <GhostCompare
      name={ghost.name}
      avatar={ghost.avatar}
      me={{ km: lastResult.distance, seconds: lastResult.timeExact ?? lastResult.timeUsed, points: lastResult.totalPoints }}
      rival={ghostRound ? { km: ghostRound.distance_km, seconds: ghostRound.time_s, points: ghostRound.points } : null}
    />
  ) : undefined;
  const cardExtra = ghostCompare ?? (isTraining && lastResult ? <TrainingTip city={lastResult.city} /> : undefined);
  const cardFact = useMemo(() => (lastResult && placeFacts ? keyFact(lastResult.city, placeFacts[factIdOf(lastResult.city) ?? ''] ?? null, t as never, locale) : null), [lastResult, placeFacts, t, locale]);
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
              {isFlag(currentCity)
                ? <span className="flex items-center gap-2 min-w-0"><img src={itemFlagUrl(currentCity) ?? ''} alt="" className="w-16 aspect-[3/2] object-cover rounded-[4px] ring-1 ring-black/20 shrink-0" /><span className="text-sm font-black truncate">{t('flag_whichCountry')}</span></span>
                : <span className="flex items-center gap-2 min-w-0">
                    {isMonument(currentCity) && itemPhotoUrl(currentCity, 'sm') && <img src={itemPhotoUrl(currentCity, 'sm') ?? ''} alt="" className="w-16 aspect-[3/2] object-cover rounded-[4px] ring-1 ring-black/20 shrink-0" />}
                    <p className="text-sm font-black truncate">{currentCity.ftype ? featureTypeEmoji(currentCity.ftype) : isMonument(currentCity) ? '🗼' : '📍'} {itemTitle(currentCity, locale)}</p>
                  </span>}
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}>
                <CountUp value={score} />
              </span>
            </div>
          </div>
          {/* Row 2: Country + Timer */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">{isFlag(currentCity) ? `🚩 ${t('cat_flags')}` : currentCity.ftype ? `${featureTypeEmoji(currentCity.ftype)} ${featureTypeLabel(currentCity.ftype, locale)}` : isMonument(currentCity) ? `📍 ${itemSubtitle(currentCity, locale)}` : `🌍 ${currentCity.country}`}</p>
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
              {hudLabel ? <span className="text-primary">{hudLabel}</span> : <><span className="text-primary">{modeLabel}</span><span className="text-accent mx-[2cqi]">·</span>{diffLabel}</>}
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
            <p className="text-[8.6cqi] font-bold leading-none mb-[2.5cqi]" id="city-label">{isFlag(currentCity) ? t('flag_whichCountry') : t('game_whereIs')}</p>
            {isFlag(currentCity) ? (
              <img src={itemFlagUrl(currentCity) ?? ''} alt="" aria-labelledby="city-label" className="mx-auto w-full max-w-[320px] aspect-[3/2] object-cover rounded-lg ring-2 ring-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.45)]" />
            ) : (
            <>
            {/* Monumento (Fase 6c): la foto es la pregunta; el nombre va debajo, más chico */}
            {isMonument(currentCity) && itemPhotoUrl(currentCity, 'lg') && (
              <img src={itemPhotoUrl(currentCity, 'lg') ?? ''} alt="" className="mx-auto mb-[3cqi] w-full max-w-[320px] aspect-[3/2] object-cover rounded-lg ring-2 ring-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.45)]" />
            )}
            <p
              className={`${sidebarNameSize(itemTitle(currentCity, locale), isMonument(currentCity))} font-extrabold leading-tight`}
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none', textShadow: '0 2px 10px hsl(var(--primary) / 0.25)' }}
              aria-labelledby="city-label"
            >
              {itemTitle(currentCity, locale)}
            </p>
            </>
            )}
            {currentCity.ftype && (
              <p className="mt-1 text-[3.6cqi] font-semibold text-foreground/70">{featureTypeEmoji(currentCity.ftype)} {featureTypeLabel(currentCity.ftype, locale)}</p>
            )}
            {isTraining && !isWaiting && (
              <p className="mt-1.5 text-xs text-foreground/50">
                🌍 <span className="font-bold text-foreground/75">{isSpecial(currentCity) ? itemSubtitle(currentCity, locale) : currentCity.country}</span>
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
          ) : noClock ? (
            <div className="flex items-center gap-[4cqi] px-[2cqi] shrink-0">
              <ClockIcon className="w-[11cqi] h-[11cqi] text-accent shrink-0" />
              <span className="text-[8cqi] font-bold">{t('train_noLimit')}</span>
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

          {/* PUNTOS (el entrenamiento y el repaso no tienen puntaje) */}
          {!isTraining && (
          <div className="relative w-full shrink-0 rounded-2xl border-2 border-accent/30 bg-background/40 px-[5cqi] py-[3.5cqi] flex items-center gap-[4.5cqi]">
            <span className="text-[12cqi] leading-none" aria-hidden>⭐</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide">{t('game_points')}</span>
              <span ref={scoreElRef} className={`block text-[11.5cqi] font-extrabold leading-none transition-colors ${scorePop && comboLevel >= 1 ? 'text-accent' : 'text-primary'} ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite">
                <CountUp value={score} />
              </span>
            </span>
            {floatPoints !== null && (
              <span className={`absolute right-[5cqi] top-[3cqi] font-bold text-accent pointer-events-none ${floatPoints >= 1000 ? 'text-sm animate-float-up-big' : 'text-xs animate-float-up'}`}>
                +{floatPoints.toLocaleString(numberLocale)}
              </span>
            )}
          </div>
          )}

          {ghost && <GhostSideCard name={ghost.name} avatar={ghost.avatar} rivalScore={ghostScore} myScore={score} pulse={ghostPulse} />}

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

          {/* Combo (puntaje v2): nivel, multiplicador y aciertos buenos seguidos */}
          {(showStreak || counterOut) && (
            <div
              key={counterOut ? 'out' : comboLevel}
              className={`combo-counter w-full shrink-0 rounded-2xl border-2 border-primary/40 bg-background/40 px-[5cqi] py-[3cqi] flex items-center gap-[3.5cqi] ${counterOut ? 'animate-combo-out' : 'animate-score-pop'} ${counterLevel >= 4 && !counterOut ? 'combo-fire' : ''}`}
            >
              {/* El contador crece con el nivel: el fuego y el nombre del nivel se agrandan (sin salirse de la barra) */}
              <span className={`leading-none ${counterLevel >= 4 && !counterOut ? 'combo-flame' : ''}`} style={{ fontSize: `${10 + counterLevel}cqi` }} aria-hidden>🔥</span>
              <span className="min-w-0 leading-tight">
                <span className="block font-extrabold text-primary truncate transition-[font-size] duration-300" style={{ fontSize: `${7.6 + 0.6 * counterLevel}cqi` }}>{counterKey ? t(counterKey) : ''}</span>
                <span className="block text-[6.2cqi] font-semibold text-muted-foreground truncate"><span className="text-accent font-extrabold">×{counterMult.toLocaleString(numberLocale)}</span> · {counterOut ? t('combo_broken') : t('game_streakCount', { n: combo })}</span>
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
                {isFlag(currentCity)
                  ? <><img src={itemFlagUrl(currentCity) ?? ''} alt="" className="inline-block w-14 aspect-[3/2] object-cover rounded-[3px] align-middle mr-2 ring-1 ring-black/20" /><span className="align-middle">{t('flag_whichCountry')}</span></>
                  : <>{isMonument(currentCity) && itemPhotoUrl(currentCity, 'sm') && <img src={itemPhotoUrl(currentCity, 'sm') ?? ''} alt="" className="inline-block w-14 aspect-[3/2] object-cover rounded-[3px] align-middle mr-2 ring-1 ring-black/20" />}<span className="align-middle">{t('game_whereIs')} <span className="text-primary">{itemTitle(currentCity, locale)}</span></span>{currentCity.ftype && <span className="text-muted-foreground font-semibold"> · {featureTypeEmoji(currentCity.ftype)} {featureTypeLabel(currentCity.ftype, locale)}</span>}</>}
                {isTraining && !isWaiting && <span className="text-muted-foreground font-semibold"> · {isSpecial(currentCity) ? itemSubtitle(currentCity, locale) : currentCity.country}</span>}
              </div>
            </div>
            {onToggleMusic && <HudIconButton size="sm" icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton size="sm" icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            {onExit && <HudIconButton size="sm" icon="close" label={t('game_exit')} onClick={confirmExit} />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="hidden min-[560px]:inline rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              {hudLabel ? <span className="text-primary">{hudLabel}</span> : <><span className="text-primary">{modeLabel}</span> · {diffLabel}</>}
            </span>
            <span className="rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              {t('game_round')} <span className="text-primary">{currentRound + 1}</span><span className="text-muted-foreground"> / {totalRounds}</span>
            </span>
            <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              <span className={`font-mono whitespace-nowrap ${!noClock && timeLeft <= 3 && !isWaiting ? 'text-destructive animate-pulse' : !noClock && timeLeft <= 5 && !isWaiting ? 'text-destructive' : ''}`}>⏱ {noClock ? t('train_noLimit') : `${timeLeft} s`}</span>
              {!noClock && <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(timeLeft / effectiveMaxTime) * 100}%`, background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))', transition: isWaiting ? 'none' : 'width 200ms linear' }} />
              </div>}
            </div>
            {!isTraining && (
            <span className="relative rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              ⭐ <span ref={scoreElRef} className={`font-black transition-colors ${scorePop && comboLevel >= 1 ? 'text-accent' : 'text-primary'} ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite"><CountUp value={score} /></span> pts
              {floatPoints !== null && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-accent animate-float-up whitespace-nowrap">+{floatPoints.toLocaleString(appNumberLocale())}</span>
              )}
            </span>
            )}
            {ghost && <GhostChip name={ghost.name} avatar={ghost.avatar} rivalScore={ghostScore} myScore={score} pulse={ghostPulse} />}
          </div>
        </div>
      )}
      {/* ──── Map area (all modes) — h-full gives WorldMapCanvas explicit height in grid ──── */}
      {/* w-full: con margin auto, un ítem de grid se encoge al tamaño del canvas (800 px) en ultrawide */}
      <div ref={mapAreaRef} className={`relative w-full ${isCompact || isPortraitMobile ? 'flex-1 min-h-0' : 'h-full'} min-w-0 overflow-hidden ${fxClass}`} style={{ maxWidth: maxMapWidth, margin: isUltraWide ? '0 auto' : undefined }}>
        <ComboFx level={comboLevel} hit={comboHit} active={!isWaiting} />

        {/* Música + salir (escritorio / tablet con panel lateral) */}
        {!isCompact && (
          <div className="absolute z-20 flex items-center gap-2.5" style={{ top: 'max(0.75rem, var(--sat))', right: 'max(0.75rem, var(--sar))' }}>
            {onToggleMusic && <HudIconButton icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            {onExit && <HudIconButton icon="close" label={t('game_exit')} onClick={confirmExit} />}
          </div>
        )}

        {/* Racha (móvil): abajo a la izquierda, como la maqueta */}
        {isCompact && (showStreak || counterOut) && (
          <div className="absolute z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))', left: 'max(0.5rem, var(--sal))' }}>
            <span
              key={counterOut ? 'out' : comboLevel}
              className={`combo-counter inline-block rounded-full px-3 py-1.5 text-xs font-bold border-2 border-accent/40 backdrop-blur-md ${counterOut ? 'animate-combo-out' : 'animate-score-pop'} ${counterLevel >= 4 && !counterOut ? 'combo-fire' : ''}`}
              style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)', transform: `scale(${1 + 0.04 * counterLevel})`, transformOrigin: 'left bottom' }}
            >
              <span className={counterLevel >= 4 && !counterOut ? 'combo-flame' : ''}>🔥</span> <span className="text-primary">{counterKey ? t(counterKey) : ''}</span> <span className="text-accent">×{counterMult.toLocaleString(numberLocale)}</span>{!counterOut && <> · {combo}</>}
            </span>
          </div>
        )}

        {/* Franja del acierto (Fase 8): un dato del lugar 1,5 s, en el lugar de "Toca el mapa" */}
        {isWaiting && factStrip && !showPopup && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[7] pointer-events-none max-w-[92%]" style={{ bottom: 'max(0.5rem, var(--sab))' }} role="status">
            <span className="block animate-fade-in rounded-full px-4 py-1.5 short:py-1 text-xs sm:text-sm font-bold border-2 border-accent/70 text-foreground backdrop-blur-md truncate shadow-[0_0_18px_hsl(var(--accent)/0.35)]" style={{ background: 'hsl(var(--brand-navy-deep) / 0.9)' }}>
              <span className="text-accent" aria-hidden>✓ </span>{factStrip}
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
            <span className="flex items-center gap-2"><PinIcon color="hsl(var(--accent))" />{t(isFlag(lastResult.city) ? 'flag_correctCountry' : isFeature(lastResult.city) || isMonument(lastResult.city) || lastResult.city.kind === 'division' ? 'feat_correct' : 'game_correctCity')}</span>
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
          distanceKm={lastResult && !lastResult.timedOut && !lastResult.inside ? lastResult.distance : null}
          highlightCountry={lastResult && isFlag(lastResult.city) ? lastResult.city.name : null}
          highlightShape={highlightShape}
          gameMode={gameMode}
          hintZone={isTraining && !isWaiting && showHint ? { lat: currentCity.lat, lon: currentCity.lon } : null}
          highlightContinent={gameMode === 'world' && !isWaiting ? getContinentFromCoords(currentCity.lat, currentCity.lon) : null}
          pinConfig={pinConfig}
          trailConfig={trailConfig}
          pinLabels={pinLabels}
          showZoomControls={!isWaiting}
          viewBounds={feedbackBounds}
          labelAvoid={labelAvoid}
          pinFx={pinFx}
          rivalClick={ghostPt}
        />

        {ghost && ghostPulse && !isWaiting && ghostRound?.time_s != null && (
          <GhostPulse name={ghost.name} avatar={ghost.avatar} seconds={ghostRound.time_s} />
        )}

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
              nearMissMsg={nearMissMsg}
              autoAdvanceTimer={autoAdvanceTimer}
              onNext={advanceRound}
              timeLabel={`${fmtSecs(lastResult)} s`}
              size="lg"
              natural
              extra={cardExtra}
              firstTile={lastResult.timedOut ? { label: t('game_distance'), value: '—' } : lastResult.inside ? { label: t('game_distance'), value: t('flag_insideShort') } : undefined}
              title={itemTitle(lastResult.city, locale)}
              subtitle={itemSubtitle(lastResult.city, locale)}
              hidePoints={isTraining}
              fact={cardFact}
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
                nearMissMsg={nearMissMsg}
                autoAdvanceTimer={autoAdvanceTimer}
                onNext={advanceRound}
                timeLabel={`${fmtSecs(lastResult)} s`}
                size="md"
                natural
                extra={cardExtra}
              firstTile={lastResult.timedOut ? { label: t('game_distance'), value: '—' } : lastResult.inside ? { label: t('game_distance'), value: t('flag_insideShort') } : undefined}
              title={itemTitle(lastResult.city, locale)}
              subtitle={itemSubtitle(lastResult.city, locale)}
              hidePoints={isTraining}
              fact={cardFact}
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

export function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

export function BarsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <rect x="3" y="13" width="4" height="8" rx="1.2" /><rect x="10" y="8" width="4" height="13" rx="1.2" /><rect x="17" y="3" width="4" height="18" rx="1.2" />
    </svg>
  );
}

export function PinIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" fill={color} stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="9.5" r="2.6" fill="white" />
    </svg>
  );
}
