import { useState, useEffect, useCallback, useRef } from 'react';
import type { Difficulty } from '@/data/cities';
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
  playGameOver, playRoundTransition, playTick, playTimeExpired, playButtonTap,
  playVictory, playStreak, playWhistle, playVuvuzela, playCountdown, playGo,
} from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticCelebration } from '@/lib/haptics';
import { fireGoldBurst, fireRedBurst, fireCelebration, fireDistanceReveal } from '@/lib/confetti';
import { fireScoreFly, fireMultiplierFeedback, fireStreakBorder, fireRoundFlash } from '@/lib/juiceAnimations';
import { getMultiplier, haversineDistance, formatDistance, addGameHistory, updatePlayerStats, qualifiesForLeaderboard, addToLeaderboard } from '@/lib/gameUtils';
import { consumeLife } from '@/lib/energySystem';
import { useIsPortraitMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/i18n';
import { announce } from './ScreenReaderAnnouncer';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';
import Button3D from '@/components/ui/Button3D';
import CountUp from '@/components/ui/CountUp';
import CountdownIntro from './CountdownIntro';
import Mascot, { type MascotState } from './Mascot';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const FEEDBACK_MS = 3200;
const WC_MODE = 'mundial';
/** Balón de fútbol: pin del mapa e ícono de la mayoría de los mensajes del modo. */
const BALL = '⚽';

type Stage = 'select' | 'countdown' | 'playing' | 'over';

interface WorldChallengeScreenProps {
  /** Volver al home. */
  onExit: () => void;
  /** Sin vidas: el padre muestra el modal y saca al usuario. */
  onNoLives: () => void;
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

export default function WorldChallengeScreen({ onExit, onNoLives }: WorldChallengeScreenProps) {
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
  const [initials, setInitials] = useState('');
  const [qualifies, setQualifies] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shared, setShared] = useState(false);
  // Al entrar a Mundial: a veces balón ⚽, a veces copa 🏆 en el Pacífico
  const [pacificDecor, setPacificDecor] = useState<'ball' | 'trophy'>(() => (Math.random() < 0.5 ? 'trophy' : 'ball'));
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [failShake, setFailShake] = useState(false);
  useEffect(() => { setMascotState('idle'); }, [roundIdx]);

  const roundStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const resultsRef = useRef<WorldRoundResult[]>([]);
  const scoreRef = useRef(0);
  const clickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const qualifiesRef = useRef(false);
  const submittedRef = useRef(false);
  const initialsRef = useRef('');
  useEffect(() => { qualifiesRef.current = qualifies; }, [qualifies]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { initialsRef.current = initials; }, [initials]);

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
    setSubmitted(false);
    setQualifies(false);
    setShared(false);
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
    playGameOver();
    const rounds = resultsRef.current;
    const exactCount = rounds.filter((r) => r.band === 'exact').length;
    updatePlayerStats(finalScore, []);
    addGameHistory({
      date: new Date().toISOString(),
      score: finalScore,
      rounds: rounds.length,
      difficulty,
      mode: WC_MODE,
      avgDistance: exactCount,
      type: 'classic',
    });
    qualifiesForLeaderboard(finalScore).then(setQualifies).catch(() => setQualifies(false));
    setStage('over');
  }, [difficulty]);

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
    resultsRef.current.push(res);
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
      setTimeout(() => { fireStreakBorder(res.newStreak); playStreak(); }, 380);
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

  const submitScore = useCallback(async (ovScore?: number, ovInitials?: string) => {
    if (submittedRef.current) return;
    const ini = ((ovInitials ?? initialsRef.current) || 'YOU').toUpperCase().slice(0, 3) || 'YOU';
    const sc = ovScore ?? scoreRef.current;
    try { localStorage.setItem('geospeed_initials', ini); } catch { /* ignore */ }
    setSubmitted(true);
    submittedRef.current = true;
    await addToLeaderboard({ initials: ini, score: sc, difficulty, mode: WC_MODE, date: new Date().toISOString().split('T')[0] });
  }, [difficulty]);

  const ensureSubmitted = useCallback(() => {
    if (qualifiesRef.current && !submittedRef.current) void submitScore();
  }, [submitScore]);

  const shareResult = useCallback(async () => {
    const text = t('wc_shareText', { score });
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: 'GeoSpeed', text, url });
      else await navigator.clipboard?.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch { /* cancelado */ }
  }, [t, score]);

  useEffect(() => {
    try { setInitials((localStorage.getItem('geospeed_initials') || '').toUpperCase().slice(0, 3)); } catch { /* ignore */ }
  }, []);

  // ───────────────────────── RENDER ─────────────────────────

  // Overlay de "gira el teléfono" — solo durante la cuenta regresiva y el juego (no en el panel de inicio),
  // para que el orden sea igual a los demás modos.
  const rotateOverlay = (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center game-bg text-center px-6">
      <div className="text-5xl mb-4 animate-bounce">🔄📱</div>
      <p className="text-lg sm:text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>{t('rotate_title')}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-2">{t('rotate_desc')}</p>
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 overflow-y-auto game-bg">
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up my-4">
          <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
            {BALL} {endReason === 'timeout' ? t('wc_finalTimeout') : t('wc_finalTitle')}
          </h2>
          <p className="text-5xl sm:text-6xl font-mono font-black my-4" style={{ color: 'hsl(var(--primary))' }}>
            <CountUp value={score} />
          </p>
          <p className="text-sm text-muted-foreground mb-1">{BALL} {t('wc_exactCount', { n: exactCount })} · {rounds.length}/{TOTAL_ROUNDS}</p>

          {qualifies && !submitted && (
            <div className="my-4 flex items-center justify-center gap-2">
              <input
                value={initials}
                autoFocus
                onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                placeholder="ABC"
                maxLength={3}
                className="w-20 text-center font-mono font-black text-lg py-2 rounded-lg bg-background border-2 border-primary/50 uppercase tracking-widest"
              />
              <Button3D
                variant="primary"
                onClick={() => submitScore()}
                className="text-sm"
              >
                {t('save')}
              </Button3D>
            </div>
          )}
          {submitted && <p className="my-3 text-emerald-400 text-sm" role="status">🏆 {t('save')} ✓</p>}

          <button
            onClick={shareResult}
            className="w-full mb-2 py-2 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground hover:bg-muted transition-all active:scale-[0.97]"
          >
            {shared ? '✓' : `${BALL} ${t('share')}`}
          </button>

          <div className="flex gap-2 sm:gap-3 mt-2">
            <Button3D
              variant="primary"
              onClick={() => { playButtonTap(); ensureSubmitted(); setStage('select'); }}
              className="flex-1 text-xs sm:text-sm"
            >
              {t('wc_playAgain')}
            </Button3D>
            <button
              onClick={() => { playButtonTap(); ensureSubmitted(); onExit(); }}
              className="flex-1 py-2.5 sm:py-3 rounded-lg font-black text-xs sm:text-sm border-2 border-primary/45 bg-primary/8 text-foreground transition-all hover:bg-primary/15 active:scale-[0.97]"
            >
              🏠 Regresar al menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage === 'playing'
  const fbStreakName = feedback ? streakKey(feedback.streak) : null;
  return (
    <div className={`fixed inset-0 z-40 flex flex-col game-bg ${failShake ? 'animate-screen-shake' : ''}`}>
      {isPortraitMobile && rotateOverlay}
      {/* Barra superior: ronda, pregunta (+ era), racha, score */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-border/60">
        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground shrink-0">
          {t('wc_round', { round: roundIdx + 1, total: roster.length })}
        </span>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm sm:text-base font-black truncate" style={{ color: 'hsl(var(--primary))' }}>
            {BALL} {current ? t('wc_question', { player: current.name }) : ''}
          </p>
          {current?.era && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5">
              {t(`wc_era_${current.era}` as never)}
            </p>
          )}
        </div>
        {showStreak && (
          <span className="text-[10px] sm:text-xs font-black text-orange-400 shrink-0 text-right leading-tight">
            🔥×{streak}{streakPct > 0 && <span className="ml-0.5 opacity-80">+{streakPct}%</span>}
            {topStreakName && <span className="block text-[8px] sm:text-[9px]">{t(topStreakName as never)}</span>}
          </span>
        )}
        <span className="text-sm sm:text-base font-mono font-black shrink-0" style={{ color: 'hsl(var(--primary))' }}>
          <CountUp value={score} />
        </span>
        <Mascot
          state={mascotState}
          className={`w-8 sm:w-9 md:w-10 shrink-0 select-none pointer-events-none drop-shadow-[0_3px_8px_rgba(240,160,48,0.4)] ${mascotState === 'idle' ? 'animate-mascot-float' : ''}`}
        />
      </div>

      {/* Timer */}
      <div className="shrink-0 px-3 py-1">
        <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isAnimating} compact />
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
        />

        {/* Panel de feedback — al costado (landscape) o abajo (portrait), como el Clásico, sin chocar con las animaciones de arriba */}
        {feedback && (
          <div
            className={`absolute z-20 flex animate-slide-in-right ${
              isPortraitMobile ? 'inset-x-0 bottom-0 justify-center pb-2 px-2 items-end' : 'inset-y-0 right-0 items-center pr-2'
            }`}
            role="dialog"
          >
            <div className={`flex flex-col justify-center gap-2 rounded-2xl border border-border/80 bg-card/85 p-4 shadow-2xl backdrop-blur-md overflow-y-auto ${
              isPortraitMobile ? 'w-full max-w-md max-h-[58vh]' : 'w-[clamp(18rem,40vw,28rem)] max-h-[92%]'
            }`}>
              <div className="text-center">
                <span className="text-4xl sm:text-5xl block animate-record-pop" style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}>
                  {BAND_EMOJI[feedback.band]}
                </span>
                <p className={`mt-1 text-xl sm:text-2xl font-black ${BAND_COLOR[feedback.band]}`} style={{ fontFamily: 'Impact, system-ui' }}>
                  {feedback.band === 'exact' ? t('wc_goal') : t(BAND_I18N[feedback.band] as never)}
                </p>
                {fbStreakName && (
                  <p className="mt-0.5 animate-score-pop text-sm font-black text-orange-400">🔥 {t(fbStreakName as never)} ×{feedback.streak}</p>
                )}
                <div className="border-t border-border/50 mt-2 pt-2">
                  <h3 className="text-lg sm:text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>{feedback.correctCountry}</h3>
                  {feedback.tappedCountry && feedback.tappedCountry !== feedback.correctCountry && (
                    <p className="text-xs text-muted-foreground">{t('wc_youTapped', { country: feedback.tappedCountry })}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/50 p-2 text-center">
                  <p className="text-[9px] uppercase text-muted-foreground">{feedback.multEmoji}</p>
                  <p className="font-mono text-sm font-bold">{feedback.multLabel}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2 text-center">
                  <p className="text-[9px] uppercase text-muted-foreground">{t('game_time')}</p>
                  <p className="font-mono text-sm font-bold">{feedback.timeUsed}s</p>
                </div>
                <div className="rounded-xl p-2 text-center border" style={{ background: 'hsl(var(--primary) / 0.12)', borderColor: 'hsl(var(--primary) / 0.35)' }}>
                  <p className="text-[9px] uppercase font-bold" style={{ color: 'hsl(var(--primary))' }}>{t('game_total')}</p>
                  <p className="font-mono text-base font-black" style={{ color: 'hsl(var(--primary))' }}>{feedback.points.toLocaleString()}</p>
                </div>
              </div>
              {feedback.distanceKm != null && (
                <p className="text-center text-[10px] text-muted-foreground">{formatDistance(feedback.distanceKm)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
