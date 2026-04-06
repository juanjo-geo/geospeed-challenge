import { useState, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { type RoundResult } from './GameScreen';
import { formatDistance, qualifiesForLeaderboard, addToLeaderboard, updatePlayerStats, getPlayerStats, getLeaderboard } from '@/lib/gameUtils';
import { playVictory } from '@/lib/sounds';
import { useAuth } from '@/hooks/useAuth';
import { shareResult } from '@/lib/shareCard';
import { getPlayerLevel } from '@/lib/levelSystem';
import { fireCelebration } from '@/lib/confetti';
import { hapticCelebration } from '@/lib/haptics';
import RoundBreakdown from './RoundBreakdown';
import ReplayMap from './ReplayMap';
import { type GameMode } from '@/data/cities';
import { announce } from './ScreenReaderAnnouncer';
import { useI18n } from '@/i18n';

interface FinalResultScreenProps {
  rounds: RoundResult[];
  totalScore: number;
  difficulty: string;
  mode: string;
  reason: 'timeout' | 'complete';
  onPlayAgain: () => void;
  onGoHome: () => void;
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
  totalRounds = 13,
}: FinalResultScreenProps) {
  const { user, displayName: authName } = useAuth();
  const { t } = useI18n();
  const [initials, setInitials] = useState('');
  const [saved, setSaved] = useState(false);
  const [qualifies, setQualifies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [rankTotal, setRankTotal] = useState<number>(0);
  const [xpAnimProgress, setXpAnimProgress] = useState<number>(0);

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
    updatePlayerStats(totalScore, distances);
    qualifiesForLeaderboard(totalScore).then(setQualifies);
    if (reason === 'complete') playVictory();

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
    setSharing(true);
    await shareResult({
      playerName: authName || initials || 'Jugador',
      score: totalScore,
      mode,
      difficulty,
      avgDistance: formatDistance(avgDistance),
      cities: rounds.length,
      totalCities: totalRounds,
    });
    setSharing(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-start sm:items-center justify-center px-3 py-4 sm:px-4 sm:py-6 md:p-6 overflow-y-auto game-bg">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in-up relative overflow-hidden" role="dialog" aria-label={t('final_resultLabel')}>

        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, hsl(var(--primary)/0) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0) 100%)` }} />

        {reason === 'timeout' && (
          <div className="text-center mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl block animate-record-pop" role="img" aria-label={t('final_timeout')}>⏰</span>
            <p className="text-red-400 font-bold mt-1 sm:mt-2 text-sm sm:text-base">{t('final_timeout')}</p>
          </div>
        )}
        {reason === 'complete' && (
          <div className="text-center mb-3 sm:mb-4">
            <span
              className={`text-3xl sm:text-5xl block ${isNewRecord ? 'animate-record-pop' : 'animate-fade-in'}`}
              role="img"
              aria-label="Felicidades"
              style={isNewRecord ? { filter: 'drop-shadow(0 0 16px hsl(44 91% 61% / 0.7))' } : {}}
            >
              {isNewRecord ? '🏆' : '🎉'}
            </span>
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
            {totalScore.toLocaleString()}
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
                <p className="text-[10px] sm:text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>Nv.{level.level} {level.title}</p>
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

        {/* Best round highlight */}
        {bestRound && bestRound.totalPoints >= 500 && (
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
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
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

        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full py-2.5 sm:py-3 md:py-3.5 rounded-lg font-bold text-sm sm:text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 mb-2 sm:mb-3 md:mb-4 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(332 47% 45%))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 4px 20px hsl(var(--primary) / 0.35)' }}
          aria-label={t('final_share')}
        >
          {sharing ? `⏳ ${t('final_sharing')}` : `📸 ${t('final_share')}`}
        </button>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-[0.97]"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {t('final_playAgain')}
          </button>
          <button
            onClick={onGoHome}
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
    </div>
  );
}