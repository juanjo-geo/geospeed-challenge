import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getMapBounds, type City, type Difficulty } from '@/data/cities';
import { getPlayersByDifficulty, type Player } from '@/data/players';
import {
  scoreWorldRound,
  getCountryCentroid,
  COUNTRY_CONTINENT,
  type TerritoryBand,
  type WorldRoundResult,
} from '@/lib/worldChallenge';
import {
  playClick, playGood, playBad, playMedium,
  playTick, playTimeExpired, playButtonTap, playRoundTransition,
  playVictory, playWhistle, playVuvuzela, playCountdown, playGo,
} from '@/lib/sounds';
import { hapticTap, hapticError } from '@/lib/haptics';
import { fireGoldBurst, fireRedBurst, fireCelebration, fireDistanceReveal } from '@/lib/confetti';
import { fireScoreFly, fireMultiplierFeedback, fireRoundFlash } from '@/lib/juiceAnimations';
import { playComboFeedback, resetComboJuice } from '@/lib/comboJuice';
import ComboFx, { useComboFx } from './ComboFx';
import { haversineDistance, addGameHistory, getGameHistory } from '@/lib/gameUtils';
import { COMBO_LEVELS, comboLevelOf, SCORING_VERSION } from '@/lib/scoring';
import FinalResultScreen from './FinalResultScreen';
import Wordmark from '@/components/ui/Wordmark';
import { saveGameResult } from '@/lib/gameResults';
import { consumeLife, addLives } from '@/lib/energySystem';
import { useGameLayoutMode, useIsPortraitMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import { announce } from './ScreenReaderAnnouncer';
import WorldMapCanvas from './WorldMapCanvas';
import CountUp from '@/components/ui/CountUp';
import CountdownIntro from './CountdownIntro';
import RotateOverlay from './RotateOverlay';
import Mascot, { type MascotState } from './Mascot';
import RoundFeedbackCard from './RoundFeedbackCard';
import { HudIconButton, InGameSettings } from './GameHud';
import { type RoundResult, ClockIcon, BarsIcon, PinIcon } from './GameScreen';
import FitToBox from '@/components/ui/FitToBox';
import { frameAnswer, feedbackCover, PIN_LEGEND_CORNER } from '@/lib/mapFraming';
import { countryDisplayName, countryIso } from '@/lib/flags';
import { preloadCountryPhoto } from '@/lib/countryPhotos';
import { appNumberLocale } from '@/lib/format';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
/** Igual que el Clásico: primero se ve el trazo sobre el mapa y luego la tarjeta de respuesta. */
const LINE_VIEW_MS = 3200;
/** Con el anuncio "¡al otro lado del mundo!" (respuestas muy lejanas) un poco más. */
const LINE_VIEW_EPIC_MS = 6200;
const AUTO_ADVANCE_SECONDS = 3;
const WC_MODE = 'mundial';

/** Ronda de Mundial con lo necesario para guardarla en servidor (F1): jugador, país y clic. */
type WCRound = WorldRoundResult & { player: string; country: string; clickLat: number; clickLon: number; timeExact: number };
/** Balón de fútbol: pin del mapa e ícono del modo. */
const BALL = '⚽';

type Stage = 'select' | 'countdown' | 'playing' | 'over';

interface WorldChallengeScreenProps {
  /** Volver al home. */
  onExit: () => void;
  /** Sin vidas: el padre muestra el modal y saca al usuario. */
  onNoLives: () => void;
  musicMuted?: boolean;
  onToggleMusic?: () => void;
}

/** Lo que muestra la tarjeta además de la ronda en forma de Clásico. */
interface WCFeedback {
  band: TerritoryBand;
  player: string;
  tappedCountry: string | null;
}

/** Color de la frase por banda (paleta de marca, como la tarjeta del Clásico). */
const BAND_PHRASE_COLOR: Record<TerritoryBand, string> = {
  exact: 'text-accent', neighbor: 'text-accent', continent: 'text-primary', far: 'text-destructive', ocean: 'text-destructive',
};
const BAND_EMOJI: Record<TerritoryBand, string> = {
  exact: '⚽', neighbor: '🥅', continent: '🧤', far: '🟨', ocean: '🟥',
};
const BAND_I18N: Record<TerritoryBand, string> = {
  exact: 'wc_band_exact', neighbor: 'wc_band_neighbor', continent: 'wc_band_continent',
  far: 'wc_band_far', ocean: 'wc_band_ocean',
};
const WC_DIFF_KEY: Record<Difficulty, string> = {
  basic: 'wc_diff_basic', easy: 'wc_diff_easy', medium: 'wc_diff_medium', hard: 'wc_diff_hard',
};
const WC_DIFF_DESC: Record<Difficulty, string> = {
  basic: 'wc_diffDesc_basic', easy: 'wc_diffDesc_easy', medium: 'wc_diffDesc_medium', hard: 'wc_diffDesc_hard',
};
/** Arte de cada nivel: banca (suplente), camiseta (titular), estrella (crack), trofeo (balón de oro). */
const WC_DIFF_ART: Record<Difficulty, string> = { basic: '🪑', easy: '👕', medium: '⭐', hard: '🏆' };

function streakKey(streak: number): string | null {
  if (streak >= 7) return 'wc_streak_7';
  if (streak >= 5) return 'wc_streak_5';
  if (streak >= 3) return 'wc_streak_3';
  if (streak >= 2) return 'wc_streak_2';
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Desafío Mundial (dado un futbolista, toca su país). Comparte el lenguaje visual del Clásico:
 * aviso de girar y cuenta regresiva compartidos, barra lateral en tarjetas (computador/tablet) o
 * encabezado compacto (teléfono en horizontal), engranaje que pausa, y la misma tarjeta de respuesta
 * (RoundFeedbackCard) con foto del país, mascota, "Ver cálculo" y SIGUIENTE.
 */
export default function WorldChallengeScreen({ onExit, onNoLives, musicMuted, onToggleMusic }: WorldChallengeScreenProps) {
  const { t, locale } = useI18n();
  const isPortraitMobile = useIsPortraitMobile();
  const layoutMode = useGameLayoutMode();
  const isCompact = layoutMode === 'compact';
  const isWide = layoutMode === 'wide';
  const hasSidebar = !isCompact;
  const intlLocale = locale === 'en' ? 'en' : 'es';
  const cname = useCallback((c: string | null | undefined) => countryDisplayName(c, intlLocale), [intlLocale]);

  const [stage, setStage] = useState<Stage>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [roster, setRoster] = useState<Player[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [scorePop, setScorePop] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [countdown, setCountdown] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userClick, setUserClick] = useState<{ lat: number; lon: number } | null>(null);
  const [correctLoc, setCorrectLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  // Ronda recién respondida (forma del Clásico) + datos propios del Mundial para la tarjeta
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [lastFb, setLastFb] = useState<WCFeedback | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(AUTO_ADVANCE_SECONDS);
  const [endReason, setEndReason] = useState<'complete' | 'timeout'>('complete');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [failShake, setFailShake] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);
  // Engranaje: mientras los ajustes están abiertos la ronda queda en pausa (como el Clásico)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);
  settingsOpenRef.current = settingsOpen;
  useEffect(() => { setMascotState('idle'); }, [roundIdx]);

  const roundStartRef = useRef(0);
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const resultsRef = useRef<WCRound[]>([]);
  const scoreRef = useRef(0);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const clickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);
  /** Mejor puntaje previo de Mundial (del historial local) para detectar récord en el cierre */
  const prevBestRef = useRef(0);
  // Juice del combo (puntaje v2): mismos efectos que el Clásico; el Mundial conserva sus sonidos de fútbol
  const [comboHit, setComboHit] = useState(0);
  const { fxClass, fire: fireComboFx } = useComboFx();
  useEffect(() => { resetComboJuice(); return () => resetComboJuice(); }, []);
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [mapArea, setMapArea] = useState({ w: 0, h: 0 });

  const current = roster[roundIdx];
  const showStreak = streak >= 2;
  // Puntaje v2: multiplicador del combo actual (×1,2 desde 2 aciertos exactos seguidos)
  const comboMultNow = COMBO_LEVELS[comboLevelOf(streak)].tenths / 10;
  const topStreakName = streakKey(streak);
  const diffLabel = t(WC_DIFF_KEY[difficulty] as never);

  const startGame = useCallback((d: Difficulty) => {
    // Cada partida consume una vida (igual que los demás modos)
    if (!consumeLife()) { onNoLives(); return; }
    const pool = shuffle(getPlayersByDifficulty(d)).slice(0, TOTAL_ROUNDS);
    setRoster(pool);
    setRoundIdx(0);
    setScore(0);
    setStreak(0);
    scoreRef.current = 0;
    resultsRef.current = [];
    setUserClick(null);
    setCorrectLoc(null);
    setDistanceKm(null);
    setLastRound(null);
    setLastFb(null);
    setShowPopup(false);
    setIsAnimating(false);
    setCountdown(3);
    setStage('countdown');
  }, [onNoLives]);

  // Cancelar en la cuenta regresiva o en el aviso de girar: la partida no empezó → se devuelve la vida
  const cancelCountdown = useCallback(() => {
    addLives(1);
    setStage('select');
  }, []);

  // Cuenta regresiva 3-2-1-¡YA! + silbato; espera mientras el teléfono está en vertical (maqueta Girar)
  useEffect(() => {
    if (stage !== 'countdown' || isPortraitMobile) return;
    if (countdown <= 0) {
      const id = setTimeout(() => setStage('playing'), 700); // muestra "¡YA!" un momento
      return () => clearTimeout(id);
    }
    if (countdown === 1) { playGo(); playWhistle(); }
    else playCountdown();
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, countdown, isPortraitMobile]);

  // La app en segundo plano también pausa la ronda
  useEffect(() => {
    const onVisibility = () => setIsPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // El tiempo en pausa (vertical, segundo plano, ajustes) no cuenta para el multiplicador de velocidad
  useEffect(() => {
    const paused = isPortraitMobile || isPageHidden || settingsOpen;
    if (paused && pauseStartRef.current == null) pauseStartRef.current = Date.now();
    if (!paused && pauseStartRef.current != null) { pausedMsRef.current += Date.now() - pauseStartRef.current; pauseStartRef.current = null; }
  }, [isPortraitMobile, isPageHidden, settingsOpen]);

  useEffect(() => {
    if (stage !== 'playing') return;
    setTimeLeft(MAX_TIME);
    roundStartRef.current = Date.now();
    pausedMsRef.current = 0;
    pauseStartRef.current = (isPortraitMobile || document.hidden || settingsOpenRef.current) ? Date.now() : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, roundIdx]);

  // La foto del país se descarga mientras el jugador piensa: la tarjeta la muestra sin esperar
  useEffect(() => { if (current) preloadCountryPhoto(current.country, 'sm'); }, [current]);

  // Tamaño del área del mapa (encuadre de la respuesta junto a la tarjeta)
  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setMapArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage]);

  const finishGame = useCallback((reason: 'complete' | 'timeout', finalScore: number) => {
    clearInterval(timerRef.current);
    setEndReason(reason);
    // El sonido de cierre (victoria / game over) lo pone FinalResultScreen
    const rounds = resultsRef.current;
    const exactCount = rounds.filter((r) => r.band === 'exact').length;
    // Las estadísticas (sin distancias) las actualiza el cierre unificado (FinalResultScreen)
    prevBestRef.current = Math.max(0, ...getGameHistory().filter((h) => h.mode === WC_MODE && h.v === SCORING_VERSION).map((h) => h.score));
    addGameHistory({
      date: new Date().toISOString(),
      score: finalScore,
      rounds: rounds.length,
      difficulty,
      mode: WC_MODE,
      avgDistance: exactCount,
      type: 'classic',
    });
    // F1: partida de Mundial en servidor (jugador como "ciudad", país correcto, banda y país tocado en extra)
    saveGameResult({
      gameType: 'mundial',
      mode: WC_MODE,
      difficulty,
      score: finalScore,
      roundsPlayed: rounds.length,
      roundsTotal: roster.length || rounds.length,
      avgDistanceKm: null,
      endReason: reason,
      rounds: rounds.map((r, i) => ({
        round_no: i + 1,
        city_name: r.player,
        city_country: r.country,
        click_lat: r.clickLat,
        click_lon: r.clickLon,
        time_s: r.timeExact ?? r.timeUsed,
        base_points: r.basePoints,
        multiplier: r.multiplier,
        points: r.totalPoints,
        extra: { band: r.band, tapped: r.tappedCountry, combo: r.newStreak, combo_mult: r.comboMult },
      })),
    });
    setStage('over');
  }, [difficulty, roster.length]);

  const handleTimeout = useCallback(() => {
    if (stage !== 'playing') return;
    playTimeExpired();
    playWhistle();
    hapticError();
    finishGame('timeout', scoreRef.current);
  }, [stage, finishGame]);

  // Reloj de la ronda: se detiene al responder, en vertical, en segundo plano y con los ajustes abiertos
  useEffect(() => {
    if (stage !== 'playing' || isAnimating || isPortraitMobile || settingsOpen || isPageHidden) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => handleTimeout(), 0); // fuera del updater de setState
          return 0;
        }
        if (tl <= 6) { playTick(); }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, isAnimating, roundIdx, isPortraitMobile, settingsOpen, isPageHidden]);

  const handleMapClick = useCallback((lat: number, lon: number, vx?: number, vy?: number) => {
    if (stage !== 'playing' || isAnimating || !current) return;
    clearInterval(timerRef.current);
    playClick();
    hapticTap();
    const from = (vx != null && vy != null) ? { x: vx, y: vy } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    clickViewportRef.current = from;

    const pausedNow = pauseStartRef.current != null ? Date.now() - pauseStartRef.current : 0;
    const elapsedMs = Math.max(0, Date.now() - roundStartRef.current - pausedMsRef.current - pausedNow);
    const timeUsed = Math.min(MAX_TIME, Math.round(elapsedMs / 1000));
    const timeExact = Math.min(MAX_TIME, Math.round(elapsedMs / 100) / 10);
    // Puntaje v2: el tiempo se puntúa en décimas (timeExact), igual que en el servidor
    const prevLevel = comboLevelOf(streak);
    const res = scoreWorldRound(current.country, lat, lon, timeExact, streak);
    playComboFeedback({ quality: res.quality, comboLevel: res.comboLevel, broke: res.brokeCombo }, prevLevel, { ding: false });
    fireComboFx(res.comboLevel, res.brokeCombo, res.quality !== 'miss');
    if (res.quality !== 'miss' && res.comboLevel >= 2) setComboHit((h) => h + 1);
    resultsRef.current.push({ ...res, player: current.name, country: current.country, clickLat: lat, clickLon: lon, timeExact });
    const mult = { value: res.multiplier };
    const centroid = getCountryCentroid(current.country);
    const dist = centroid ? haversineDistance(lat, lon, centroid.lat, centroid.lon) : null;

    const newScore = scoreRef.current + res.totalPoints;
    scoreRef.current = newScore;
    setScore(newScore);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 600);
    setStreak(res.newStreak);
    // Exacto o racha → salta · vecino → alegre · mismo continente → confundido · otro continente →
    // triste · océano → sorprendido
    setMascotState(
      res.band === 'exact' || (res.newStreak >= 3 && res.band === 'neighbor') ? 'cheer'
        : res.band === 'neighbor' ? 'happy'
        : res.band === 'continent' ? 'confused'
        : res.band === 'far' ? 'down'
        : 'surprised'
    );
    setUserClick({ lat, lon });
    setCorrectLoc(centroid);
    setDistanceKm(dist);
    // Ronda en forma del Clásico para la tarjeta: la "ciudad" es el país correcto (foto y bandera)
    const city: City = { name: current.country, country: current.country, lat: centroid?.lat ?? lat, lon: centroid?.lon ?? lon, difficulty };
    setLastRound({
      city, clickLat: lat, clickLon: lon, distance: dist ?? 0, basePoints: res.basePoints, multiplier: res.multiplier, totalPoints: res.totalPoints, timeUsed, timeExact,
      combo: res.newStreak, comboMult: res.comboMult, comboLevel: res.comboLevel, quality: res.quality, diffMult: 1, brokeCombo: res.brokeCombo,
    });
    setLastFb({ band: res.band, player: current.name, tappedCountry: res.tappedCountry });
    setIsAnimating(true);

    if (res.band === 'exact') {
      playVictory(); playVuvuzela();
      fireCelebration(from);
    } else if (res.band === 'neighbor') {
      playGood();
      fireGoldBurst(from);
    } else if (res.band === 'continent') {
      if (!res.brokeCombo) { playMedium(); hapticTap(); }
    } else {
      // Si rompió un combo ya sonó la campana descendente suave (nunca un buzzer)
      if (!res.brokeCombo) { playBad(); hapticError(); setFailShake(true); setTimeout(() => setFailShake(false), 450); }
      fireRedBurst(from);
    }

    // Los puntos vuelan al marcador (barra lateral o encabezado)
    if (res.totalPoints > 0 && scoreElRef.current) {
      const r = scoreElRef.current.getBoundingClientRect();
      const scoreTo = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      setTimeout(() => fireScoreFly(res.totalPoints, from, scoreTo), 300);
    }
    if (mult.value >= 1.5) {
      setTimeout(() => fireMultiplierFeedback(mult.value, res.newStreak, from), 150);
    }
    if ((res.band === 'far' || res.band === 'ocean') && dist != null && dist >= 4000) {
      setTimeout(() => fireDistanceReveal(dist, t('reveal_otherSide')), 420);
    }

    announce(t('sr_worldChallengeResult', {
      player: current.name,
      country: cname(current.country),
      band: t(BAND_I18N[res.band] as never),
      points: res.totalPoints,
      round: roundIdx + 1,
      total: roster.length,
    }));
  }, [stage, isAnimating, current, streak, roundIdx, roster.length, difficulty, t, cname]);

  // Primero el trazo sobre el mapa; después la tarjeta (como el Clásico)
  useEffect(() => {
    if (!isAnimating || !lastRound || !lastFb) return;
    const epic = (lastFb.band === 'far' || lastFb.band === 'ocean') && lastRound.distance >= 4000;
    const id = setTimeout(() => setShowPopup(true), epic ? LINE_VIEW_EPIC_MS : LINE_VIEW_MS);
    return () => clearTimeout(id);
  }, [isAnimating, lastRound, lastFb]);

  // Siguiente jugador (SIGUIENTE o al terminar la cuenta de la tarjeta)
  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    if (!lastRound || !lastFb) return;
    const isLast = roundIdx + 1 >= roster.length;
    if (!isLast) fireRoundFlash(lastRound.totalPoints, `${BALL} ${lastFb.player}`, lastFb.band === 'exact' || lastFb.band === 'neighbor');
    setShowPopup(false);
    setLastRound(null);
    setLastFb(null);
    setUserClick(null);
    setCorrectLoc(null);
    setDistanceKm(null);
    setIsAnimating(false);
    if (isLast) finishGame('complete', scoreRef.current);
    else { setRoundIdx((i) => i + 1); playRoundTransition(); }
  };
  const advance = useCallback(() => advanceRef.current(), []);

  useEffect(() => {
    if (!showPopup) return;
    setAutoAdvance(AUTO_ADVANCE_SECONDS);
    const id = setInterval(() => {
      setAutoAdvance((prev) => {
        if (settingsOpenRef.current) return prev; // en pausa con los ajustes abiertos
        if (prev <= 1) {
          clearInterval(id);
          setTimeout(() => advanceRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showPopup]);

  // Encuadre de la respuesta: el mapa deja libre lo que tapa la tarjeta (como el Clásico)
  const cover = useMemo(
    () => (showPopup && lastRound && mapArea.w > 0 ? feedbackCover(isPortraitMobile ? 'portrait' : isCompact ? 'compact' : isWide ? 'wide' : 'medium', mapArea.w) : null),
    [showPopup, lastRound, mapArea.w, isPortraitMobile, isCompact, isWide],
  );
  const feedbackBounds = useMemo(() => {
    if (!cover || !lastRound) return null;
    return frameAnswer(
      { lat: lastRound.clickLat, lon: lastRound.clickLon },
      { lat: lastRound.city.lat, lon: lastRound.city.lon },
      mapArea.w, mapArea.h, cover, getMapBounds('world'),
    );
  }, [cover, lastRound, mapArea.w, mapArea.h]);
  const labelAvoid = useMemo(() => (cover ? { ...cover, corner: PIN_LEGEND_CORNER } : null), [cover]);
  const pinFx = useMemo(() => (lastRound && lastRound.quality !== 'miss' ? { level: lastRound.comboLevel ?? 0 } : null), [lastRound]);

  const pinLabels = useMemo(
    () => ({ you: t('game_yourAnswer'), correct: lastRound ? cname(lastRound.city.country) : t('wc_correctCountry') }),
    [t, lastRound, cname],
  );

  // ───────────────────────── RENDER ─────────────────────────

  // Aviso de girar compartido (maqueta Girar): en la cuenta regresiva y en la partida
  const rotate = isPortraitMobile && (stage === 'countdown' || stage === 'playing')
    ? <RotateOverlay t={t as (k: string) => string} beforeCountdown={stage === 'countdown'} onBack={stage === 'countdown' ? cancelCountdown : onExit} />
    : null;

  if (stage === 'select') {
    const title = t('wc_modeName');
    const cut = title.lastIndexOf(' ');
    return (
      <div className="modal-layer z-50 game-bg">
        <div className="modal-panel w-full max-w-lg rounded-3xl border-2 border-accent/50 bg-card/95 backdrop-blur-md p-5 sm:p-7 short:p-4 shadow-2xl text-center animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="relative shrink-0">
              <Mascot state="cheer" className="w-16 sm:w-20 short:w-12 drop-shadow-[0_8px_18px_hsl(var(--brand-navy-deep)/0.6)]" />
              <span className="absolute -right-2 bottom-0 text-2xl short:text-xl" aria-hidden>{BALL}</span>
            </span>
            <span className="text-left min-w-0">
              <h2 className="text-3xl sm:text-4xl short:text-2xl font-extrabold leading-tight">
                {cut > 0 ? <>{title.slice(0, cut)} <span className="text-primary">{title.slice(cut + 1)}</span></> : <span className="text-primary">{title}</span>}
              </h2>
              <p className="text-sm short:text-xs text-brand-sky font-semibold">{t('wc_tagline')}</p>
            </span>
          </div>

          <p className="mt-5 short:mt-3 mb-2 text-xs font-bold uppercase tracking-widest text-foreground/70">{t('wc_selectDifficulty')}</p>
          <div className="grid grid-cols-2 gap-2 short:gap-1.5" role="radiogroup" aria-label={t('wc_selectDifficulty')}>
            {(['basic', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  role="radio"
                  aria-checked={active}
                  onClick={() => { playButtonTap(); setDifficulty(d); }}
                  className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 short:py-1.5 text-left transition-all active:scale-[0.98] ${
                    active ? 'border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.25)]' : 'border-accent/30 bg-background/40 hover:border-accent/60'
                  }`}
                >
                  <span className="text-2xl short:text-xl shrink-0" aria-hidden>{WC_DIFF_ART[d]}</span>
                  <span className="min-w-0 leading-tight">
                    <span className={`block font-extrabold ${active ? 'text-primary' : ''}`}>{t(WC_DIFF_KEY[d] as never)}</span>
                    <span className="block text-[11px] text-foreground/65">{t(WC_DIFF_DESC[d] as never)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 short:mt-2 text-xs text-foreground/70">{t('wc_rules')}</p>

          <div className="mt-4 short:mt-3 flex gap-2 sm:gap-3">
            <button onClick={onExit} className="flex-1 rounded-2xl border-2 border-accent/40 bg-background/40 py-3 short:py-2 font-bold text-sm hover:bg-muted/40 transition-colors active:scale-[0.97]">
              {t('back')}
            </button>
            <button
              onClick={() => { playButtonTap(); startGame(difficulty); }}
              className="btn3d flex-[1.5] rounded-2xl py-3 short:py-2 font-black text-primary-foreground tracking-wide"
              style={{ background: 'var(--grad-cta)' }}
            >
              {t('wc_start')} {BALL}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'countdown') {
    return (
      <>
        <CountdownIntro
          count={countdown}
          label={`${BALL} ${t('wc_modeName')} · ${diffLabel}`}
          onCancel={cancelCountdown}
          running={!isPortraitMobile}
        />
        {rotate}
      </>
    );
  }

  if (stage === 'over') {
    const rounds = resultsRef.current;
    const exactCount = rounds.filter((r) => r.band === 'exact').length;
    // Rondas de Mundial en la forma del Clásico: "ciudad" = jugador, coordenadas = centroide del país.
    // El país se muestra en el idioma del juego si conserva su bandera (si no, el nombre original).
    const asRounds = rounds.map((r) => {
      const c = getCountryCentroid(r.country);
      const dist = c ? haversineDistance(r.clickLat, r.clickLon, c.lat, c.lon) : 0;
      const local = cname(r.country);
      const country = countryIso(local) === countryIso(r.country) ? local : r.country;
      const city: City = { name: `${BALL} ${r.player}`, country, lat: c?.lat ?? 0, lon: c?.lon ?? 0, difficulty };
      return { city, clickLat: r.clickLat, clickLon: r.clickLon, distance: dist, basePoints: r.basePoints, multiplier: r.multiplier, totalPoints: r.totalPoints, timeUsed: r.timeUsed, timeExact: r.timeExact };
    });
    return (
      <FinalResultScreen
        variant="mundial"
        musicMuted={musicMuted}
        onToggleMusic={onToggleMusic}
        rounds={asRounds}
        totalScore={score}
        difficulty={difficulty}
        mode={WC_MODE}
        reason={endReason}
        totalRounds={TOTAL_ROUNDS}
        previousBestOverride={prevBestRef.current}
        countDistancesInStats={false}
        tiles={[
          { emoji: BALL, label: t('final_exact'), value: `${exactCount} / ${rounds.length}` },
          { emoji: '🏁', label: t('final_rounds'), value: `${rounds.length} / ${TOTAL_ROUNDS}` },
        ]}
        onNewGame={() => { playButtonTap(); setStage('select'); }}
        onGoHome={onExit}
      />
    );
  }

  // stage === 'playing'
  const confirmExit = () => { if (window.confirm(t('game_exitConfirm'))) onExit(); };
  const isTouchDevice = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
  const isTimerCritical = timeLeft <= 3 && !isAnimating;
  const isTimerUrgent = timeLeft <= 5 && !isAnimating;
  const fmtSecs = (s: number) => s.toLocaleString(appNumberLocale(), { maximumFractionDigits: 1 });
  const layoutClass = isCompact || isPortraitMobile
    ? 'flex flex-col'
    : isWide
      ? 'grid grid-cols-[clamp(13rem,22vw,21rem)_minmax(0,1fr)]'
      : 'grid grid-cols-[clamp(13rem,24vw,21rem)_minmax(0,1fr)]';
  const eraLabel = current?.era ? t(`wc_era_${current.era}` as never) : '';

  const cardProps = lastRound && lastFb ? {
    result: lastRound,
    feedback: { emoji: BAND_EMOJI[lastFb.band], phrase: lastFb.band === 'exact' ? t('wc_goal') : t(BAND_I18N[lastFb.band] as never), color: BAND_PHRASE_COLOR[lastFb.band] },
    phraseColor: BAND_PHRASE_COLOR[lastFb.band],
    title: cname(lastRound.city.country),
    subtitle: lastFb.player,
    baseLabel: t('wc_calcBase'),
    firstTile: { label: t('wc_tappedLabel'), value: lastFb.tappedCountry ? cname(lastFb.tappedCountry) : t('wc_ocean') },
    mascot: mascotState,
    nearMissMsg: null,
    autoAdvanceTimer: autoAdvance,
    onNext: advance,
    timeLabel: `${fmtSecs(lastRound.timeExact ?? lastRound.timeUsed)} s`,
    natural: true,
  } : null;

  return (
    <div
      className={`fixed inset-0 z-40 h-[100dvh] min-h-0 overflow-hidden game-bg ${layoutClass} ${isTimerUrgent ? 'vignette-urgent' : ''} ${(isTimerCritical || failShake) ? 'animate-screen-shake' : ''}`}
      role="main"
      aria-label={t('wc_modeName')}
      data-game-container
    >
      {rotate}

      {/* ──── Barra lateral (computador / tablet) — mismas tarjetas que el Clásico ──── */}
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
              {BALL} <span className="text-primary">{t('wc_modeName')}</span><span className="text-accent mx-[2cqi]">·</span>{diffLabel}
            </span>
          </div>

          {/* ¿De qué país es? */}
          <div className="w-full shrink-0 rounded-2xl border-2 border-accent/50 bg-background/40 px-[5cqi] py-[5.5cqi] text-center">
            <p className="text-[8.6cqi] font-bold leading-none mb-[2.5cqi]" id="wc-player-label">{t('wc_whichCountry')}</p>
            <p
              className="text-[13cqi] font-extrabold leading-tight"
              style={{ color: 'hsl(var(--primary))', wordBreak: 'break-word', hyphens: 'none', textShadow: '0 2px 10px hsl(var(--primary) / 0.25)' }}
              aria-labelledby="wc-player-label"
            >
              {current?.name}
            </p>
            {eraLabel && (
              <span className="mt-[2.5cqi] inline-block rounded-full border border-accent/40 px-[4cqi] py-[0.8cqi] text-[6.4cqi] font-semibold text-foreground/80">{eraLabel}</span>
            )}
          </div>

          {/* Reloj de la ronda · en la respuesta, el tiempo que tardaste */}
          {isAnimating && lastRound ? (
            <div className="flex items-center gap-[4cqi] px-[2cqi] shrink-0">
              <ClockIcon className="w-[11cqi] h-[11cqi] text-accent shrink-0" />
              <span className="leading-tight">
                <span className="block text-[6.6cqi] text-muted-foreground">{t('game_answerTime')}</span>
                <span className="block text-[9.5cqi] font-bold">{fmtSecs(lastRound.timeExact ?? lastRound.timeUsed)} s</span>
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
                    width: `${(timeLeft / MAX_TIME) * 100}%`,
                    background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))',
                    boxShadow: timeLeft <= 5 ? 'none' : '0 0 10px hsl(var(--accent) / 0.6)',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>
          )}

          {/* PUNTOS */}
          <div className="w-full shrink-0 rounded-2xl border-2 border-accent/30 bg-background/40 px-[5cqi] py-[3.5cqi] flex items-center gap-[4.5cqi]">
            <span className="text-[12cqi] leading-none" aria-hidden>⭐</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide">{t('game_points')}</span>
              <span ref={scoreElRef} className={`block text-[11.5cqi] font-extrabold text-primary leading-none ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite">
                <CountUp value={score} />
              </span>
            </span>
          </div>

          {/* RONDA */}
          <div className="w-full shrink-0 rounded-2xl border-2 border-accent/30 bg-background/40 px-[5cqi] py-[3.5cqi] flex items-center gap-[4.5cqi]">
            <BarsIcon className="w-[11cqi] h-[11cqi] text-accent shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide">{t('game_round')}</span>
              <span className="block text-[10.5cqi] font-extrabold leading-none">
                <span className="text-primary">{roundIdx + 1}</span> / {roster.length}
              </span>
            </span>
          </div>

          {/* Racha (doblete, hat-trick…) */}
          {showStreak && (
            <div className="w-full shrink-0 rounded-2xl border-2 border-primary/40 bg-background/40 px-[5cqi] py-[3cqi] flex items-center gap-[3.5cqi] animate-score-pop">
              <span className="text-[11cqi] leading-none" aria-hidden>🔥</span>
              <span className="text-[7cqi] font-bold leading-tight">
                <span className="text-primary text-[9.5cqi] font-extrabold">{streak}</span>
                {topStreakName && <span className="ml-1">{t(topStreakName as never)}</span>}
                {comboMultNow > 1 && <span className="ml-1 text-accent">×{comboMultNow.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Encabezado compacto (teléfono en horizontal) — maqueta Partida_Movil ── */}
      {!hasSidebar && (
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
                {BALL} {t('wc_whichCountry')} <span className="text-primary">{current?.name}</span>
                {eraLabel && <span className="text-muted-foreground font-semibold"> · {eraLabel}</span>}
              </div>
            </div>
            {onToggleMusic && <HudIconButton size="sm" icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton size="sm" icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            <HudIconButton size="sm" icon="close" label={t('game_exit')} onClick={confirmExit} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span className="hidden min-[560px]:inline rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              {BALL} <span className="text-primary">{t('wc_modeName')}</span> · {diffLabel}
            </span>
            <span className="rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              {t('game_round')} <span className="text-primary">{roundIdx + 1}</span><span className="text-muted-foreground"> / {roster.length}</span>
            </span>
            <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border border-accent/40 backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              <span className={`font-mono whitespace-nowrap ${isTimerCritical ? 'text-destructive animate-pulse' : isTimerUrgent ? 'text-destructive' : ''}`}>⏱ {timeLeft} s</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(timeLeft / MAX_TIME) * 100}%`, background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))', transition: isAnimating ? 'none' : 'width 200ms linear' }} />
              </div>
            </div>
            <span className="rounded-full px-2 py-0.5 border border-primary/50 backdrop-blur-md whitespace-nowrap font-mono" style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }}>
              ⭐ <span ref={scoreElRef} className={`text-primary font-black ${scorePop ? 'animate-score-pop' : ''}`} aria-live="polite"><CountUp value={score} /></span> pts
            </span>
          </div>
        </div>
      )}

      {/* ──── Mapa: el mismo de los demás modos (JuanJo quitó el verde de cancha y la decoración del Pacífico) ──── */}
      <div ref={mapAreaRef} className={`relative w-full ${hasSidebar ? 'h-full' : 'flex-1 min-h-0'} min-w-0 overflow-hidden ${fxClass}`}>
        <ComboFx level={comboLevelOf(streak)} hit={comboHit} active={!isAnimating} />
        {/* Sonido · ajustes · salir (con barra lateral) */}
        {hasSidebar && (
          <div className="absolute z-20 flex items-center gap-2.5" style={{ top: 'max(0.75rem, var(--sat))', right: 'max(0.75rem, var(--sar))' }}>
            {onToggleMusic && <HudIconButton icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} />}
            <HudIconButton icon="gear" label={t('settings_title')} onClick={() => setSettingsOpen(true)} />
            <HudIconButton icon="close" label={t('game_exit')} onClick={confirmExit} />
          </div>
        )}

        {/* Racha (teléfono): abajo a la izquierda */}
        {!hasSidebar && showStreak && !isAnimating && (
          <div className="absolute z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))', left: 'max(0.5rem, var(--sal))' }}>
            <span className="rounded-full px-3 py-1.5 text-xs font-bold border-2 border-accent/40 backdrop-blur-md animate-score-pop" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
              🔥 <span className="text-primary">{streak}</span>{topStreakName && <> {t(topStreakName as never)}</>}{comboMultNow > 1 && <span className="text-accent"> ×{comboMultNow.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO')}</span>}
            </span>
          </div>
        )}

        {/* "Toca el mapa para responder" */}
        {!isAnimating && (
          <div className="absolute left-1/2 -translate-x-1/2 z-[6] pointer-events-none" style={{ bottom: 'max(0.5rem, var(--sab))' }}>
            <span className="rounded-full px-4 py-1.5 short:py-1 text-xs sm:text-sm font-semibold border border-border/60 backdrop-blur-md whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
              {isTouchDevice ? t('game_tapToAnswer') : t('game_clickToAnswer')}
            </span>
          </div>
        )}

        {/* Leyenda de pines durante la respuesta */}
        {showPopup && lastRound && (
          <div className="absolute z-[6] pointer-events-none rounded-xl border border-accent/40 px-3 py-2 short:py-1 backdrop-blur-md text-xs short:text-[11px] font-semibold flex flex-col gap-1 short:gap-0.5" style={{ bottom: 'max(0.75rem, var(--sab))', left: 'max(0.75rem, var(--sal))', background: 'hsl(var(--brand-navy-deep) / 0.85)' }}>
            <span className="flex items-center gap-2"><PinIcon color="hsl(var(--accent))" />{t('wc_correctCountry')}</span>
            <span className="flex items-center gap-2"><span className="w-4 text-center text-sm leading-none" aria-hidden>{BALL}</span>{t('game_yourAnswer')}</span>
          </div>
        )}

        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={isAnimating}
          userClick={userClick}
          correctLocation={correctLoc}
          distanceKm={distanceKm}
          gameMode="world"
          highlightContinent={!isAnimating && current ? (COUNTRY_CONTINENT[current.country] ?? null) : null}
          pinEmoji={BALL}
          pinLabels={pinLabels}
          showZoomControls={!isAnimating}
          viewBounds={feedbackBounds}
          labelAvoid={labelAvoid}
          pinFx={pinFx}
        />

        {/* Tarjeta de respuesta — la misma del Clásico */}
        {showPopup && cardProps && (isWide ? (
          <div className="absolute inset-y-0 right-0 z-10 w-[clamp(24rem,36vw,32rem)] flex items-center animate-slide-in-right p-3 lg:p-4" role="dialog" aria-label={t('game_resultLabel')}>
            <FitToBox center origin="center right"><RoundFeedbackCard {...cardProps} size="lg" /></FitToBox>
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
              <RoundFeedbackCard {...cardProps} size="md" />
            </FitToBox>
          </div>
        ))}
      </div>

      {settingsOpen && <InGameSettings musicMuted={musicMuted} onToggleMusic={onToggleMusic} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
