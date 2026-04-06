import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerStats, getGameHistory, formatDistance, type GameHistoryEntry } from '@/lib/gameUtils';
import { getPlayerLevel, getPlayerBadges, type PlayerLevel, type Badge } from '@/lib/levelSystem';
import { getEnergy } from '@/lib/energySystem';
import { useI18n } from '@/i18n';

const AVATARS = ['🌍', '🗺️', '🧭', '✈️', '🚀', '🏔️', '🌋', '🏝️', '🎯', '👑', '⚡', '🔮', '🦅', '🐉', '🎲', '🛸'];
const AVATAR_KEY = 'geospeed_avatar';

const LEVELS_CONFIG: { minXp: number; title: string; emoji: string }[] = [
  { minXp: 0, title: 'Novato', emoji: '🌱' },
  { minXp: 500, title: 'Explorador', emoji: '🧭' },
  { minXp: 1500, title: 'Viajero', emoji: '✈️' },
  { minXp: 3500, title: 'Navegante', emoji: '🗺️' },
  { minXp: 7000, title: 'Geógrafo', emoji: '🌍' },
  { minXp: 12000, title: 'Cartógrafo', emoji: '📐' },
  { minXp: 20000, title: 'Maestro', emoji: '🎓' },
  { minXp: 35000, title: 'Leyenda', emoji: '👑' },
  { minXp: 60000, title: 'Oráculo', emoji: '🔮' },
  { minXp: 100000, title: 'Deidad Geo', emoji: '⚡' },
];

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, displayName } = useAuth();
  const { t } = useI18n();
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || '🌍');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [tab, setTab] = useState<'stats' | 'levels' | 'badges' | 'history'>('stats');

  const stats = getPlayerStats();
  const history = getGameHistory();
  const level = getPlayerLevel();
  const badges = getPlayerBadges();
  const energy = getEnergy();
  const avgDist = stats.totalRounds > 0 ? stats.totalDistance / stats.totalRounds : 0;
  const totalXp = level.xp;

  const selectAvatar = (emoji: string) => {
    setAvatar(emoji);
    localStorage.setItem(AVATAR_KEY, emoji);
    setShowAvatarPicker(false);
  };

  const unlockedBadges = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      <div className="w-full max-w-lg animate-fade-in-up">

        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="text-sm font-bold px-3 py-2 rounded-lg border border-border hover:bg-muted transition-all active:scale-[0.97]"
            aria-label="Volver al menú"
          >
            ← Volver
          </button>
          <h1
            className="text-xl sm:text-2xl font-black flex-1 text-center"
            style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}
          >
            {t('profile_title')}
          </h1>
          <div className="w-[72px]" /> {/* Spacer for centering */}
        </div>

        {/* Avatar + Name + Level card */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-4 sm:mb-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/0) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0) 100%)' }} />

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center text-3xl sm:text-4xl transition-all hover:scale-105 active:scale-95"
              style={{ borderColor: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }}
              aria-label="Cambiar avatar"
            >
              {avatar}
              <span className="absolute -bottom-0.5 -right-0.5 text-xs bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center">✏️</span>
            </button>

            {/* Name + Level */}
            <div className="flex-1 min-w-0">
              <p className="font-black text-base sm:text-lg truncate text-foreground">
                {displayName || user?.email?.split('@')[0] || 'Jugador'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base">{level.emoji}</span>
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  Nv.{level.level} {level.title}
                </span>
              </div>
              {/* XP bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                  <span>{totalXp.toLocaleString()} XP</span>
                  <span>{level.xpForNext.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${level.progress}%`,
                      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                      boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Avatar picker */}
          {showAvatarPicker && (
            <div className="mt-4 pt-4 border-t border-border animate-fade-in">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('profile_chooseAvatar')}</p>
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => selectAvatar(emoji)}
                    className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg transition-all active:scale-90 ${
                      avatar === emoji
                        ? 'bg-primary/20 border-2 border-primary scale-110'
                        : 'bg-muted/50 border border-transparent hover:border-primary/30 hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 sm:gap-1.5 mb-4 bg-muted/50 p-1 rounded-xl">
          {([
            { id: 'stats', label: t('profile_stats'), icon: '📊' },
            { id: 'levels', label: t('profile_levels'), icon: '🏅' },
            { id: 'badges', label: t('profile_badges'), icon: '🎖️' },
            { id: 'history', label: t('profile_history'), icon: '📜' },
          ] as const).map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-[0.97] ${
                tab === tabItem.id
                  ? 'bg-card shadow-md text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="block text-sm sm:text-base mb-0.5">{tabItem.icon}</span>
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {tab === 'stats' && (
            <StatsTab stats={stats} avgDist={avgDist} totalXp={totalXp} energy={energy} history={history} />
          )}
          {tab === 'levels' && (
            <LevelsTab currentLevel={level} />
          )}
          {tab === 'badges' && (
            <BadgesTab badges={badges} unlockedCount={unlockedBadges} />
          )}
          {tab === 'history' && (
            <HistoryTab history={history} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Stats Tab ── */
function StatsTab({ stats, avgDist, totalXp, energy, history }: {
  stats: ReturnType<typeof getPlayerStats>;
  avgDist: number;
  totalXp: number;
  energy: ReturnType<typeof getEnergy>;
  history: GameHistoryEntry[];
}) {
  const { t } = useI18n();
  const bestGame = history.length > 0 ? history.reduce((best, g) => g.score > best.score ? g : best, history[0]) : null;
  const totalGames = stats.gamesPlayed;
  const classicGames = history.filter(g => g.type === 'classic').length;
  const taGames = history.filter(g => g.type === 'timeattack').length;
  const dailyGames = history.filter(g => g.type === 'daily').length;

  return (
    <div className="space-y-3">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatBlock label={t('profile_gamesPlayed')} value={totalGames.toString()} icon="🎮" />
        <StatBlock label="Récord personal" value={stats.bestScore.toLocaleString()} icon="🏆" highlight />
        <StatBlock label={t('profile_avgDist')} value={formatDistance(avgDist)} icon="📍" />
        <StatBlock label={t('profile_totalRounds')} value={stats.totalRounds.toLocaleString()} icon="🔄" />
        <StatBlock label={t('profile_totalXP')} value={totalXp.toLocaleString()} icon="⚡" />
        <StatBlock label={t('profile_lives')} value={`${energy.lives}/5`} icon="❤️" />
      </div>

      {/* Modes breakdown */}
      {totalGames > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('profile_byMode')}</p>
          <div className="space-y-2">
            <ModeBar label="Clásico" count={classicGames} total={totalGames} color="hsl(var(--primary))" />
            <ModeBar label="Contrarreloj" count={taGames} total={totalGames} color="hsl(332 47% 55%)" />
            <ModeBar label="Desafío Diario" count={dailyGames} total={totalGames} color="hsl(48 96% 53%)" />
          </div>
        </div>
      )}

      {/* Best game */}
      {bestGame && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('profile_bestGame')}</p>
          <p className="font-black text-lg sm:text-xl" style={{ color: 'hsl(var(--primary))' }}>
            {bestGame.score.toLocaleString()} pts
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {bestGame.date} · {bestGame.rounds} rondas · {formatDistance(bestGame.avgDistance)} prom.
          </p>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded-xl p-3 sm:p-4 text-center ${highlight ? 'border-primary/30' : 'border-border'}`}>
      <span className="text-lg sm:text-xl block mb-1">{icon}</span>
      <p className={`font-mono font-black text-base sm:text-lg ${highlight ? '' : ''}`}
        style={highlight ? { color: 'hsl(var(--primary))' } : {}}
      >
        {value}
      </p>
      <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function ModeBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] sm:text-xs text-muted-foreground w-24 sm:w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] sm:text-xs font-mono font-bold w-8 text-right">{count}</span>
    </div>
  );
}

/* ── Levels Tab ── */
function LevelsTab({ currentLevel }: { currentLevel: PlayerLevel }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {LEVELS_CONFIG.map((lvl, i) => {
        const lvlNumber = i + 1;
        const isCurrentOrPast = currentLevel.level >= lvlNumber;
        const isCurrent = currentLevel.level === lvlNumber;

        return (
          <div
            key={lvlNumber}
            className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all ${
              isCurrent
                ? 'border-primary/50 bg-primary/10 shadow-md'
                : isCurrentOrPast
                ? 'border-primary/20 bg-card'
                : 'border-border bg-card/50 opacity-50'
            }`}
          >
            <span className={`text-xl sm:text-2xl ${!isCurrentOrPast ? 'grayscale' : ''}`}>{lvl.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xs sm:text-sm font-bold ${isCurrent ? '' : ''}`}
                  style={isCurrent ? { color: 'hsl(var(--primary))' } : {}}
                >
                  Nv.{lvlNumber} {lvl.title}
                </span>
                {isCurrent && (
                  <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                    Actual
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                {lvl.minXp.toLocaleString()} XP requeridos
              </p>
            </div>
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {isCurrentOrPast ? (
                <span className="text-green-400 text-sm">✓</span>
              ) : (
                <span className="text-muted-foreground text-xs">🔒</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Badges Tab ── */
function BadgesTab({ badges, unlockedCount }: { badges: Badge[]; unlockedCount: number }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="text-center mb-3 sm:mb-4">
        <p className="text-2xl sm:text-3xl font-black" style={{ color: 'hsl(var(--primary))' }}>
          {unlockedCount}/{badges.length}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('profile_badgesUnlocked')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border text-center transition-all ${
              badge.unlocked
                ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                : 'border-border bg-card/50 opacity-40 grayscale'
            }`}
          >
            <span className={`text-2xl sm:text-3xl ${badge.unlocked ? 'animate-fade-in' : ''}`}>{badge.emoji}</span>
            <p className="text-[9px] sm:text-[10px] font-bold text-foreground leading-tight">{badge.name}</p>
            <p className="text-[7px] sm:text-[8px] text-muted-foreground leading-tight">{badge.description}</p>
            {badge.unlocked && (
              <span className="text-[7px] sm:text-[8px] font-bold text-green-400 mt-0.5">{t('profile_unlocked')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── History Tab ── */
function HistoryTab({ history }: { history: GameHistoryEntry[] }) {
  const { t } = useI18n();
  if (history.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-3xl sm:text-4xl mb-2">🕹️</p>
        <p className="text-sm text-muted-foreground">{t('profile_noGames')}</p>
      </div>
    );
  }

  const typeLabels: Record<string, { label: string; emoji: string }> = {
    classic: { label: 'Clásico', emoji: '🎮' },
    timeattack: { label: 'Contrarreloj', emoji: '⏱️' },
    daily: { label: 'Diario', emoji: '📅' },
  };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {history.map((game, i) => {
        const t = typeLabels[game.type] || typeLabels.classic;
        return (
          <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-2.5 sm:p-3">
            <span className="text-lg sm:text-xl shrink-0">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>
                  {game.score.toLocaleString()} pts
                </span>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground">{t.label}</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                {game.rounds} rondas · {formatDistance(game.avgDistance)} prom. · {game.difficulty}
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground shrink-0">{game.date}</span>
          </div>
        );
      })}
    </div>
  );
}
