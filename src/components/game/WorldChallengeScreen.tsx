import { useState, useEffect, useCallback, useRef } from 'react';
import type { City, Difficulty } from '@/data/cities';
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
  playTick, playTimeExpired, playButtonTap,
  playVictory, playStreak, playWhistle, playVuvuzela, playCountdown, playGo,
} from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticCelebration } from '@/lib/haptics';
import { fireGoldBurst, fireRedBurst, fireCelebration, fireDistanceReveal } from '@/lib/confetti';
import { fireScoreFly, fireMultiplierFeedback, fireStreakBorder, fireRoundFlash } from '@/lib/juiceAnimations';
import { getMultiplier, haversineDistance, formatDistance, addGameHistory, getGameHistory } from '@/lib/gameUtils';
import FinalResultScreen from './FinalResultScreen';
import Wordmark from '@/components/ui/Wordmark';
import { saveGameResult } from '@/lib/gameResults';
import { consumeLife } from '@/lib/energySystem';
import { useIsPortraitMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import { announce } from './ScreenReaderAnnouncer';
import WorldMapCanvas from './WorldMapCanvas';
import Button3D from '@/components/ui/Button3D';
import CountUp from '@/components/ui/CountUp';
import CountdownIntro from './CountdownIntro';
import Mascot, { type MascotState } from './Mascot';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const FEEDBACK_MS = 3200;
const WC_MODE = 'mundial';

/** Ronda de Mundial con lo necesario para guardarla en servidor (F1): jugador, país y clic. */
type WCRound = WorldRoundResult & { player: string; country: string; clickLat: number; clickLon: number };
/** Balón de fútbol: pin del mapa e ícono de la mayoría de los mensajes del modo. */
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

interface Feedback {
  band: TerritoryBand;
  correctCountry: string;
  tappedCountry: string | null;
  points: number;
  basePoints: number;
  multLabel: string;
  multEmoji: string;
  timeUsed: number;
  distanceKm: number | null;
  streak: number;
}

const BAND_COLOR: Record<TerritoryBand, string> = {
  exact: 'text-green-400',
  neighbor: 'text-emerald-400',
  continent: 'text-yellow-400',
  far: 'text-orange-400',
  ocean: 'text-red-500',
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

export default function WorldChallengeScreen({ onExit, onNoLives, musicMuted, onToggleMusic }: WorldChallengeScreenProps) {
  const { t } = useI18n();
  const isPortraitMobile = useIsPortraitMobile();

  const [stage, setStage] = useState<Stage>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [roster, setRoster] = useState<Player[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [countdown, setCountdown] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userClick, setUserClick] = useState<{ lat: number; lon: number } | null>(null);
  const [correctLoc, setCorrectLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [endReason, setEndReason] = useState<'complete' | 'timeout'>('complete');
  // Al entrar a Mundial: a veces balón ⚽, a veces copa 🏆 en el Pacífico
  const [pacificDecor, setPacificDecor] = useState<'ball' | 'trophy'>(() => (Math.random() < 0.5 ? 'trophy' : 'ball'));
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [failShake, setFailShake] = useState(false);
  useEffect(() => { setMascotState('idle'); }, [roundIdx]);

  const roundStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const resultsRef = useRef<WCRound[]>([]);
  const scoreRef = useRef(0);
  const clickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);
  /** Mejor puntaje previo de Mundial (del historial local) para detectar récord en el cierre */
  const prevBestRef = useRef(0);

  const current = roster[roundIdx];
  const showStreak = streak >= 2;
  const streakPct = streak >= 2 ? Math.min(60, (streak - 1) * 10) : 0;
  const topStreakName = streakKey(streak);

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
    setFeedback(null);
    setIsAnimating(false);
    setPacificDecor(Math.random() < 0.5 ? 'trophy' : 'ball'); // re-sortea balón/copa cada partida
    setCountdown(3);
    setStage('countdown');
  }, [onNoLives]);

  // Cuenta regresiva 3-2-1-GO unificada (igual que el Clásico) + silbato de arranque
  useEffect(() => {
    if (stage !== 'countdown') return;
    if (countdown <= 0) {
      const id = setTimeout(() => setStage('playing'), 700); // muestra "GO!" un momento
      return () => clearTimeout(id);
    }
    if (countdown === 1) { playGo(); playWhistle(); }
    else playCountdown();
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, countdown, isPortraitMobile]);

  useEffect(() => {
    if (stage !== 'playing') return;
    setTimeLeft(MAX_TIME);
    roundStartRef.current = Date.now();
  }, [stage, roundIdx]);

  useEffect(() => {
    if (stage !== 'playing' || isAnimating || isPortraitMobile) return; // pausa el timer en vertical
    timerRef.current = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        if (tl <= 6) { playTick(); }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, isAnimating, roundIdx, isPortraitMobile]);

  const finishGame = useCallback((reason: 'complete' | 'timeout', finalScore: number) => {
    clearInterval(timerRef.current);
    setEndReason(reason);
    // El sonido de cierre (victoria / game over) lo pone FinalResultScreen
    const rounds = resultsRef.current;
    const exactCount = rounds.filter((r) => r.band === 'exact').length;
    // Las estadísticas (sin distancias) las actualiza el cierre unificado (FinalResultScreen)
    prevBestRef.current = Math.max(0, ...getGameHistory().filter((h) => h.mode === WC_MODE).map((h) => h.score));
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
        time_s: r.timeUsed,
        base_points: r.basePoints,
        multiplier: r.multiplier,
        points: r.totalPoints,
        extra: { band: r.band, tapped: r.tappedCountry },
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

  const handleMapClick = useCallback((lat: number, lon: number, vx?: number, vy?: number) => {
    if (stage !== 'playing' || isAnimating || !current) return;
    clearInterval(timerRef.current);
    playClick();
    hapticTap();
    const from = (vx != null && vy != null) ? { x: vx, y: vy } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    clickViewportRef.current = from;

    const timeUsed = Math.min(MAX_TIME, Math.max(0, Math.round((Date.now() - roundStartRef.current) / 1000)));
    const res = scoreWorldRound(current.country, lat, lon, timeUsed, streak);
    resultsRef.current.push({ ...res, player: current.name, country: current.country, clickLat: lat, clickLon: lon });
    const mult = getMultiplier(timeUsed);
    const centroid = getCountryCentroid(current.country);
    const dist = centroid ? haversineDistance(lat, lon, centroid.lat, centroid.lon) : null;

    const newScore = score + res.totalPoints;
    scoreRef.current = newScore;
    setScore(newScore);
    setStreak(res.newStreak);
    setMascotState(
      res.band === 'far' || res.band === 'ocean' ? 'sad'
        : res.newStreak >= 3 ? 'fire'
        : res.band === 'exact' ? 'celebrate'
        : 'wink'
    );
    setUserClick({ lat, lon });
    setCorrectLoc(centroid);
    setDistanceKm(dist);
    setFeedback({
      band: res.band,
      correctCountry: current.country,
      tappedCountry: res.tappedCountry,
      points: res.totalPoints,
      basePoints: res.basePoints,
      multLabel: mult.label,
      multEmoji: mult.emoji,
      timeUsed,
      distanceKm: dist,
      streak: res.newStreak,
    });
    setIsAnimating(true);

    const playerName = current.name;
    const scoreTo = { x: Math.min(window.innerWidth - 40, window.innerWidth * 0.9), y: 40 };

    if (res.band === 'exact') {
      playVictory(); playVuvuzela(); hapticCelebration();
      fireCelebration(from);
    } else if (res.band === 'neighbor') {
      playGood(); hapticSuccess();
      fireGoldBurst(from);
    } else if (res.band === 'continent') {
      playMedium(); hapticTap();
    } else {
      playBad(); hapticError();
      fireRedBurst(from);
      setFailShake(true); setTimeout(() => setFailShake(false), 450);
    }

    if (res.totalPoints > 0) {
      setTimeout(() => fireScoreFly(res.totalPoints, from, scoreTo), 300);
    }
    fireRoundFlash(res.totalPoints, `${BALL} ${playerName}`, res.band === 'exact' || res.band === 'neighbor');
    if (mult.value >= 1.5) {
      setTimeout(() => fireMultiplierFeedback(mult.value, res.newStreak, from), 150);
    }
    if (res.newStreak >= 2) {
      setTimeout(() => { fireStreakBorder(res.newStreak); playStreak(res.newStreak); }, 380);
    }
    if ((res.band === 'far' || res.band === 'ocean') && dist != null && dist >= 4000) {
      setTimeout(() => fireDistanceReveal(dist), 420);
    }

    announce(t('sr_worldChallengeResult', {
      player: playerName,
      country: current.country,
      band: t(BAND_I18N[res.band] as never),
      points: res.totalPoints,
      round: roundIdx + 1,
      total: roster.length,
    }));

    setTimeout(() => {
      setUserClick(null);
      setCorrectLoc(null);
      setDistanceKm(null);
      setFeedback(null);
      setIsAnimating(false);
      if (roundIdx + 1 >= roster.length) {
        finishGame('complete', newScore);
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, FEEDBACK_MS);
  }, [stage, isAnimating, current, streak, score, roundIdx, roster.length, finishGame, t]);

  // ───────────────────────── RENDER ─────────────────────────

  // Overlay de "gira el teléfono" — solo durante la cuenta regresiva y el juego (no en el panel de inicio),
  // para que el orden sea igual a los demás modos.
  const rotateOverlay = (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center game-bg text-center px-6">
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
        <Wordmark size="sm" />
      </div>
      <div className="relative w-28 h-28 mb-6" aria-hidden>
        <span className="absolute left-0 top-0 text-6xl opacity-40">📱</span>
        <span className="absolute right-0 bottom-0 text-6xl rotate-90 animate-bounce">📱</span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-accent">↻</span>
      </div>
      <p className="text-3xl sm:text-4xl font-black leading-tight">
        {t('rotate_titleLead')} <span className="text-primary">{t('rotate_titleTail')}</span>
      </p>
      <p className="text-sm text-muted-foreground mt-2">{t('rotate_sub')}</p>
      <div className="mt-6 px-5 py-3 rounded-2xl border border-accent/50 text-accent font-bold text-sm animate-pulse">{t('rotate_waiting')}</div>
      <button onClick={onExit} className="mt-8 px-6 py-2.5 rounded-2xl border border-border bg-card/50 text-sm font-bold hover:bg-muted transition-colors active:scale-[0.97]">
        {t('rotate_back')}
      </button>
    </div>
  );

  if (stage === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 overflow-y-auto game-bg">
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up my-4">
          <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
            {BALL} {t('wc_modeName')}
          </h2>
          <p className="text-muted-foreground text-[10px] sm:text-xs mb-4 sm:mb-6 italic">{t('wc_tagline')}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 uppercase tracking-widest">{t('wc_selectDifficulty')}</p>
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-4 sm:mb-6">
            {(['basic', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => { playButtonTap(); setDifficulty(d); }}
                className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-bold border-2 transition-all active:scale-[0.97] leading-tight ${
                  difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                }`}
              >
                {t(WC_DIFF_KEY[d] as never)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={onExit} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
              {t('back').toUpperCase()}
            </button>
            <Button3D
              variant="primary"
              onClick={() => { playButtonTap(); startGame(difficulty); }}
              className="flex-1 text-xs sm:text-sm"
            >
              {t('wc_start')} {BALL}
            </Button3D>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'countdown') {
    return (
      <CountdownIntro count={countdown} label={`${BALL} ${t('wc_modeName')} — ${t(WC_DIFF_KEY[difficulty] as never)}`} />
    );
  }

  if (stage === 'over') {
    const rounds = resultsRef.current;
    const exactCount = rounds.filter((r) => r.band === 'exact').length;
    // Rondas de Mundial en la forma del Clásico: "ciudad" = jugador, coordenadas = centroide del país
    const asRounds = rounds.map((r) => {
      const c = getCountryCentroid(r.country);
      const dist = c ? haversineDistance(r.clickLat, r.clickLon, c.lat, c.lon) : 0;
      const city: City = { name: `${BALL} ${r.player}`, country: r.country, lat: c?.lat ?? 0, lon: c?.lon ?? 0, difficulty };
      return { city, clickLat: r.clickLat, clickLon: r.clickLon, distance: dist, basePoints: r.basePoints, multiplier: r.multiplier, totalPoints: r.totalPoints, timeUsed: r.timeUsed };
    });
    return (
      <FinalResultScreen
        variant="mundial"
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
  const fbStreakName = feedback ? streakKey(feedback.streak) : null;
  return (
    <div className={`fixed inset-0 z-40 flex flex-col game-bg ${failShake ? 'animate-screen-shake' : ''}`}>
      {isPortraitMobile && rotateOverlay}
      {/* Barra superior v2: marca · pregunta · sonido/salir  |  modo · ronda · tiempo · puntos */}
      <div className="shrink-0 flex flex-col gap-1 px-2 pb-1" style={{ paddingTop: 'max(0.35rem, var(--sat))', paddingLeft: 'max(0.5rem, var(--sal))', paddingRight: 'max(0.5rem, var(--sar))' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
            <Wordmark size="xs" className="hidden min-[520px]:inline" />
          </div>
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="max-w-full truncate rounded-full border border-accent/40 px-3 py-1 text-sm font-black backdrop-blur-md" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
              {BALL} {current ? t('wc_question', { player: current.name }) : ''}
              {current?.era && <span className="text-muted-foreground font-semibold"> · {t(`wc_era_${current.era}` as never)}</span>}
            </div>
          </div>
          {onToggleMusic && (
            <button onClick={onToggleMusic} className="w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-sm transition-all active:scale-90" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }} aria-label={musicMuted ? t('music_on') : t('music_off')}>
              {musicMuted ? '🔇' : '🔊'}
            </button>
          )}
          <button onClick={() => { if (window.confirm(t('game_exitConfirm'))) onExit(); }} className="w-8 h-8 shrink-0 rounded-full border border-border/60 flex items-center justify-center text-base transition-all active:scale-90" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }} aria-label={t('game_exit')}>
            ×
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <span className="hidden min-[560px]:inline rounded-full px-2 py-0.5 border border-primary/50 whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
            {BALL} <span className="text-primary">{t('wc_modeName')}</span> · {t(WC_DIFF_KEY[difficulty] as never)}
          </span>
          <span className="rounded-full px-2 py-0.5 border border-border/60 whitespace-nowrap" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
            {t('game_round')} <span className="text-primary">{roundIdx + 1}</span><span className="text-muted-foreground"> / {roster.length}</span>
          </span>
          <div className="flex-1 min-w-[90px] flex items-center gap-1.5 rounded-full px-2 py-0.5 border border-border/60" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
            <span className={`font-mono whitespace-nowrap ${timeLeft <= 3 && !isAnimating ? 'text-destructive animate-pulse' : timeLeft <= 5 && !isAnimating ? 'text-destructive' : ''}`}>⏱ {timeLeft} s</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/70 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(timeLeft / MAX_TIME) * 100}%`, background: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))', transition: isAnimating ? 'none' : 'width 200ms linear' }} />
            </div>
          </div>
          {showStreak && (
            <span className="hidden min-[640px]:inline rounded-full px-2 py-0.5 border border-primary/50 whitespace-nowrap animate-score-pop" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
              🔥 <span className="text-primary">{streak}</span>{streakPct > 0 && <span className="text-muted-foreground"> +{streakPct}%</span>}{topStreakName && <span className="text-muted-foreground"> · {t(topStreakName as never)}</span>}
            </span>
          )}
          <span className="rounded-full px-2 py-0.5 border border-primary/50 whitespace-nowrap font-mono" style={{ background: 'hsl(var(--brand-navy-deep) / 0.78)' }}>
            ⭐ <span className="text-primary font-black"><CountUp value={score} /></span> pts
          </span>
          <Mascot
            state={mascotState}
            className={`w-8 shrink-0 select-none pointer-events-none drop-shadow-[0_3px_8px_hsl(var(--primary)/0.4)] ${mascotState === 'idle' ? 'animate-mascot-float' : ''}`}
          />
        </div>
      </div>

      {/* Mapa + tinte de cancha */}
      <div className="relative flex-1 min-h-0">
        <WorldMapCanvas
          onMapClick={handleMapClick}
          clickDisabled={isAnimating}
          userClick={userClick}
          correctLocation={correctLoc}
          distanceKm={distanceKm}
          gameMode="world"
          highlightContinent={!isAnimating && current ? (COUNTRY_CONTINENT[current.country] ?? null) : null}
          pinEmoji={BALL}
          fieldGreen
          pacificDecor={pacificDecor}
          showZoomControls={!isAnimating}
        />

        {/* Panel de feedback v2 — mismo lenguaje que la tarjeta del Clásico */}
        {feedback && (
          <div
            className={`absolute z-20 flex animate-slide-in-right ${
              isPortraitMobile ? 'inset-x-0 bottom-0 justify-center pb-2 px-2 items-end' : 'inset-y-0 right-0 items-center p-2'
            }`}
            role="dialog"
          >
            <div className={`flex flex-col gap-2 rounded-3xl border border-border/80 bg-card/85 p-3 sm:p-4 shadow-2xl backdrop-blur-md overflow-y-auto ${
              isPortraitMobile ? 'w-full max-w-md max-h-[58vh]' : 'w-[clamp(18rem,40vw,26rem)] max-h-[94%] [@media(max-height:420px)]:gap-1 [@media(max-height:420px)]:p-2'
            }`}>
              <div className="text-center">
                <span className="text-3xl sm:text-4xl block animate-record-pop [@media(max-height:420px)]:hidden" style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}>
                  {BAND_EMOJI[feedback.band]}
                </span>
                <p className={`text-xl sm:text-2xl font-black ${BAND_COLOR[feedback.band]}`}>
                  {feedback.band === 'exact' ? t('wc_goal') : t(BAND_I18N[feedback.band] as never)}
                </p>
                {fbStreakName && (
                  <p className="animate-score-pop text-xs sm:text-sm font-black text-primary">🔥 {t(fbStreakName as never)} ×{feedback.streak}</p>
                )}
                <h3 className="text-lg sm:text-xl font-black mt-1">{feedback.correctCountry}</h3>
                {feedback.tappedCountry && feedback.tappedCountry !== feedback.correctCountry && (
                  <p className="text-xs text-muted-foreground">{t('wc_youTapped', { country: feedback.tappedCountry })}</p>
                )}
                <p className="font-black font-mono text-primary text-2xl sm:text-3xl" style={{ textShadow: '0 0 14px hsl(var(--primary)/0.4)' }}>
                  +{feedback.points.toLocaleString()} <span className="text-sm font-bold text-foreground">pts</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-border bg-muted/30 p-2 sm:p-2.5 flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{feedback.multEmoji}</span>
                  <span>
                    <span className="block text-[10px] text-muted-foreground">{t('game_calcSpeed')}</span>
                    <span className="block font-mono font-black text-sm sm:text-base">{feedback.multLabel}</span>
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-2 sm:p-2.5 flex items-center gap-2">
                  <span className="text-lg" aria-hidden>⏱️</span>
                  <span>
                    <span className="block text-[10px] text-muted-foreground">{t('game_time')}</span>
                    <span className="block font-mono font-black text-sm sm:text-base">{feedback.timeUsed} s</span>
                  </span>
                </div>
              </div>
              {feedback.distanceKm != null && (
                <p className="text-center text-[10px] sm:text-xs text-muted-foreground">📍 {formatDistance(feedback.distanceKm)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
