import { useState, useEffect, useCallback, useRef } from 'react';
import type { Difficulty } from '@/data/cities';
import { getPlayersByDifficulty, type Player } from '@/data/players';
import {
  scoreWorldRound,
  getCountryCentroid,
  type TerritoryBand,
  type WorldRoundResult,
} from '@/lib/worldChallenge';
import {
  playClick, playGood, playBad, playPerfect, playMedium,
  playGameOver, playRoundTransition, playTick, playTimeExpired, playButtonTap,
} from '@/lib/sounds';
import { hapticTap, hapticSuccess, hapticError, hapticCelebration } from '@/lib/haptics';
import { fireStarBurst, fireGoldBurst, fireRedBurst } from '@/lib/confetti';
import { addGameHistory, updatePlayerStats, qualifiesForLeaderboard, addToLeaderboard } from '@/lib/gameUtils';
import { useI18n } from '@/i18n';
import { announce } from './ScreenReaderAnnouncer';
import WorldMapCanvas from './WorldMapCanvas';
import TimerBar from './TimerBar';

const MAX_TIME = 15;
const TOTAL_ROUNDS = 13;
const FEEDBACK_MS = 2200;
const WC_MODE = 'mundial';

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
}

const BAND_COLOR: Record<TerritoryBand, string> = {
  exact: 'text-green-400',
  neighbor: 'text-emerald-400',
  continent: 'text-yellow-400',
  far: 'text-orange-400',
  ocean: 'text-red-500',
};
const BAND_EMOJI: Record<TerritoryBand, string> = {
  exact: '🎯', neighbor: '🟢', continent: '🟡', far: '🔴', ocean: '⚫',
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

  const current = roster[roundIdx];

  // ── Lanzar partida tras elegir dificultad ──
  const startGame = useCallback((d: Difficulty) => {
    const pool = shuffle(getPlayersByDifficulty(d)).slice(0, TOTAL_ROUNDS);
    setRoster(pool);
    setRoundIdx(0);
    setScore(0);
    setStreak(0);
    resultsRef.current = [];
    scoreRef.current = 0;
    setUserClick(null);
    setCorrectLoc(null);
    setFeedback(null);
    setIsAnimating(false);
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
  }, [stage, score, finishGame]);

  const handleMapClick = useCallback((lat: number, lon: number, vx?: number, vy?: number) => {
    if (stage !== 'playing' || isAnimating || !current) return;
    clearInterval(timerRef.current);
    playClick();
    hapticTap();
    clickViewportRef.current = (vx != null && vy != null) ? { x: vx, y: vy } : undefined;

    const timeUsed = Math.min(MAX_TIME, Math.max(0, Math.round((Date.now() - roundStartRef.current) / 1000)));
    const res = scoreWorldRound(current.country, lat, lon, timeUsed, streak);
    resultsRef.current.push(res);

    const newScore = score + res.totalPoints;
    scoreRef.current = newScore;
    setScore(newScore);
    setStreak(res.newStreak);
    setUserClick({ lat, lon });
    setCorrectLoc(getCountryCentroid(current.country));
    setFeedback({ band: res.band, correctCountry: current.country, tappedCountry: res.tappedCountry, points: res.totalPoints });
    setIsAnimating(true);

    // Feedback sensorial por banda
    if (res.band === 'exact') { playPerfect(); hapticCelebration(); fireStarBurst(clickViewportRef.current); }
    else if (res.band === 'neighbor') { playGood(); hapticSuccess(); fireGoldBurst(clickViewportRef.current); }
    else if (res.band === 'continent') { playMedium(); hapticTap(); }
    else { playBad(); hapticError(); fireRedBurst(clickViewportRef.current); }

    announce(t('sr_worldChallengeResult', {
      player: current.name,
      country: current.country,
      band: t(BAND_I18N[res.band] as never),
      points: res.totalPoints,
      round: roundIdx + 1,
      total: roster.length,
    }));

    setTimeout(() => {
      setUserClick(null);
      setCorrectLoc(null);
      setFeedback(null);
      setIsAnimating(false);
      if (roundIdx + 1 >= roster.length) {
        finishGame('complete', newScore);
      } else {
        setRoundIdx((i) => i + 1);
      }
    }, FEEDBACK_MS);
  }, [stage, isAnimating, current, streak, score, roundIdx, roster.length, finishGame, t]);

  const submitScore = useCallback(async () => {
    const ini = (initials || 'YOU').toUpperCase().slice(0, 3);
    try { localStorage.setItem('geospeed_initials', ini); } catch { /* ignore */ }
    setSubmitted(true);
    await addToLeaderboard({ initials: ini, score, difficulty, mode: WC_MODE, date: new Date().toISOString().split('T')[0] });
  }, [initials, score, difficulty]);

  useEffect(() => {
    try { setInitials((localStorage.getItem('geospeed_initials') || '').toUpperCase().slice(0, 3)); } catch { /* ignore */ }
  }, []);

  // ───────────────────────── RENDER ─────────────────────────

  if (stage === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 overflow-y-auto game-bg">
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 md:p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up my-4">
          <h2 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
            ⚽ {t('wc_modeName')}
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
              {t('wc_start')} ⚽
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
          ⚽ {t('wc_modeName')} — {t(`diff_${difficulty}` as never)}
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
            {endReason === 'timeout' ? t('wc_finalTimeout') : t('wc_finalTitle')}
          </h2>
          <p className="text-5xl sm:text-6xl font-mono font-black my-4" style={{ color: 'hsl(var(--primary))' }}>
            {score.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mb-1">{t('wc_exactCount', { n: exactCount })} · {rounds.length}/{TOTAL_ROUNDS}</p>

          {qualifies && !submitted && (
            <div className="my-4 flex items-center justify-center gap-2">
              <input
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                placeholder="ABC"
                maxLength={3}
                className="w-20 text-center font-mono font-black text-lg py-2 rounded-lg bg-background border-2 border-primary/50 uppercase tracking-widest"
              />
              <button
                onClick={submitScore}
                className="py-2 px-4 rounded-lg font-bold text-sm transition-all active:scale-[0.97]"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {t('save')}
              </button>
            </div>
          )}
          {submitted && <p className="my-3 text-emerald-400 text-sm" role="status">🏆 {t('save')} ✓</p>}

          <div className="flex gap-2 sm:gap-3 mt-4">
            <button onClick={() => { playButtonTap(); setStage('select'); }} className="flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]">
              {t('wc_playAgain')}
            </button>
            <button
              onClick={() => { playButtonTap(); onExit(); }}
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
      {/* Barra superior: ronda, pregunta, score */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-border/60">
        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground shrink-0">
          {t('wc_round', { round: roundIdx + 1, total: roster.length })}
        </span>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm sm:text-base font-black truncate" style={{ color: 'hsl(var(--primary))' }}>
            ⚽ {current ? t('wc_question', { player: current.name }) : ''}
          </p>
        </div>
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
          distanceKm={null}
          gameMode="world"
          highlightContinent={null}
        />

        {/* Overlay de feedback de banda */}
        {feedback && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-10 animate-fade-in">
            <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl px-4 py-2 text-center shadow-xl">
              <p className={`text-lg sm:text-xl font-black ${BAND_COLOR[feedback.band]}`}>
                {BAND_EMOJI[feedback.band]} {t(BAND_I18N[feedback.band] as never)} {feedback.points > 0 ? `+${feedback.points.toLocaleString()}` : ''}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('wc_correctWas', { country: feedback.correctCountry })}
                {feedback.tappedCountry && feedback.tappedCountry !== feedback.correctCountry
                  ? ` · ${t('wc_youTapped', { country: feedback.tappedCountry })}`
                  : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
