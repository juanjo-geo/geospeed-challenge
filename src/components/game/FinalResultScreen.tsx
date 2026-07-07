import { useState, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { type RoundResult } from './GameScreen';
import CountUp from '@/components/ui/CountUp';
import { formatDistance, qualifiesForLeaderboard, addToLeaderboard, updatePlayerStats, getPlayerStats, getLeaderboard } from '@/lib/gameUtils';
import { isPro } from '@/lib/premiumSystem';
import { playVictory, playLevelUp, playRevengeActivate, playShareSuccess, playButtonTap } from '@/lib/sounds';
import { useAuth } from '@/hooks/useAuth';
import { shareResult } from '@/lib/shareCard';
import { canRecordVideo, shareVideo } from '@/lib/shareVideo';
import { getPlayerLevel, checkLevelUp, calculateXP } from '@/lib/levelSystem';
import { fireCelebration } from '@/lib/confetti';
import { hapticCelebration } from '@/lib/haptics';
import RoundBreakdown from './RoundBreakdown';
import Mascot, { type MascotState } from './Mascot';
import ReplayMap from './ReplayMap';
import { type GameMode } from '@/data/cities';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';
import { tLevelTitle } from '@/lib/gameI18n';
import { recordGameResult, getContextualOffer, type FrustrationOffer } from '@/lib/frustrationDetector';
import FrustrationOfferModal from './FrustrationOfferModal';

interface FinalResultScreenProps {
  rounds: RoundResult[];
  totalScore: number;
  difficulty: string;
  mode: string;
  reason: 'timeout' | 'complete';
  onPlayAgain: () => void;
  onGoHome: () => void;
  onRevenge?: (rounds: RoundResult[]) => void;
  onShareChallenge?: () => void;
  onOpenStore?: () => void;
  challengerScore?: number | null;
  totalRounds?: number;
}

export default function FinalResultScreen({
  rounds,
  totalScore,
  difficulty,
  mode,
  reason,
  onPlayAgain,
  onGoHome,
  onRevenge,
  onShareChallenge,
  onOpenStore,
  challengerScore,
  totalRounds = 13,
}: FinalResultScreenProps) {
  const { user, displayName: authName } = useAuth();
  const { t, locale } = useI18n();
  const [initials, setInitials] = useState('');
  const [saved, setSaved] = useState(false);
  const [qualifies, setQualifies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [rankTotal, setRankTotal] = useState<number>(0);
  const [xpAnimProgress, setXpAnimProgress] = useState<number>(0);
  const [frustrationOffer, setFrustrationOffer] = useState<FrustrationOffer | null>(null);

  useEffect(() => {
    if (authName && authName.length >= 3) {
      setInitials(authName.substring(0, 3).toUpperCase());
    }
  }, [authName]);

  const distances = rounds.map(r => r.distance);
  const avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
  const bestMultiplier = rounds.length > 0 ? Math.max(...rounds.map(r => r.multiplier)) : 0;
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

  useEffect(() => {
    const stats = getPlayerStats();
    setPreviousBest(stats.bestScore);
    const prevXp = calculateXP();
    updatePlayerStats(totalScore, distances);
    qualifiesForLeaderboard(totalScore, mode).then(setQualifies);
    if (reason === 'complete') playVictory();

    // Level up check — play fanfare if player leveled up
    const newXp = prevXp + totalScore;
    const levelResult = checkLevelUp(prevXp, newXp);
    if (levelResult.leveled) {
      setTimeout(() => playLevelUp(), reason === 'complete' ? 900 : 400);
    }

    // Fire confetti for new records (check after setting previousBest)
    if (totalScore > stats.bestScore && stats.bestScore > 0) {
      setTimeout(() => { fireCelebration(); hapticCelebration(); }, 400);
    }

    // Fetch ranking position for social comparison
    getLeaderboard(mode).then(board => {
      setRankTotal(board.length);
      const pos = board.findIndex(e => totalScore >= e.score);
      setRankPosition(pos === -1 ? board.length + 1 : pos + 1);
    });

    // Record frustration data and show contextual offer after a delay
    recordGameResult({ score: totalScore, avgDistance, reason });
    const offerTimer = setTimeout(() => {
      const offer = getContextualOffer();
      if (offer) setFrustrationOffer(offer);
    }, 2500); // Show after 2.5s — let player absorb their score first

    // Screen reader announcement
    const avgD = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);
    announce(
      t('sr_announceGameOver', {
        score: totalScore.toLocaleString(),
        rounds: rounds.length,
        avg: avgD,
      }),
      'assertive'
    );
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts(useMemo(() => ({
    'Enter': onPlayAgain,
    'Escape': onGoHome,
  }), [onPlayAgain, onGoHome]));

  const isNewRecord = totalScore > previousBest && previousBest > 0;
  const mascotResult: MascotState = (isNewRecord || avgDistance < 800) ? 'celebrate' : 'wink';
  const userIsPro = isPro();
  const scoreDelta = previousBest > 0 ? totalScore - previousBest : 0;
  const level = getPlayerLevel();

  // Animate XP bar from previous progress to current progress
  useEffect(() => {
    // Start at 0 (or a lower value) and animate to the actual progress
    setXpAnimProgress(0);
    const timer = setTimeout(() => setXpAnimProgress(level.progress), 300);
    return () => clearTimeout(timer);
  }, [level.progress]);

  const handleShare = async () => {
    playShareSuccess();
    setSharing(true);
    await shareResult({
      playerName: authName || initials || 'Jugador',
      score: totalScore,
      mode,
      difficulty,
      avgDistance: formatDistance(avgDistance),
      cities: rounds.length,
      totalCities: totalRounds,
      rounds: rounds.map(r => ({
        clickLat: r.clickLat,
        clickLon: r.clickLon,
        cityLat: r.city.lat,
        cityLon: r.city.lon,
        distance: r.distance,
      })),
    });
    setSharing(false);
  };

  // Video share
  const [sharingVideo, setSharingVideo] = useState(false);

  const handleShareVideo = async () => {
    playShareSuccess();
    setSharingVideo(true);
    try {
      const success = await shareVideo({
        playerName: authName || initials || 'Jugador',
        totalScore,
        mode,
        difficulty,
        totalCities: rounds.length,
        bestRound: {
          clickLat: bestRound.clickLat,
          clickLon: bestRound.clickLon,
          cityLat: bestRound.city.lat,
          cityLon: bestRound.city.lon,
          cityName: bestRound.city.name,
          distance: bestRound.distance,
          score: bestRound.totalPoints,
        },
      });
      if (!success) {
        // Fallback to image share
        await handleShare();
      }
    } catch {
      await handleShare();
    }
    setSharingVideo(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-start sm:items-center justify-center px-3 py-4 sm:px-4 sm:py-6 md:p-6 overflow-y-auto game-bg">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in-up relative overflow-hidden" role="dialog" aria-label={t('final_resultLabel')}>

        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, hsl(var(--primary)/0) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0) 100%)` }} />

        {reason === 'timeout' && (
          <div className="text-center mb-3 sm:mb-4">
            <Mascot state={mascotResult} className="w-20 sm:w-24 mx-auto" />
            <p className="text-red-400 font-bold mt-1 sm:mt-2 text-sm sm:text-base">⏰ {t('final_timeout')}</p>
          </div>
        )}
        {reason === 'complete' && (
          <div className="text-center mb-3 sm:mb-4">
            <div className="relative inline-block">
              {isNewRecord && <span className="absolute -top-1 -right-2 text-xl sm:text-2xl animate-record-pop">🏆</span>}
              <Mascot state={mascotResult} className={`w-24 sm:w-28 mx-auto ${isNewRecord ? 'drop-shadow-[0_0_16px_hsl(44_91%_61%/0.7)]' : ''}`} />
            </div>
            <p
              className={`font-black mt-1 sm:mt-2 text-sm sm:text-base ${isNewRecord ? 'text-glow' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
            >
              {isNewRecord ? t('final_newRecord') : t('final_gameOver')}
            </p>
          </div>
        )}

        <div className="text-center mb-4 sm:mb-5 md:mb-6">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2">{t('final_totalScore')}</p>
          <p
            className={`text-3xl sm:text-4xl md:text-5xl font-black font-mono ${isNewRecord ? 'text-glow animate-score-pop' : ''}`}
            style={{ color: 'hsl(var(--primary))' }}
            aria-live="polite"
          >
            <CountUp value={totalScore} durationMs={900} />
          </p>
          {previousBest > 0 && (
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isNewRecord ? 'text-green-400' : scoreDelta >= 0 ? 'text-muted-foreground' : 'text-red-400'}`}>
              {isNewRecord
                ? `🔥 ${t('final_beatBy', { delta: scoreDelta.toLocaleString() })}`
                : scoreDelta >= 0
                ? `Récord: ${previousBest.toLocaleString()}`
                : `${scoreDelta.toLocaleString()} pts vs récord (${previousBest.toLocaleString()})`
              }
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-5 md:mb-6" role="group" aria-label="Estadísticas de la partida">
          <div className="bg-muted rounded-lg p-1.5 sm:p-2 md:p-3 text-center">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">{t('final_citiesCompleted')}</p>
            <p className="font-mono font-bold text-xs sm:text-sm md:text-base">{rounds.length}/{totalRounds}</p>
          </div>
          <div className="bg-muted rounded-lg p-1.5 sm:p-2 md:p-3 text-center">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">{t('final_avgDistance')}</p>
            <p className="font-mono font-bold text-[10px] sm:text-xs md:text-sm">{formatDistance(avgDistance)}</p>
          </div>
          <div className="bg-muted rounded-lg p-1.5 sm:p-2 md:p-3 text-center">
            <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">{t('final_level')}</p>
            <p className="font-mono font-bold text-xs sm:text-sm md:text-base">×{bestMultiplier}</p>
          </div>
        </div>

        {/* ── Upsell Pro en el pico emocional (buena partida / récord) ── */}
        {!userIsPro && onOpenStore && (isNewRecord || avgDistance < 1500 || (rankPosition !== null && rankPosition <= 10)) && (
          <button
            onClick={() => { playButtonTap(); onOpenStore(); }}
            className="w-full flex items-center gap-3.5 rounded-2xl p-4 sm:p-5 mb-3 sm:mb-4 border-2 border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 hover:from-primary/25 transition-all active:scale-[0.98] animate-pulse-glow-subtle text-left"
          >
            <Mascot state="celebrate" className="w-16 sm:w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm sm:text-lg" style={{ color: 'hsl(var(--primary))' }}>⭐ {t('final_proUpsellTitle')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t('final_proUpsellDesc')}</p>
            </div>
            <span className="text-primary font-black text-2xl sm:text-3xl shrink-0">›</span>
          </button>
        )}

        {/* Social comparison */}
        {rankPosition !== null && rankTotal > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 text-center">
            {rankPosition <= 3 ? (
              <p className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>
                {rankPosition === 1 ? '👑' : rankPosition === 2 ? '🥈' : '🥉'} ¡Estás en el Top {rankPosition} del ranking!
              </p>
            ) : rankPosition <= rankTotal ? (
              <p className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>
                📊 Superaste al {Math.round(((rankTotal - rankPosition + 1) / rankTotal) * 100)}% de los jugadores
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">
                📈 ¡Sigue practicando para subir en el ranking!
              </p>
            )}
          </div>
        )}

        {/* Level progress — animated XP bar */}
        <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">{level.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] sm:text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>Nv.{level.level} {tLevelTitle(level.title, locale)}</p>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">{level.xp.toLocaleString()} XP</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-background rounded-full mt-1 overflow-hidden relative">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpAnimProgress}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                    transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
                  }}
                />
              </div>
            </div>
          </div>
          {totalScore > 0 && (
            <p className="text-center text-[9px] sm:text-[10px] font-bold mt-1.5 animate-fade-in" style={{ color: 'hsl(var(--primary))' }}>
              {t('final_xpGained', { xp: totalScore.toLocaleString() })}
            </p>
          )}
        </div>

        {/* INSTANT REPLAY — prominent CTA */}
        <button
          onClick={() => { playButtonTap(); onPlayAgain(); }}
          className="w-full py-3.5 sm:py-4 rounded-xl font-black text-base sm:text-lg transition-all active:scale-[0.95] flex items-center justify-center gap-2 mb-4 sm:mb-5 animate-fade-in shadow-lg hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(44 91% 50%), hsl(var(--primary)))',
            color: 'hsl(var(--primary-foreground))',
            boxShadow: '0 6px 24px hsl(var(--primary) / 0.4)',
            animation: 'fade-in-up 0.5s ease-out, pulse 2s ease-in-out 2s infinite',
          }}
          aria-label="Jugar otra vez con las mismas ciudades para aprendértelas"
        >
          <span className="flex flex-col items-center leading-tight">
            <span>🔄 OTRA VEZ</span>
            <span className="text-[10px] sm:text-xs font-bold opacity-80 normal-case">¡Apréndete estas! · mismas ciudades</span>
          </span>
        </button>

        {/* Best round highlight */}
        {bestRound && bestRound.totalPoints >= 300 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 text-center">
            <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">🌟 Mejor ronda</p>
            <p className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>
              {bestRound.city.name} — {bestRound.totalPoints.toLocaleString()} pts ({formatDistance(bestRound.distance)})
            </p>
          </div>
        )}

        {/* Replay map — shows all clicks on the world map */}
        {rounds.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider text-center mb-1.5">
              Mapa de la partida
            </p>
            <ReplayMap rounds={rounds} gameMode={(mode as GameMode) || 'world'} />
          </div>
        )}

        <RoundBreakdown rounds={rounds} />

        {qualifies && !saved && (
          <div className="mb-4 sm:mb-5 md:mb-6 text-center">
            <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: 'hsl(var(--primary))' }}>
              🏆 ¡Entraste al Top 10! {t('final_enterInitials')}
            </p>
            <div className="flex justify-center gap-2 mb-2 sm:mb-3">
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={e => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                className="w-20 sm:w-24 text-center text-xl sm:text-2xl font-mono font-bold bg-muted border rounded-lg p-1.5 sm:p-2 uppercase tracking-[0.3em]"
                placeholder="___"
                autoFocus
                aria-label={t('final_enterInitials')}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={initials.length !== 3 || saving}
              className="px-5 sm:px-6 py-2 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 5px 0 rgba(150,108,20,0.95)' }}
            >
              {saving ? t('final_saved') : t('final_saveScore')}
            </button>
          </div>
        )}

        {saved && (
          <p className="text-center text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6" style={{ color: 'hsl(var(--primary))' }} role="status">
            ✅ {t('final_saved')}
          </p>
        )}

        <div className="flex gap-2 mb-2 sm:mb-3 md:mb-4">
          <button
            onClick={handleShare}
            disabled={sharing || sharingVideo}
            className="flex-1 py-2.5 sm:py-3 md:py-3.5 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(332 47% 45%))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 4px 20px hsl(var(--primary) / 0.35)' }}
            aria-label={t('final_share')}
          >
            {sharing ? `⏳ ${t('final_sharing')}` : `📸 ${t('final_share')}`}
          </button>
          {canRecordVideo() && (
            <button
              onClick={handleShareVideo}
              disabled={sharing || sharingVideo}
              className="py-2.5 sm:py-3 md:py-3.5 px-4 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)' }}
              aria-label="Compartir video"
            >
              {sharingVideo ? '⏳' : '🎬'}
            </button>
          )}
        </div>
        {/* Revenge mode — replay worst rounds */}
        {onRevenge && rounds.length >= 5 && (
          <button
            onClick={() => { playRevengeActivate(); onRevenge(rounds); }}
            className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 mb-2 sm:mb-3"
            style={{
              background: 'linear-gradient(135deg, hsl(0 72% 50%), hsl(25 95% 53%))',
              color: '#fff',
              boxShadow: '0 4px 20px hsla(0, 72%, 50%, 0.35)',
            }}
          >
            🔥 REVANCHA — Mejora tus 5 peores
          </button>
        )}

        {/* Challenge comparison — shows when coming from a friend's challenge link */}
        {challengerScore != null && challengerScore > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg p-3 mb-3 text-center animate-fade-in">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">⚔️ Resultado del duelo</p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-[9px] text-muted-foreground">Retador</p>
                <p className="font-mono font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}>{challengerScore.toLocaleString()}</p>
              </div>
              <span className="text-lg font-black text-muted-foreground">VS</span>
              <div>
                <p className="text-[9px] text-muted-foreground">Tú</p>
                <p className="font-mono font-bold text-sm" style={{ color: 'hsl(var(--primary))' }}><CountUp value={totalScore} durationMs={900} /></p>
              </div>
            </div>
            <p className="font-bold text-xs mt-2" style={{ color: totalScore > challengerScore ? '#22c55e' : totalScore === challengerScore ? 'hsl(var(--primary))' : '#ef4444' }}>
              {totalScore > challengerScore ? '🏆 ¡Ganaste el duelo!' : totalScore === challengerScore ? '🤝 ¡Empate!' : '😤 El retador te superó'}
            </p>
          </div>
        )}

        {/* Challenge a friend button */}
        {onShareChallenge && (
          <button
            onClick={() => { playShareSuccess(); onShareChallenge?.(); }}
            className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 mb-2 sm:mb-3"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
            }}
          >
            ⚔️ RETA A UN AMIGO
          </button>
        )}

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => { playButtonTap(); onGoHome(); }}
            className="flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold text-xs sm:text-sm border border-border transition-all active:scale-[0.97] hover:bg-muted"
          >
            {t('final_home')}
          </button>
        </div>

        {/* Registration nudge — show after first game if not logged in */}
        {!user && (
          <div className="mt-3 sm:mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 text-center animate-fade-in animation-delay-500">
            <p className="text-xs sm:text-sm text-foreground font-bold mb-1">🔒 ¿Quieres guardar tu progreso?</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2.5">
              Regístrate para conservar tus puntuaciones, nivel y badges en todos tus dispositivos.
            </p>
            <a
              href="/auth"
              className="inline-block px-5 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97] border border-primary/40 text-primary hover:bg-primary/10"
            >
              CREAR CUENTA GRATIS
            </a>
          </div>
        )}
      </div>

      {/* Frustration-based contextual offer */}
      {frustrationOffer && (
        <FrustrationOfferModal
          offer={frustrationOffer}
          onAccept={(action) => {
            setFrustrationOffer(null);
            if (action === 'store' && onOpenStore) onOpenStore();
            else if (action === 'pro' && onOpenStore) onOpenStore();
            else if (action === 'ad') { /* rewarded ad callback */ }
          }}
          onDismiss={() => setFrustrationOffer(null)}
        />
      )}
    </div>
  );
}