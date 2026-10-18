import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
import { HudIconButton } from './GameHud';
import { appNumberLocale } from '@/lib/format';
// Mapa de continentes tenue de fondo (polígonos en carga diferida)
const WorldBackdrop = lazy(() => import('./WorldBackdrop'));

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
  /** Música: botón de sonido del encabezado (maqueta) */
  musicMuted?: boolean;
  onToggleMusic?: () => void;
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
  musicMuted,
  onToggleMusic,
}: FinalResultScreenProps) {
  const { user, displayName: authName, isAnonymous } = useAuth();
  const { t, locale } = useI18n();
  const numberLocale = locale === 'en' ? 'en-US' : 'es-CO';
  const fmt = (n: number) => n.toLocaleString(numberLocale);
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
    announce(t('sr_announceGameOver', { score: totalScore.toLocaleString(appNumberLocale()), rounds: rounds.length, avg: avgD }), 'assertive');
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
  const titleColor = outcome === 'record' ? 'text-primary text-glow' : outcome === 'timeout' ? 'text-destructive' : 'text-accent';
  const bestRoundIdx = bestRound ? rounds.indexOf(bestRound) : -1;

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center px-3 py-3 sm:px-4 sm:py-4 md:px-6 overflow-y-auto" style={{ background: 'hsl(var(--brand-navy-deep))' }} role="dialog" aria-label={t('final_resultLabel')}>
      {/* Mapa de continentes tenue detrás (maquetas de cierre) */}
      <div className="fixed inset-0 pointer-events-none opacity-45" aria-hidden>
        <Suspense fallback={null}><WorldBackdrop tone="continents" /></Suspense>
      </div>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, hsl(var(--brand-navy) / 0.25), hsl(var(--brand-navy-deep) / 0.7))' }} aria-hidden />

      {/* Encabezado: marca + modo al centro · sonido, inicio y salir a la derecha */}
      <div className="relative w-full max-w-md md:max-w-5xl grid grid-cols-[1fr_auto_1fr] items-center mb-3 sm:mb-4 animate-fade-in" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 4px)' }}>
        <span />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <img src="/mascot/explorer-logo.webp" alt="" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
            <Wordmark size="md" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-[hsl(205_90%_78%)] mt-0.5">{modeLabel} · {diffLabel}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
          {onToggleMusic && <span className="hidden sm:inline-flex"><HudIconButton icon={musicMuted ? 'mute' : 'sound'} label={musicMuted ? t('music_on') : t('music_off')} onClick={onToggleMusic} /></span>}
          <span className="hidden sm:inline-flex"><HudIconButton icon="home" label={t('final_home')} onClick={() => { playButtonTap(); onGoHome(); }} /></span>
          <HudIconButton icon="close" label={t('final_home')} onClick={() => { playButtonTap(); onGoHome(); }} />
        </div>
      </div>

      <div className="relative w-full max-w-md md:max-w-5xl md:grid md:grid-cols-2 md:gap-5 md:items-stretch">
        {/* ── Columna 1: resumen ── */}
        <section className="rounded-3xl border-2 border-accent/30 bg-card/85 backdrop-blur-sm p-4 sm:p-6 mb-3 md:mb-0 animate-fade-in-up flex flex-col">
          <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-border/70">
            <div className="relative shrink-0">
              <Mascot state={mascot} className={`w-20 sm:w-28 ${outcome === 'record' ? 'drop-shadow-[0_0_16px_hsl(var(--primary)/0.7)]' : ''}`} />
              <span className="absolute -left-1 top-1 text-primary text-sm" aria-hidden>✦</span>
              <span className="absolute -right-1 top-0 text-primary text-xs" aria-hidden>✦</span>
              {outcome === 'complete' && (
                <span className="absolute -right-2 bottom-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_14px_hsl(var(--accent)/0.6)] border-2 border-card" aria-hidden>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                </span>
              )}
              {outcome === 'timeout' && <span className="absolute -right-3 bottom-0 text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" aria-hidden>⏰</span>}
              {outcome === 'record' && <span className="absolute -right-3 bottom-0 text-3xl sm:text-4xl animate-record-pop drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" aria-hidden>🏆</span>}
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl sm:text-[2rem] font-extrabold leading-tight ${titleColor}`}>{title}</h1>
              <p className="text-sm sm:text-base text-foreground/80 mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.18em]">{t('final_totalScore')}</p>
            <p className={`text-4xl sm:text-5xl font-extrabold text-primary leading-tight ${outcome === 'record' ? 'text-glow animate-score-pop' : ''}`} aria-live="polite">
              <CountUp value={totalScore} durationMs={900} format={fmt} /> {t('game_pointsWord')}
            </p>
            {previousBest > 0 && (
              <p className="text-sm sm:text-base mt-1 text-foreground/85">
                {outcome === 'record'
                  ? <>{t('final_prevRecord', { score: fmt(previousBest) })} <span className="text-muted-foreground mx-1">|</span><span className="text-accent font-bold">{t('final_beatBy', { delta: fmt(scoreDelta) })}</span></>
                  : <>{t('final_yourRecord', { score: fmt(previousBest) })}</>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4" role="group" aria-label={t('final_resultLabel')}>
            {statTiles.map((tile, i) => (
              <div key={tile.label} className="rounded-2xl border border-border bg-background/40 px-3 py-2.5 sm:py-3 flex items-center gap-3">
                {tiles ? <span className="text-2xl" aria-hidden>{tile.emoji}</span> : <TileIcon kind={i === 0 ? 'city' : 'pin'} />}
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm text-muted-foreground">{tile.label}</span>
                  <span className="block font-extrabold text-lg sm:text-xl truncate">{tile.value}</span>
                </span>
              </div>
            ))}
          </div>

          {bestRound && (
            <button
              onClick={() => { playButtonTap(); setReview({ view: 'city', idx: Math.max(0, bestRoundIdx) }); }}
              className="mt-2.5 w-full rounded-2xl border-2 border-primary/50 bg-primary/10 hover:bg-primary/15 px-3 py-2.5 sm:py-3 flex items-center gap-3 text-left transition-colors active:scale-[0.99]"
            >
              <span className="text-2xl" aria-hidden>🏆</span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs sm:text-sm text-muted-foreground">{t('final_bestRound')}</span>
                <span className="block font-bold text-sm sm:text-base truncate text-primary">
                  {bestRound.city.name} <span className="font-semibold">· {fmt(bestRound.totalPoints)} pts · {formatDistance(bestRound.distance)}</span>
                </span>
              </span>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
            </button>
          )}

          {rounds.length > 0 && (
            <button
              onClick={() => { playButtonTap(); setReview({ view: 'list', idx: 0 }); }}
              className="mt-2.5 w-full rounded-2xl border border-border bg-background/40 hover:bg-muted/40 px-4 py-2.5 sm:py-3 flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base transition-colors active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground/80" fill="currentColor" aria-hidden><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="17" y="4" width="4" height="17" rx="1" /></svg>
              {variant === 'mundial' ? t('answers_openPlayers') : t('final_detail')}
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-foreground/70" fill="currentColor" aria-hidden><path d="M6 9h12l-6 7z" /></svg>
            </button>
          )}

          {rankPosition !== null && rankTotal > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2.5">
              {rankPosition <= 3
                ? `${rankPosition === 1 ? '👑' : rankPosition === 2 ? '🥈' : '🥉'} ${t('final_top3', { pos: rankPosition })}`
                : rankPosition <= rankTotal
                ? `📊 ${t('final_beatPct', { pct: Math.round(((rankTotal - rankPosition + 1) / rankTotal) * 100) })}`
                : `📈 ${t('final_keepPracticing')}`}
            </p>
          )}

          {/* Comparación con el retador (enlace "Reta a un amigo") */}
          {challengerScore != null && challengerScore > 0 && (
            <div className="mt-3 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-center animate-fade-in">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">⚔️ {t('final_duelResult')}</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('final_challenger')}</p>
                  <p className="font-bold text-sm text-primary">{fmt(challengerScore)}</p>
                </div>
                <span className="text-lg font-black text-muted-foreground">VS</span>
                <div>
                  <p className="text-[9px] text-muted-foreground">{t('final_you')}</p>
                  <p className="font-bold text-sm text-primary">{fmt(totalScore)}</p>
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
                  className="w-24 text-center text-xl font-bold bg-muted border border-border rounded-xl p-2 uppercase tracking-[0.3em]"
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
        <section className="rounded-3xl border-2 border-accent/30 bg-card/85 backdrop-blur-sm p-4 sm:p-6 animate-fade-in-up animation-delay-100 flex flex-col">
          <h2 className="text-xl sm:text-[1.75rem] font-extrabold text-center mb-4">{t('final_tryAgainTitle')}</h2>

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
                className="btn3d w-full rounded-2xl py-3.5 sm:py-4 px-4 flex items-center justify-center gap-4 text-primary-foreground text-left"
                style={{ background: 'var(--grad-cta)' }}
                aria-label={t('final_repeat')}
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg>
                <span className="flex flex-col leading-tight">
                  <span className="font-black text-base sm:text-xl">{t('final_repeat')}</span>
                  <span className="text-xs sm:text-sm font-semibold opacity-80">{t('final_repeatSub')}</span>
                </span>
              </button>
              {onNewGame && (
                <button
                  onClick={() => { playButtonTap(); onNewGame(); }}
                  className="mt-3 w-full rounded-2xl py-3 sm:py-3.5 border-2 border-accent text-accent font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_16px_hsl(var(--accent)/0.25)] hover:bg-accent/10 transition-colors active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
                  {t('final_newGame')}
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
            className="mt-3 w-full rounded-2xl py-3 border-2 border-foreground/25 bg-background/30 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 hover:bg-muted/50 transition-colors active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden><path d="M12 3.2 2.5 11.5h2.8V20h5v-5.5h3.4V20h5v-8.5h2.8Z" /></svg>
            {t('final_home')}
          </button>

          <div className="h-px bg-border my-4" />

          <div className={`grid gap-2.5 ${onShareChallenge ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={handleShare}
              disabled={sharing || sharingVideo}
              className="rounded-2xl py-2.5 sm:py-3 border border-foreground/20 bg-background/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {sharing ? <span aria-hidden>⏳</span> : <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="18" cy="5.5" r="2.5" fill="currentColor" /><circle cx="6" cy="12" r="2.5" fill="currentColor" /><circle cx="18" cy="18.5" r="2.5" fill="currentColor" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></svg>}
              {t('final_shareShort')}
            </button>
            {/* El reto por enlace solo existe para el Clásico */}
            {onShareChallenge && (
              <button
                onClick={() => { playShareSuccess(); onShareChallenge(); }}
                className="rounded-2xl py-2.5 sm:py-3 border border-foreground/20 bg-background/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M4 4l10 10M14 14l-2.5 2.5M14 14l2.5-2.5M16 18l2 2M20 4 10 14M10 14l2.5 2.5M10 14l-2.5-2.5M8 18l-2 2" /></svg>
                {t('final_challengeShort')}
              </button>
            )}
          </div>
          {canRecordVideo() && (
            <button
              onClick={handleShareVideo}
              disabled={sharing || sharingVideo}
              className="mt-3 w-full text-xs sm:text-sm text-foreground/80 hover:text-foreground flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sharingVideo ? <span aria-hidden>⏳</span> : <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></svg>}
              <span className="underline underline-offset-2">{t('final_moreShare')}</span> <span aria-hidden>›</span>
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
              className="mt-3 w-full rounded-2xl py-2.5 border border-foreground/15 bg-background/30 text-xs sm:text-sm font-semibold hover:bg-muted/50 transition-colors active:scale-[0.98]"
            >
              <span aria-hidden>👑</span> GeoSpeed Pro <span className="text-muted-foreground mx-1">·</span><span className="text-primary">{t('final_proLink').replace(/^GeoSpeed Pro\s*·\s*/, '')}</span>
            </button>
          )}

          {(!user || isAnonymous) && (
            <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/5 p-3 text-center animate-fade-in animation-delay-500">
              <p className="text-xs sm:text-sm font-bold mb-1">{t('final_nudgeTitle')}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">{t('final_nudgeDesc')}</p>
              <a href="/auth?mode=signup" className="inline-block px-4 py-2 rounded-xl text-xs font-bold border border-accent/50 text-accent hover:bg-accent/10 transition-colors active:scale-[0.97]">
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

/** Íconos de las fichas Ciudades / Distancia media (maqueta) */
function TileIcon({ kind }: { kind: 'city' | 'pin' }) {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-accent shrink-0" fill="currentColor" aria-hidden>
      {kind === 'city'
        ? <path d="M3 21V10h4v11H3Zm5 0V4h5v17H8Zm6 0V8h3v13h-3Zm4 0v-7h3v7h-3Z" opacity="0.9" />
        : <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Zm0-9.6a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" />}
    </svg>
  );
}
