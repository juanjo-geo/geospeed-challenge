import { useState, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { type RoundResult } from './GameScreen';
import CountUp from '@/components/ui/CountUp';
import { formatDistance, qualifiesForLeaderboard, addToLeaderboard, updatePlayerStats, getPlayerStats, getLeaderboard } from '@/lib/gameUtils';
import { isPro } from '@/lib/premiumSystem';
import { playVictory, playLevelUp, playRevengeActivate, playShareSuccess, playButtonTap, playGameOver } from '@/lib/sounds';
import { useAuth } from '@/hooks/useAuth';
import { shareResult } from '@/lib/shareCard';
import { canRecordVideo, shareVideo } from '@/lib/shareVideo';
import { checkLevelUp, calculateXP } from '@/lib/levelSystem';
import { fireCelebration } from '@/lib/confetti';
import { hapticCelebration } from '@/lib/haptics';
import CityAnswersScreen from './CityAnswersScreen';
import CityReviewScreen from './CityReviewScreen';
import Mascot, { type MascotState } from './Mascot';
import Wordmark from '@/components/ui/Wordmark';
import { type GameMode } from '@/data/cities';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';
import { recordGameResult, getContextualOffer, type FrustrationOffer } from '@/lib/frustrationDetector';
import FrustrationOfferModal from './FrustrationOfferModal';

const BALL_EMOJI = '⚽';

interface FinalResultScreenProps {
  rounds: RoundResult[];
  totalScore: number;
  difficulty: string;
  mode: string;
  reason: 'timeout' | 'complete';
  /** Repetir estas ciudades (misma lista, gratis). Si no se pasa, el botón principal es onNewGame. */
  onPlayAgain?: () => void;
  /** classic (por defecto) · timeattack (60s de Caos) · mundial. Cambia títulos, tiles y ranking. */
  variant?: 'classic' | 'timeattack' | 'mundial';
  /** Tiles de resumen personalizados (sustituyen Ciudades / Distancia media) */
  tiles?: { emoji: string; label: string; value: string }[];
  /** Mejor puntaje previo del modo (si no, se usa el récord global de stats) */
  previousBestOverride?: number;
  /** false → updatePlayerStats sin distancias (Mundial mide países, no km) */
  countDistancesInStats?: boolean;
  /** Nueva partida: mismas condiciones, ciudades nuevas */
  onNewGame?: () => void;
  onGoHome: () => void;
  onRevenge?: (rounds: RoundResult[]) => void;
  onShareChallenge?: () => void;
  onOpenStore?: () => void;
  /** Partida de un reto: el botón principal lleva al reto (estado / comparación) */
  onViewChallenge?: () => void;
  challengerScore?: number | null;
  totalRounds?: number;
}

type Outcome = 'record' | 'timeout' | 'complete';

/**
 * Cierre de partida (maquetas Cierre_Tiempo_Agotado / Cierre_Completado / Cierre_Record APROBADA_v1).
 * Tres estados con mascota propia; dos columnas en escritorio: resumen | "¿Lo intentamos de nuevo?".
 */
export default function FinalResultScreen({
  rounds,
  totalScore,
  difficulty,
  mode,
  reason,
  onPlayAgain,
  onNewGame,
  onGoHome,
  onRevenge,
  onShareChallenge,
  onOpenStore,
  onViewChallenge,
  challengerScore,
  totalRounds = 13,
  variant = 'classic',
  tiles,
  previousBestOverride,
  countDistancesInStats = true,
}: FinalResultScreenProps) {
  const { user, displayName: authName } = useAuth();
  const { t } = useI18n();
  const [initials, setInitials] = useState('');
  const [saved, setSaved] = useState(false);
  const [qualifies, setQualifies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [sharingVideo, setSharingVideo] = useState(false);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [rankTotal, setRankTotal] = useState<number>(0);
  const [frustrationOffer, setFrustrationOffer] = useState<FrustrationOffer | null>(null);
  /** Repaso: listado "Tus respuestas por ciudad" o revisión de una ciudad */
  const [review, setReview] = useState<{ view: 'list' | 'city'; idx: number } | null>(null);

  useEffect(() => {
    if (authName && authName.length >= 3) setInitials(authName.substring(0, 3).toUpperCase());
  }, [authName]);

  const distances = rounds.map(r => r.distance);
  const avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
  const bestRound = rounds.length > 0 ? rounds.reduce((best, r) => r.totalPoints > best.totalPoints ? r : best, rounds[0]) : null;

  const handleSave = async () => {
    if (initials.length !== 3 || saving) return;
    setSaving(true);
    await addToLeaderboard({
      initials: initials.toUpperCase(),
      score: totalScore,
      difficulty,
      mode,
      date: new Date().toISOString().split('T')[0],
      user_id: user?.id,
    });
    setSaved(true);
    setSaving(false);
  };

  // Récord: supera el mejor previo (una primera partida no cuenta como récord). Aplica también en timeout.
  const isNewRecord = totalScore > previousBest && previousBest > 0;
  const outcome: Outcome = isNewRecord ? 'record' : reason === 'timeout' ? 'timeout' : 'complete';

  useEffect(() => {
    const stats = getPlayerStats();
    const prevBest = previousBestOverride ?? stats.bestScore;
    setPreviousBest(prevBest);
    const prevXp = calculateXP();
    // 60s de Caos nunca contó en stats (su escala de puntos inflaría el récord global)
    if (variant !== 'timeattack') updatePlayerStats(totalScore, countDistancesInStats ? distances : []);
    // El ranking de ciudades no mezcla 60s de Caos (otra escala de puntos)
    if (variant !== 'timeattack') qualifiesForLeaderboard(totalScore, mode, difficulty).then(setQualifies);
    const record = totalScore > prevBest && prevBest > 0;
    if (record) {
      playVictory();
      setTimeout(() => { fireCelebration(); hapticCelebration(); }, 400);
    } else if (reason === 'complete') {
      playVictory();
    } else {
      playGameOver();
    }

    const newXp = prevXp + totalScore;
    const levelResult = checkLevelUp(prevXp, newXp);
    if (levelResult.leveled) setTimeout(() => playLevelUp(), reason === 'complete' ? 900 : 400);

    if (variant !== 'timeattack') getLeaderboard(mode).then(board => {
      setRankTotal(board.length);
      const pos = board.findIndex(e => totalScore >= e.score);
      setRankPosition(pos === -1 ? board.length + 1 : pos + 1);
    });

    recordGameResult({ score: totalScore, avgDistance, reason });
    const offerTimer = setTimeout(() => {
      const offer = getContextualOffer();
      if (offer) setFrustrationOffer(offer);
    }, 2500);

    const avgD = Math.round(distances.reduce((a, b) => a + b, 0) / Math.max(1, distances.length));
    announce(t('sr_announceGameOver', { score: totalScore.toLocaleString(), rounds: rounds.length, avg: avgD }), 'assertive');
    return () => clearTimeout(offerTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con el repaso abierto, sus propias teclas mandan (Esc vuelve al listado, no al menú)
  useKeyboardShortcuts(useMemo(() => (review ? {} : {
    'Enter': onPlayAgain ?? onNewGame ?? (() => {}),
    'Escape': onGoHome,
  }), [review, onPlayAgain, onNewGame, onGoHome]));

  const userIsPro = isPro();
  const scoreDelta = previousBest > 0 ? totalScore - previousBest : 0;
  const mascot: MascotState = outcome === 'record' ? 'celebrate' : outcome === 'timeout' ? 'sad' : 'wink';
  const modeLabel = variant === 'mundial' || mode === 'mundial'
    ? t('wc_modeName')
    : variant === 'timeattack'
    ? `${t('ta_hud')} · ${t(`mode_${mode}` as never) || mode}`
    : (t(`mode_${mode}` as never) || mode);
  // Mapa de fondo de la imagen/video compartido: Mundial no tiene bounds propios
  const shareMode = mode === 'mundial' ? 'world' : mode;
  const statTiles = tiles ?? (variant === 'timeattack'
    ? [
        { emoji: '🏙️', label: t('final_citiesCount'), value: String(rounds.length) },
        { emoji: '📍', label: t('final_avgDist'), value: formatDistance(avgDistance) },
      ]
    : [
        { emoji: '🏙️', label: t('final_cities'), value: `${rounds.length} / ${totalRounds}` },
        { emoji: '📍', label: t('final_avgDist'), value: formatDistance(avgDistance) },
      ]);
  const diffLabel = variant === 'mundial'
    ? `${BALL_EMOJI} ${t(`wc_diff_${difficulty}` as never)}`
    : (t(`diff_${difficulty}` as never) || difficulty);

  const handleShare = async () => {
    playShareSuccess();
    setSharing(true);
    await shareResult({
      playerName: authName || initials || 'Jugador',
      score: totalScore,
      mode: shareMode,
      difficulty,
      avgDistance: formatDistance(avgDistance),
      cities: rounds.length,
      totalCities: totalRounds,
      rounds: rounds.map(r => ({ clickLat: r.clickLat, clickLon: r.clickLon, cityLat: r.city.lat, cityLon: r.city.lon, distance: r.distance })),
    });
    setSharing(false);
  };

  const handleShareVideo = async () => {
    if (!bestRound) return handleShare();
    playShareSuccess();
    setSharingVideo(true);
    try {
      const success = await shareVideo({
        playerName: authName || initials || 'Jugador',
        totalScore,
        mode: shareMode,
        difficulty,
        totalCities: rounds.length,
        bestRound: {
          clickLat: bestRound.clickLat, clickLon: bestRound.clickLon,
          cityLat: bestRound.city.lat, cityLon: bestRound.city.lon,
          cityName: bestRound.city.name, distance: bestRound.distance, score: bestRound.totalPoints,
        },
      });
      if (!success) await handleShare();
    } catch {
      await handleShare();
    }
    setSharingVideo(false);
  };

  const title = outcome === 'record' ? t('final_recordTitle')
    : variant === 'timeattack' ? t('final_taTitle')
    : outcome === 'timeout' ? (variant === 'mundial' ? t('wc_finalTimeout') : t('final_timeoutTitle'))
    : (variant === 'mundial' ? t('wc_finalTitle') : t('final_completeTitle'));
  const subtitle = outcome === 'record' ? t('final_recordSub')
    : variant === 'timeattack' ? t('final_taSub', { n: rounds.length })
    : outcome === 'timeout' ? t('final_timeoutSub') : t('final_completeSub');
  const titleColor = outcome === 'record' ? 'text-primary text-glow' : outcome === 'timeout' ? 'text-destructive' : 'text-foreground';

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-3 sm:px-4 sm:py-5 md:px-6 overflow-y-auto game-bg" role="dialog" aria-label={t('final_resultLabel')}>
      {/* Barra superior: marca · modo · atajos */}
      <div className="w-full max-w-md md:max-w-5xl flex items-center justify-between mb-3 animate-fade-in" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 4px)' }}>
        <div className="flex items-center gap-2">
          <Mascot state={mascot} className="w-9 h-9" />
          <span className="flex flex-col leading-none">
            <Wordmark size="sm" />
            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{modeLabel} · {diffLabel}</span>
          </span>
        </div>
        <button
          onClick={() => { playButtonTap(); onGoHome(); }}
          className="w-9 h-9 rounded-full border border-border/60 bg-card/60 flex items-center justify-center text-lg hover:bg-muted transition-colors active:scale-95"
          aria-label={t('final_home')}
          title={t('final_home')}
        >
          ×
        </button>
      </div>

      <div className="w-full max-w-md md:max-w-5xl md:grid md:grid-cols-2 md:gap-4 md:items-start">
        {/* ── Columna 1: resumen ── */}
        <section className="rounded-3xl border border-border bg-card/80 p-4 sm:p-5 mb-3 md:mb-0 animate-fade-in-up relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: outcome === 'timeout' ? 'hsl(var(--destructive))' : 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' }} />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              {outcome === 'record' && <span className="absolute -top-2 -right-2 text-2xl animate-record-pop">🏆</span>}
              {outcome === 'timeout' && <span className="absolute -bottom-1 -right-2 text-2xl">⏰</span>}
              <Mascot state={mascot} className={`w-20 sm:w-24 ${outcome === 'record' ? 'drop-shadow-[0_0_16px_hsl(var(--primary)/0.7)]' : ''}`} />
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-black leading-tight ${titleColor}`}>{title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="text-center mt-4 sm:mt-5">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">{t('final_totalScore')}</p>
            <p className={`text-4xl sm:text-5xl font-black font-mono text-primary ${outcome === 'record' ? 'text-glow animate-score-pop' : ''}`} aria-live="polite">
              <CountUp value={totalScore} durationMs={900} /> <span className="text-lg sm:text-xl font-bold text-foreground">pts</span>
            </p>
            {previousBest > 0 && (
              <p className="text-xs sm:text-sm mt-1 text-muted-foreground">
                {outcome === 'record'
                  ? <>{t('final_prevRecord', { score: previousBest.toLocaleString() })} <span className="text-accent font-bold">· {t('final_beatBy', { delta: scoreDelta.toLocaleString() })}</span></>
                  : t('final_yourRecord', { score: previousBest.toLocaleString() })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4" role="group" aria-label={t('final_resultLabel')}>
            {statTiles.map(tile => (
              <div key={tile.label} className="rounded-2xl border border-border bg-muted/30 p-3 flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{tile.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] sm:text-xs text-muted-foreground">{tile.label}</span>
                  <span className="block font-mono font-black text-lg sm:text-xl truncate">{tile.value}</span>
                </span>
              </div>
            ))}
          </div>

          {bestRound && (
            <div className="mt-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 flex items-center gap-3">
              <span className="text-2xl" aria-hidden>🏆</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] sm:text-xs text-muted-foreground">{t('final_bestRound')}</span>
                <span className="block font-bold text-sm sm:text-base truncate">
                  <span className="text-primary">{bestRound.city.name}</span> · {bestRound.totalPoints.toLocaleString()} pts · {formatDistance(bestRound.distance)}
                </span>
              </span>
            </div>
          )}

          {rankPosition !== null && rankTotal > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {rankPosition <= 3
                ? `${rankPosition === 1 ? '👑' : rankPosition === 2 ? '🥈' : '🥉'} ${t('final_top3', { pos: rankPosition })}`
                : rankPosition <= rankTotal
                ? `📊 ${t('final_beatPct', { pct: Math.round(((rankTotal - rankPosition + 1) / rankTotal) * 100) })}`
                : `📈 ${t('final_keepPracticing')}`}
            </p>
          )}

          {rounds.length > 0 && (
            <button
              onClick={() => { playButtonTap(); setReview({ view: 'list', idx: 0 }); }}
              className="mt-3 w-full rounded-2xl border border-accent/60 bg-accent/5 hover:bg-accent/10 px-4 py-2.5 flex items-center gap-3 text-left transition-colors active:scale-[0.99]"
            >
              <span className="text-xl" aria-hidden>📊</span>
              <span className="flex-1 min-w-0">
                <span className="block font-black text-sm sm:text-base">{variant === 'mundial' ? t('answers_openPlayers') : t('answers_open')}</span>
                <span className="block text-[11px] sm:text-xs text-muted-foreground">{t('answers_openSub')}</span>
              </span>
              <span className="text-accent font-black" aria-hidden>›</span>
            </button>
          )}

          {/* Comparación con el retador (enlace "Reta a un amigo") */}
          {challengerScore != null && challengerScore > 0 && (
            <div className="mt-3 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-center animate-fade-in">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">⚔️ {t('final_duelResult')}</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('final_challenger')}</p>
                  <p className="font-mono font-bold text-sm text-primary">{challengerScore.toLocaleString()}</p>
                </div>
                <span className="text-lg font-black text-muted-foreground">VS</span>
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('final_you')}</p>
                  <p className="font-mono font-bold text-sm text-primary">{totalScore.toLocaleString()}</p>
                </div>
              </div>
              <p className={`font-bold text-xs mt-2 ${totalScore > challengerScore ? 'text-accent' : totalScore === challengerScore ? 'text-primary' : 'text-destructive'}`}>
                {totalScore > challengerScore ? t('final_duelWin') : totalScore === challengerScore ? t('final_duelTie') : t('final_duelLose')}
              </p>
            </div>
          )}

          {/* Iniciales para el ranking */}
          {qualifies && !saved && (
            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-center">
              <p className="text-xs sm:text-sm mb-2 text-primary font-bold">{t('final_top10')} {t('final_enterInitials')}</p>
              <div className="flex justify-center items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={initials}
                  onChange={e => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                  className="w-24 text-center text-xl font-mono font-bold bg-muted border border-border rounded-xl p-2 uppercase tracking-[0.3em]"
                  placeholder="___"
                  aria-label={t('final_enterInitials')}
                />
                <button
                  onClick={handleSave}
                  disabled={initials.length !== 3 || saving}
                  className="btn3d px-5 py-2.5 rounded-xl font-black text-sm text-primary-foreground disabled:opacity-40"
                  style={{ background: 'var(--grad-cta)' }}
                >
                  {saving ? t('final_saved') : t('final_saveScore')}
                </button>
              </div>
            </div>
          )}
          {saved && <p className="text-center text-xs sm:text-sm mt-3 text-accent font-bold" role="status">✅ {t('final_saved')}</p>}
        </section>

        {/* ── Columna 2: ¿Lo intentamos de nuevo? ── */}
        <section className="rounded-3xl border border-border bg-card/80 p-4 sm:p-5 animate-fade-in-up animation-delay-100">
          <h2 className="text-xl sm:text-2xl font-black text-center mb-3">{t('final_tryAgainTitle')}</h2>

          {onViewChallenge ? (
            <button
              onClick={() => { playButtonTap(); onViewChallenge(); }}
              className="btn3d w-full rounded-2xl py-3.5 sm:py-4 px-4 flex items-center justify-center gap-3 text-primary-foreground"
              style={{ background: 'var(--grad-cta)' }}
            >
              <span className="text-2xl" aria-hidden>⚔️</span>
              <span className="flex flex-col leading-tight text-left">
                <span className="font-black text-base sm:text-lg">{t('ch_viewMine')}</span>
                <span className="text-[11px] sm:text-xs font-semibold opacity-80">{t('ch_savedInChallenge')}</span>
              </span>
            </button>
          ) : onPlayAgain ? (
            <>
              <button
                onClick={() => { playButtonTap(); onPlayAgain(); }}
                className="btn3d w-full rounded-2xl py-3.5 sm:py-4 px-4 flex items-center justify-center gap-3 text-primary-foreground text-left"
                style={{ background: 'var(--grad-cta)' }}
                aria-label={t('final_repeat')}
              >
                <span className="text-2xl" aria-hidden>🔁</span>
                <span className="flex flex-col leading-tight">
                  <span className="font-black text-base sm:text-lg">{t('final_repeat')}</span>
                  <span className="text-[11px] sm:text-xs font-semibold opacity-80">{t('final_repeatSub')}</span>
                </span>
              </button>
              {onNewGame && (
                <button
                  onClick={() => { playButtonTap(); onNewGame(); }}
                  className="mt-2.5 w-full rounded-2xl py-3 sm:py-3.5 border-2 border-accent text-accent font-black text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors active:scale-[0.98]"
                >
                  <span aria-hidden>▶</span> {t('final_newGame')}
                </button>
              )}
            </>
          ) : onNewGame && (
            /* Caos y Mundial no tienen "repetir estas ciudades": el principal es volver a jugar */
            <button
              onClick={() => { playButtonTap(); onNewGame(); }}
              className="btn3d w-full rounded-2xl py-3.5 sm:py-4 px-4 flex items-center justify-center gap-3 text-primary-foreground"
              style={{ background: 'var(--grad-cta)' }}
            >
              <span className="text-2xl" aria-hidden>{variant === 'mundial' ? '⚽' : '⚡'}</span>
              <span className="font-black text-base sm:text-lg">{variant === 'mundial' ? t('wc_playAgain').toUpperCase() : t('final_retry')}</span>
            </button>
          )}

          <button
            onClick={() => { playButtonTap(); onGoHome(); }}
            className="mt-2.5 w-full rounded-2xl py-3 border border-border bg-muted/20 font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98]"
          >
            🏠 {t('final_home')}
          </button>

          <div className="h-px bg-border my-3" />

          <div className={`grid gap-2 ${onShareChallenge ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={handleShare}
              disabled={sharing || sharingVideo}
              className="rounded-2xl py-2.5 border border-border bg-muted/20 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {sharing ? '⏳' : '📤'} {t('final_shareShort')}
            </button>
            {/* El reto por enlace solo existe para el Clásico */}
            {onShareChallenge && (
              <button
                onClick={() => { playShareSuccess(); onShareChallenge(); }}
                className="rounded-2xl py-2.5 border border-border bg-muted/20 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                ⚔️ {t('final_challengeShort')}
              </button>
            )}
          </div>
          {canRecordVideo() && (
            <button
              onClick={handleShareVideo}
              disabled={sharing || sharingVideo}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline disabled:opacity-60"
            >
              {sharingVideo ? '⏳' : '🎬'} {t('final_moreShare')} ›
            </button>
          )}

          {onRevenge && rounds.length >= 5 && (
            <button
              onClick={() => { playRevengeActivate(); onRevenge(rounds); }}
              className="mt-3 w-full rounded-2xl py-2.5 border border-destructive/40 bg-destructive/10 text-destructive font-bold text-xs sm:text-sm hover:bg-destructive/15 transition-colors active:scale-[0.98]"
            >
              🔥 {t('final_revenge')}
            </button>
          )}

          {!userIsPro && onOpenStore && (
            <button
              onClick={() => { playButtonTap(); onOpenStore(); }}
              className="mt-3 w-full rounded-2xl py-2.5 border border-primary/30 bg-primary/5 text-xs sm:text-sm font-bold hover:bg-primary/10 transition-colors active:scale-[0.98]"
            >
              👑 <span className="text-primary">{t('final_proLink')}</span>
            </button>
          )}

          {!user && (
            <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/5 p-3 text-center animate-fade-in animation-delay-500">
              <p className="text-xs sm:text-sm font-bold mb-1">{t('final_nudgeTitle')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">{t('final_nudgeDesc')}</p>
              <a href="/auth" className="inline-block px-4 py-2 rounded-xl text-xs font-bold border border-accent/50 text-accent hover:bg-accent/10 transition-colors active:scale-[0.97]">
                {t('final_nudgeCta')}
              </a>
            </div>
          )}
        </section>
      </div>
      <div className="h-4" />

      {frustrationOffer && (
        <FrustrationOfferModal
          offer={frustrationOffer}
          onAccept={(action) => {
            setFrustrationOffer(null);
            if ((action === 'store' || action === 'pro') && onOpenStore) onOpenStore();
          }}
          onDismiss={() => setFrustrationOffer(null)}
        />
      )}

      {review?.view === 'list' && (
        <CityAnswersScreen
          rounds={rounds}
          isMundial={variant === 'mundial'}
          focusIndex={review.idx}
          onOpenCity={(i) => setReview({ view: 'city', idx: i })}
          onReviewAll={() => setReview({ view: 'city', idx: 0 })}
          onClose={() => setReview(null)}
        />
      )}
      {review?.view === 'city' && (
        <CityReviewScreen
          rounds={rounds}
          index={review.idx}
          isMundial={variant === 'mundial'}
          onIndexChange={(i) => setReview({ view: 'city', idx: i })}
          onBackToList={() => setReview(v => ({ view: 'list', idx: v?.idx ?? 0 }))}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  );
}
