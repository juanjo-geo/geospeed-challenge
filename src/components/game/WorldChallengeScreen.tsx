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
  playVictory, playStreak,
} from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticCelebration } from '@/lib/haptics';
import { fireGoldBurst, fireRedBurst, fireCelebration, fireDistanceReveal } from '@/lib/confetti';
import { fireScoreFly, fireMultiplierFeedback, fireStreakBorder, fireRoundFlash } from '@/lib/juiceAnimations';
import { getMultiplier, haversineDistance, addGameHistory, updatePlayerStats, qualifiesForLeaderboard, addToLeaderboard } from '@/lib/gameUtils';
import { useI18n } from '@/i18n';
import { announce } from './ScreenReaderAnnouncer';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';

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
}

interface Feedback {
  band: TerritoryBand;
  correctCountry: string;
  tappedCountry: string | null;
  points: number;
  multLabel: string;
  multEmoji: string;
  streak: number;
}

const BAND_COLOR: Record<TerritoryBand, string> = {
  exact: 'text-green-400',
  neighbor: 'text-emerald-400',
  continent: 'text-yellow-400',
  far: 'text-orange-400',
  ocean: 'text-red-500',
};
const BAND_I18N: Record<TerritoryBand, string> = {
  exact: 'wc_band_exact', neighbor: 'wc_band_neighbor', continent: 'wc_band_continent',
  far: 'wc_band_far', ocean: 'wc_band_ocean',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WorldChallengeScreen({ onExit }: WorldChallengeScreenProps) {
  const { t } = useI18n();

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

  const roundStartRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const resultsRef = useRef<WorldRoundResult[]>([]);
  const scoreRef = useRef(0);
  const clickViewportRef = useRef<{ x: number; y: number } | undefined>(undefined);
  // Refs para el guardado-al-salir (evita perder el score si no tocan "Guardar")
  const qualifiesRef = useRef(false);
  const submittedRef = useRef(false);
  const initialsRef = useRef('');
  useEffect(() => { qualifiesRef.current = qualifies; }, [qualifies]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { initialsRef.current = initials; }, [initials]);

  const current = roster[roundIdx];
  const showStreak = streak >= 2;
  const streakPct = streak >= 2 ? Math.min(60, (streak - 1) * 10) : 0;

  // ── Lanzar partida tras elegir dificultad ──
  const startGame = useCallback((d: Difficulty) => {
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
    setCountdown(3);
    setStage('countdown');
  }, []);

  // ── Cuenta regresiva 3-2-1 ──
  useEffect(() => {
    if (stage !== 'countdown') return;
    if (countdown <= 0) {
      setStage('playing');
      return;
    }
    playRoundTransition();
    const id = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [stage, countdown]);

  // ── Inicio de cada ronda: reiniciar timer ──
  useEffect(() => {
    if (stage !== 'playing') return;
    setTimeLeft(MAX_TIME);
    roundStartRef.current = Date.now();
  }, [stage, roundIdx]);

  // ── Temporizador por ronda ──
  useEffect(() => {
    if (stage !== 'playing' || isAnimating) return;
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
  }, [stage, isAnimating, roundIdx]);

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
      avgDistance: exactCount, // reutilizado: nº de aciertos exactos
      type: 'classic',
    });
    qualifiesForLeaderboard(finalScore, WC_MODE).then(setQualifies).catch(() => setQualifies(false));
    setStage('over');
  }, [difficulty]);

  const handleTimeout = useCallback(() => {
    if (stage !== 'playing') return;
    playTimeExpired();
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

    // Distancia aproximada click → centro del país correcto (para la línea + etiqueta del mapa)
    const centroid = getCountryCentroid(current.country);
    const dist = centroid ? haversineDistance(lat, lon, centroid.lat, centroid.lon) : null;

    const newScore = score + res.totalPoints;
    scoreRef.current = newScore;
    setScore(newScore);
    setStreak(res.newStreak);
    setUserClick({ lat, lon });
    setCorrectLoc(centroid);
    setDistanceKm(dist);
    setFeedback({
      band: res.band,
      correctCountry: current.country,
      tappedCountry: res.tappedCountry,
      points: res.totalPoints,
      multLabel: mult.label,
      multEmoji: mult.emoji,
      streak: res.newStreak,
    });
    setIsAnimating(true);

    const playerName = current.name;
    const scoreTo = { x: Math.min(window.innerWidth - 40, window.innerWidth * 0.9), y: 40 };

    // ── Feedback sensorial por banda (juice con sabor a fútbol) ──
    if (res.band === 'exact') {
      // ¡GOOOL! — celebración grande + fanfarria
      playVictory(); hapticCelebration();
      fireCelebration(from);
    } else if (res.band === 'neighbor') {
      playGood(); hapticSuccess();
      fireGoldBurst(from);
    } else if (res.band === 'continent') {
      playMedium(); hapticTap();
    } else {
      playBad(); hapticError();
      fireRedBurst(from);
    }

    // ── Animaciones tipo Clásico: vuelo de puntos, flash de ronda, multiplicador y racha ──
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
    // "Al otro lado del mundo": revelado dramático de distancia cuando el país está lejísimos
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

  // ── Guardado al ranking ──
  const submitScore = useCallback(async (ovScore?: number, ovInitials?: string) => {
    if (submittedRef.current) return;
    const ini = ((ovInitials ?? initialsRef.current) || 'YOU').toUpperCase().slice(0, 3) || 'YOU';
    const sc = ovScore ?? scoreRef.current;
    try { localStorage.setItem('geospeed_initials', ini); } catch { /* ignore */ }
    setSubmitted(true);
    submittedRef.current = true;
    await addToLeaderboard({ initials: ini, score: sc, difficulty, mode: WC_MODE, date: new Date().toISOString().split('T')[0] });
  }, [difficulty]);

  /** Garantiza el guardado al abandonar la pantalla final (aunque no toquen "Guardar"). */
  const ensureSubmitted = useCallback(() => {
    if (qualifiesRef.current && !submittedRef.current) {
      void submitScore();
    }
  }, [submitScore]);

  useEffect(() => {
    try { setInitials((localStorage.getItem('geospeed_initials') || '').toUpperCase().slice(0, 3)); } catch { /* ignore */ }
  }, []);

  // ───────────────────────── RENDER ─────────────────────────

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
                className={`py-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all active:scale-[0.97] ${
                  difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                }`}
              >
                {t(`diff_${d}` as never)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={onExit} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
              {t('back').toUpperCase()}
            </button>
            <button
              onClick={() => { playButtonTap(); startGame(difficulty); }}
              className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {t('wc_start')} {BALL}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'countdown') {
    const isGo = countdown === 0;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-[100dvh] game-bg overflow-hidden">
        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 animate-fade-in">
          {BALL} {t('wc_modeName')} — {t(`diff_${difficulty}` as never)}
        </p>
        <div className="font-black font-mono text-7xl sm:text-8xl md:text-9xl animate-countdown-zoom" style={{ color: 'hsl(var(--primary))' }}>
          {isGo ? 'GO!' : countdown}
        </div>
      </div>
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
            {score.toLocaleString()}
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
              <button
                onClick={() => submitScore()}
                className="py-2 px-4 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {t('save')}
              </button>
            </div>
          )}
          {submitted && <p className="my-3 text-emerald-400 text-sm" role="status">🏆 {t('save')} ✓</p>}

          <div className="flex gap-2 sm:gap-3 mt-4">
            <button onClick={() => { playButtonTap(); ensureSubmitted(); setStage('select'); }} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
              {t('wc_playAgain')}
            </button>
            <button
              onClick={() => { playButtonTap(); ensureSubmitted(); onExit(); }}
              className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {t('back').toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage === 'playing'
  return (
    <div className="fixed inset-0 z-40 flex flex-col game-bg">
      {/* Barra superior: ronda, pregunta, racha, score */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-border/60">
        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground shrink-0">
          {t('wc_round', { round: roundIdx + 1, total: roster.length })}
        </span>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm sm:text-base font-black truncate" style={{ color: 'hsl(var(--primary))' }}>
            {BALL} {current ? t('wc_question', { player: current.name }) : ''}
          </p>
        </div>
        {showStreak && (
          <span className="text-[10px] sm:text-xs font-black text-orange-400 shrink-0">
            🔥×{streak}{streakPct > 0 && <span className="ml-0.5 opacity-80">+{streakPct}%</span>}
          </span>
        )}
        <span className="text-sm sm:text-base font-mono font-black shrink-0" style={{ color: 'hsl(var(--primary))' }}>
          {score.toLocaleString()}
        </span>
      </div>

      {/* Timer */}
      <div className="shrink-0 px-3 py-1">
        <TimerBar timeLeft={timeLeft} maxTime={MAX_TIME} isRunning={!isAnimating} compact />
      </div>

      {/* Mapa */}
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
        />

        {/* Panel de feedback — estilo similar a los otros modos (banda, puntos, multiplicador, racha) */}
        {feedback && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-10 animate-fade-in-up px-3">
            <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-2.5 text-center shadow-2xl max-w-[92%]">
              <p className={`text-xl sm:text-2xl font-black ${BAND_COLOR[feedback.band]}`} style={{ fontFamily: 'Impact, system-ui' }}>
                {BALL} {feedback.band === 'exact' ? t('wc_goal') : t(BAND_I18N[feedback.band] as never)}
                {feedback.points > 0 ? ` +${feedback.points.toLocaleString()}` : ''}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {t('wc_correctWas', { country: feedback.correctCountry })}
                {feedback.tappedCountry && feedback.tappedCountry !== feedback.correctCountry
                  ? ` · ${t('wc_youTapped', { country: feedback.tappedCountry })}`
                  : ''}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs sm:text-sm font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  {feedback.multEmoji} {feedback.multLabel}
                </span>
                {feedback.streak >= 2 && (
                  <span className="text-xs sm:text-sm font-black text-orange-400">🔥×{feedback.streak}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
