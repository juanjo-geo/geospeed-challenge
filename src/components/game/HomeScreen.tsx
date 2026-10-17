import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Difficulty, GameMode, MODE_CONFIG } from '@/data/cities';
import { getPlayerStats, getLeaderboard, getDailyPlayerCount, type LeaderboardEntry, type LeaderboardPeriod } from '@/lib/gameUtils';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerLevel, getPlayerBadges } from '@/lib/levelSystem';
import DailyChestModal from './DailyChestModal';
import { checkStreak, claimDailyReward, getStreakAtRisk, protectStreak, type StreakReward } from '@/lib/dailyStreak';
import EnergyBar from './EnergyBar';
import AutoDemo from './AutoDemo';
import Mascot from './Mascot';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import { playButtonTap, playAccordion } from '@/lib/sounds';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';
import { getReferralProgress, claimReferralReward } from '@/lib/referralSystem';
import { tLevelTitle, tBadgeName, tBadgeDesc } from '@/lib/gameI18n';
import Wordmark from '@/components/ui/Wordmark';

interface HomeScreenProps {
  onStartGame: (difficulty: Difficulty, mode: GameMode) => void;
  onMultiplayer: () => void;
  onTimeAttack: () => void;
  onDailyChallenge: () => void;
  onWorldChallenge: () => void;
  onStartTraining: () => void;
  /** F4: bandeja Mis retos (4ª tarjeta de acceso) */
  onMyChallenges?: () => void;
  onSpeedDemon?: () => void;
  onOpenStore?: () => void;
  onOpenProfile?: () => void;
  onOpenBattlePass?: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onMoreModes?: () => void;
  onHowToPlay?: () => void;
}

/** Dificultades: clave de datos, emoji y nivel de desbloqueo (D12: candado visible). */
const DIFF_CONFIG: { key: Difficulty; emoji: string; unlockLevel: number }[] = [
  { key: 'basic',  emoji: '🎒', unlockLevel: 1 },
  { key: 'easy',   emoji: '🧭', unlockLevel: 2 },
  { key: 'medium', emoji: '⚡', unlockLevel: 4 },
  { key: 'hard',   emoji: '🔥', unlockLevel: 6 },
];

/** Regiones: emoji y nivel de desbloqueo. */
const MODE_UNLOCK: Record<GameMode, { level: number; emoji: string }> = {
  world:    { level: 1, emoji: '🌍' },
  europe:   { level: 2, emoji: '🏰' },
  asia:     { level: 3, emoji: '⛩️' },
  americas: { level: 4, emoji: '🗽' },
  africa:   { level: 5, emoji: '🏜️' },
};

const CLASSIC_ROUNDS = 13;
const CLASSIC_SECONDS = 15;
const SELECTION_KEY = 'geospeed_last_selection';
const MEDALS = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

function loadSelection(): { mode: GameMode; difficulty: Difficulty } | null {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Normaliza el valor de dificultad guardado (clave actual basic|easy|medium|hard
 * o un label histórico de versiones previas) al nombre actual que ve el jugador.
 */
function difficultyLabel(raw: string, t: (key: string) => string): string {
  if (!raw) return '';
  const key = raw.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    basic: 'diff_basic', turista: 'diff_basic', 'básico': 'diff_basic', basico: 'diff_basic', tourist: 'diff_basic',
    easy: 'diff_easy', rookie: 'diff_easy', intermedio: 'diff_easy',
    medium: 'diff_medium', crack: 'diff_medium', avanzado: 'diff_medium', medio: 'diff_medium',
    hard: 'diff_hard', leyenda: 'diff_hard', legend: 'diff_hard', experto: 'diff_hard', expert: 'diff_hard',
  };
  const i18nKey = aliasMap[key];
  return i18nKey ? t(i18nKey) : raw;
}

/**
 * Inicio v2 (maquetas GeoSpeed_Inicio_Movil_APROBADA_v2 / Inicio_Computador_v2).
 * Banner "¿Cómo se juega?" · "Tu próxima aventura" (región + dificultad en hojas) · tarjetas de acceso ·
 * nivel + accesos a ranking/historial. Todo visible desde la primera visita (decisión D13).
 */
export default function HomeScreen({ onStartGame, onMultiplayer, onTimeAttack, onDailyChallenge, onWorldChallenge, onStartTraining, onMyChallenges, onOpenProfile, onOpenSettings, onOpenHistory, onMoreModes, onHowToPlay }: HomeScreenProps) {
  const { user, displayName } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const stats = getPlayerStats();
  const avgDist = stats.totalRounds > 0 ? Math.round(stats.totalDistance / stats.totalRounds) : 0;
  const playerLevel = getPlayerLevel();
  const badges = getPlayerBadges();
  const isOnline = useOnlineStatus();
  const isNewPlayer = stats.gamesPlayed === 0;

  // ── Selección región/dificultad (persistida, validada contra los candados) ──
  const [selectedMode, setSelectedMode] = useState<GameMode>(() => {
    const saved = loadSelection();
    return saved && MODE_UNLOCK[saved.mode] && playerLevel.level >= MODE_UNLOCK[saved.mode].level ? saved.mode : 'world';
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(() => {
    const saved = loadSelection();
    const cfg = saved && DIFF_CONFIG.find(d => d.key === saved.difficulty);
    return cfg && playerLevel.level >= cfg.unlockLevel ? cfg.key : 'basic';
  });
  useEffect(() => {
    try { localStorage.setItem(SELECTION_KEY, JSON.stringify({ mode: selectedMode, difficulty: selectedDifficulty })); } catch { /* sin espacio */ }
  }, [selectedMode, selectedDifficulty]);
  const [sheet, setSheet] = useState<null | 'region' | 'difficulty'>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  // ── Ranking (colapsable, igual que antes; F5 lo lleva a Progreso) ──
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankingMode, setRankingMode] = useState<string>('all');
  const [rankingPeriod, setRankingPeriod] = useState<LeaderboardPeriod>('all');
  const [rankingDifficulty, setRankingDifficulty] = useState<string>('all');
  const [showRanking, setShowRanking] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // ── Racha / cofre ──
  const [streakReward, setStreakReward] = useState<StreakReward | null>(null);
  const [streakDismissed, setStreakDismissed] = useState(false);
  const [dailyPlayers, setDailyPlayers] = useState<number>(0);
  const [streakRisk, setStreakRisk] = useState<{ days: number; canProtect: boolean } | null>(null);
  const [streakProtected, setStreakProtected] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    getDailyPlayerCount().then(setDailyPlayers);
  }, []);

  useEffect(() => {
    if (isNewPlayer) return;
    const result = checkStreak();
    if (result.isNewDay && result.reward && result.reward.lives > 0) setStreakReward(result.reward);
    const risk = getStreakAtRisk();
    if (risk) setStreakRisk(risk);
  }, [isNewPlayer]);

  useEffect(() => {
    if (showRanking) {
      getLeaderboard(rankingMode === 'all' ? undefined : rankingMode, rankingPeriod, rankingDifficulty === 'all' ? undefined : rankingDifficulty).then(setLeaderboard);
    }
  }, [rankingMode, rankingPeriod, rankingDifficulty, showRanking]);

  // ── Opciones de las hojas ──
  const regionOptions: SelectorOption<GameMode>[] = useMemo(() => MODE_CONFIG.map(m => {
    const lock = MODE_UNLOCK[m.key];
    const locked = playerLevel.level < lock.level;
    return {
      key: m.key,
      emoji: lock.emoji,
      label: t(`mode_${m.key}` as never) || m.label,
      desc: t(`region_desc_${m.key}` as never),
      locked,
      lockLabel: locked ? t('lock_level', { level: lock.level }) : undefined,
    };
  }), [playerLevel.level, t]);

  const difficultyOptions: SelectorOption<Difficulty>[] = useMemo(() => DIFF_CONFIG.map(d => {
    const locked = playerLevel.level < d.unlockLevel;
    const cap = d.key.charAt(0).toUpperCase() + d.key.slice(1);
    return {
      key: d.key,
      emoji: d.emoji,
      label: t(`home_diff${cap}` as never),
      desc: t(`home_diff${cap}Desc` as never),
      locked,
      lockLabel: locked ? t('lock_level', { level: d.unlockLevel }) : undefined,
    };
  }), [playerLevel.level, t]);

  const regionLabel = t(`mode_${selectedMode}` as never) || selectedMode;
  const difficultyName = difficultyOptions.find(d => d.key === selectedDifficulty)?.label ?? '';
  const difficultyEmoji = DIFF_CONFIG.find(d => d.key === selectedDifficulty)?.emoji ?? '🎒';
  const citiesInfo = t('home_citiesInfo', { cities: CLASSIC_ROUNDS, seconds: CLASSIC_SECONDS });
  const dateLabel = new Date().toLocaleDateString(locale === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short' });

  const shareDaily = async () => {
    const today = new Date().toISOString().split('T')[0];
    const url = `${window.location.origin}/daily/${today}`;
    const text = t('home_dailyShareText', { date: dateLabel });
    if (navigator.share) {
      try { await navigator.share({ title: 'GeoSpeed Daily', text, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard?.writeText(`${text}\n${url}`);
    }
  };

  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center px-3 pb-4 sm:px-4 sm:pb-6 md:px-6 md:pb-6 overflow-y-auto game-bg home-safe-top"
      aria-label={t('nav_home')}
    >
      <a
        href="#game-modes"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
      >
        {t('home_skipToContent')}
      </a>

      {/* ── Encabezado: vidas · marca · cuenta + ajustes ── */}
      <header className="w-full max-w-md md:max-w-5xl mb-2 sm:mb-3 animate-fade-in-up flex items-center justify-between gap-2">
        <EnergyBar />
        <div className="hidden sm:flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-9 h-9 md:w-11 md:h-11 object-contain" />
          <span className="flex flex-col leading-none">
            <Wordmark size="sm" />
            <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{t('home_tagline')}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {user ? (
            <button
              onClick={() => { playButtonTap(); onOpenProfile?.(); }}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground truncate max-w-[140px] px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors active:scale-[0.97]"
              aria-label={t('nav_profile')}
            >
              <span aria-hidden>👤</span>
              <span className="font-bold text-foreground truncate">{displayName || user.email?.split('@')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="btn3d text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl whitespace-nowrap text-primary-foreground"
              style={{ background: 'var(--grad-cta)' }}
              aria-label={t('home_signIn')}
              title={t('home_saveProgress')}
            >
              {t('home_signIn').toUpperCase()}
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={() => { playButtonTap(); onOpenSettings(); }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-accent/50 transition-all active:scale-[0.95] shrink-0"
              aria-label={t('home_settings')}
              title={t('home_settings')}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Marca en móvil (en sm+ va en el encabezado) */}
      <div className="sm:hidden flex items-center gap-2 mb-2 animate-fade-in-up">
        <img src="/logo.png" alt="" className="w-10 h-10 object-contain" />
        <span className="flex flex-col leading-none">
          <Wordmark size="md" />
          <span className="text-[10px] text-muted-foreground mt-0.5">{t('home_tagline')}</span>
        </span>
      </div>

      {!isOnline && (
        <div className="w-full max-w-md md:max-w-5xl mb-2 animate-fade-in">
          <div className="bg-primary/15 border border-primary/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <span>📡</span>
            <span className="text-primary font-bold">{t('home_offline')}</span>
            <span className="text-muted-foreground">{t('home_offlineDesc')}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md md:max-w-5xl md:grid md:grid-cols-[1fr_360px] md:gap-4 md:items-start">
        {/* ── Banner: ¿Cómo se juega? ── */}
        <section className="rounded-3xl border-2 border-primary/60 bg-card/60 p-3 sm:p-4 mb-3 animate-fade-in-up animation-delay-100" aria-label={t('home_howToPlay')}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl sm:text-2xl font-black">
              {t('home_howToPlayLead')} <span className="text-primary">{t('home_howToPlayTail')}</span>
            </h2>
            {onHowToPlay && (
              <button onClick={() => { playButtonTap(); onHowToPlay(); }} className="text-xs sm:text-sm font-bold text-accent hover:underline whitespace-nowrap">
                {t('home_seeTutorial')}
              </button>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden border border-border/60">
            <AutoDemo hideTagline />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center">
            {[t('home_step1'), t('home_step2'), t('home_step3')].map((s, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5">
                <span className="w-6 h-6 rounded-full border-2 border-accent text-accent text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[11px] sm:text-xs font-bold leading-tight">{s}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm font-bold mt-2">
            <span className="text-accent">{t('home_equationSpeed')}</span> + <span className="text-accent">{t('home_equationPrecision')}</span> = <span className="text-primary">{t('home_equationPoints')}</span>
          </p>
        </section>

        {/* ── Tu próxima aventura ── */}
        <section id="game-modes" className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5 mb-3 animate-fade-in-up animation-delay-150" aria-label={t('home_nextAdventure')}>
          <div className="flex items-center gap-3 mb-3">
            <Mascot state="wink" className="w-16 h-16 sm:w-20 sm:h-20 animate-mascot-float" />
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              {t('home_nextAdventureLead')} <span className="text-primary">{t('home_nextAdventureTail')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Dropdown label={t('home_region')} emoji={MODE_UNLOCK[selectedMode].emoji} value={regionLabel} onClick={() => { playButtonTap(); setSheet('region'); }} />
            <Dropdown label={t('home_difficultyLabel')} emoji={difficultyEmoji} value={difficultyName} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
          </div>
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-2 mb-3">{citiesInfo}</p>
          <button
            onClick={() => { playButtonTap(); onStartGame(selectedDifficulty, selectedMode); }}
            className="btn3d w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-lg sm:text-xl tracking-wide text-primary-foreground animate-pulse-glow-subtle"
            style={{ background: 'var(--grad-cta)' }}
            aria-label={`${t('home_playNow')} — ${difficultyName}, ${regionLabel}`}
          >
            <span aria-hidden>▶</span>
            <span>{t('home_playNow')}</span>
          </button>
        </section>
      </div>

      {/* ── Tarjetas de acceso ── */}
      <div className="w-full max-w-md md:max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3 animate-fade-in-up animation-delay-200">
        <AccessCard emoji="📅" title={t('home_dailyCard')} desc={dailyPlayers > 0 ? (dailyPlayers === 1 ? t('home_dailyPlayedOne') : t('home_dailyPlayedMany', { count: dailyPlayers })) : t('home_dailyCardDesc')} onClick={() => { playButtonTap(); onDailyChallenge(); }} extra={<button onClick={(e) => { e.stopPropagation(); shareDaily(); }} className="absolute top-2 right-2 text-xs opacity-70 hover:opacity-100" aria-label={t('share')} title={t('share')}>🔗</button>} />
        <AccessCard emoji="🤝" title={t('home_friends')} desc={t('home_friendsDesc')} onClick={() => { playButtonTap(); onMultiplayer(); }} />
        <AccessCard emoji="⚡" title={t('home_moreModes')} desc={t('home_moreModesDesc')} onClick={() => { playButtonTap(); (onMoreModes ?? onTimeAttack)(); }} />
        {onMyChallenges
          ? <AccessCard emoji="📋" title={t('home_myChallenges')} desc={t('home_myChallengesDesc')} onClick={() => { playButtonTap(); onMyChallenges(); }} />
          : <AccessCard emoji="🎯" title={t('home_trainingCard')} desc={t('home_trainingCardDesc')} onClick={() => { playButtonTap(); onStartTraining(); }} />}
      </div>

      {/* ── Cofre diario ── */}
      {streakReward && !streakDismissed && (
        <DailyChestModal reward={streakReward} onOpen={() => claimDailyReward()} onClose={() => setStreakDismissed(true)} />
      )}

      {/* ── Racha en riesgo ── */}
      {streakRisk && !streakProtected && (
        <div className="w-full max-w-md md:max-w-5xl mb-3 animate-fade-in-up">
          <div className="bg-destructive/10 border-2 border-destructive/50 rounded-2xl p-3 sm:p-4 text-center relative overflow-hidden">
            <span className="text-2xl sm:text-3xl block mb-1">⚠️</span>
            <p className="font-black text-sm sm:text-base text-destructive">{t('home_streakRiskTitle', { days: streakRisk.days })}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t('home_streakRiskDesc')}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { playButtonTap(); onStartGame(selectedDifficulty, selectedMode); }}
                className="flex-1 py-2 rounded-xl font-bold text-xs bg-destructive text-destructive-foreground active:scale-[0.97] transition-all"
              >
                {t('home_streakPlay')}
              </button>
              {streakRisk.canProtect && (
                <button
                  onClick={() => { playButtonTap(); protectStreak(); setStreakProtected(true); setStreakRisk(null); }}
                  className="flex-1 py-2 rounded-xl font-bold text-xs border-2 border-primary/50 text-primary hover:bg-primary/10 active:scale-[0.97] transition-all"
                >
                  {t('home_streakProtect')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Nivel + accesos a ranking / historial ── */}
      <section className="w-full max-w-md md:max-w-5xl mb-3 animate-fade-in-up animation-delay-250 rounded-2xl border border-border bg-card/70 p-3 sm:p-4" aria-label={t('home_level')}>
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl" aria-hidden>{playerLevel.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-black text-sm sm:text-base truncate">
                {t('home_level')} {playerLevel.level} · <span className="text-primary">{tLevelTitle(playerLevel.title, locale)}</span>
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono whitespace-nowrap">
                {playerLevel.xp.toLocaleString()} / {playerLevel.xpForNext.toLocaleString()} {t('home_xp')}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${playerLevel.progress}%`, background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' }} />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-border text-center text-xs">
          <button onClick={() => { playAccordion(!showRanking); setShowRanking(v => !v); }} className="py-1.5 font-bold hover:text-primary transition-colors" aria-expanded={showRanking} aria-controls="ranking-panel">🏆 {t('home_ranking')}</button>
          <button onClick={() => { playButtonTap(); (onOpenHistory ?? onOpenProfile)?.(); }} className="py-1.5 font-bold hover:text-primary transition-colors">📊 {t('home_history')}</button>
          <button onClick={() => { playButtonTap(); setShowBadges(v => !v); }} className="py-1.5 font-bold hover:text-primary transition-colors" aria-expanded={showBadges}>🏅 {badges.filter(b => b.unlocked).length}/{badges.length}</button>
        </div>
        {!isNewPlayer && (
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            <Stat label={t('home_statsGames')} value={stats.gamesPlayed.toLocaleString()} />
            <Stat label={t('home_statsRecord')} value={stats.bestScore.toLocaleString()} />
            <Stat label={t('home_statsAvgDist')} value={`${avgDist.toLocaleString()} km`} />
          </div>
        )}
        <div className={`overflow-hidden transition-all duration-500 ease-out ${showBadges ? 'max-h-[400px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
            {badges.map(badge => (
              <div key={badge.id} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center ${badge.unlocked ? 'border-primary/30 bg-primary/8' : 'border-border bg-card/50 opacity-40 grayscale'}`}>
                <span className="text-lg sm:text-xl">{badge.emoji}</span>
                <p className="text-[8px] sm:text-[9px] font-bold leading-tight">{tBadgeName(badge.id, badge.name, locale)}</p>
                <p className="text-[7px] sm:text-[8px] text-muted-foreground leading-tight">{tBadgeDesc(badge.id, badge.description, locale)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking colapsable (se mantiene aquí hasta F5) */}
        <div id="ranking-panel" className={`overflow-hidden transition-all duration-500 ease-out ${showRanking ? 'max-h-[700px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-3 gap-1 mb-1.5" role="tablist" aria-label={t('home_ranking')}>
            {([
              { key: 'all', label: `🏛️ ${t('home_rankingAllTime')}` },
              { key: 'month', label: `📅 ${t('home_rankingMonth')}` },
              { key: 'week', label: `🔥 ${t('home_rankingWeek')}` },
            ] as { key: LeaderboardPeriod; label: string }[]).map(p => (
              <FilterChip key={p.key} active={rankingPeriod === p.key} onClick={() => setRankingPeriod(p.key)}>{p.label}</FilterChip>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1 mb-1.5" role="tablist">
            {[{ key: 'all', label: t('home_rankingAll') }, ...MODE_CONFIG.map(m => ({ key: m.key, label: t(`mode_${m.key}` as never) || m.label }))].map(m => (
              <FilterChip key={m.key} active={rankingMode === m.key} onClick={() => setRankingMode(m.key)}>{m.label}</FilterChip>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 mb-2" role="tablist">
            {['all', 'basic', 'easy', 'medium', 'hard'].map(dk => (
              <FilterChip key={dk} active={rankingDifficulty === dk} onClick={() => setRankingDifficulty(dk)}>{dk === 'all' ? t('home_rankingAll') : difficultyLabel(dk, t)}</FilterChip>
            ))}
          </div>
          <div className="bg-muted/30 rounded-xl border border-border overflow-hidden" role="table" aria-label={t('home_ranking')}>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs sm:text-sm py-4">{t('home_noGamesYet')}</p>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center px-2 sm:px-3 py-1.5 border-b border-border last:border-0" role="row">
                  <span className="w-6 sm:w-7 text-center text-xs sm:text-sm">{MEDALS[i] || `${i + 1}.`}</span>
                  <span className="font-mono font-bold flex-1 text-xs sm:text-sm text-primary">{entry.initials}</span>
                  <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground mr-1.5">{entry.mode === 'mundial' ? '⚽' : (t(`mode_${entry.mode}` as never) || entry.mode)}</span>
                  <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground mr-1.5">{difficultyLabel(entry.difficulty, t)}</span>
                  <span className="font-mono font-bold text-xs sm:text-sm">{entry.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Invita amigos (referidos) ── */}
      {!isNewPlayer && (() => {
        const ref = getReferralProgress();
        return (
          <div className="w-full max-w-md md:max-w-5xl mb-3 animate-fade-in-up animation-delay-300">
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-xs sm:text-sm text-accent">{t('ref_title')}</p>
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">{t('ref_invited', { count: ref.count })}</span>
              </div>
              {ref.nextTier && (
                <div className="mb-2">
                  <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground mb-1">
                    <span>{ref.nextTier.label}</span>
                    <span>{ref.count}/{ref.nextTier.threshold}</span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (ref.count / ref.nextTier.threshold) * 100)}%` }} />
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-1">
                    {t('ref_more', { remaining: ref.nextTier.threshold - ref.count, lives: ref.nextTier.lives, bonus: ref.nextTier.bonus ? ` + ${ref.nextTier.bonus}` : '' })}
                  </p>
                </div>
              )}
              {ref.claimable && (
                <button
                  onClick={() => { claimReferralReward(ref.claimable!.tier); playButtonTap(); }}
                  className="btn3d w-full py-2 rounded-xl font-bold text-xs mb-2 text-primary-foreground animate-pulse"
                  style={{ background: 'var(--grad-cta)' }}
                >
                  {t('ref_claim', { lives: ref.claimable.lives, bonus: ref.claimable.bonus ? ` + ${ref.claimable.bonus}` : '' })}
                </button>
              )}
              <button
                onClick={async () => {
                  playButtonTap();
                  const text = t('ref_shareText');
                  let confirmed = false;
                  if (navigator.share) {
                    try { await navigator.share({ title: 'GeoSpeed', text, url: ref.link }); confirmed = true; } catch { /* cancelado */ }
                  } else {
                    try { await navigator.clipboard?.writeText(`${text}\n${ref.link}`); confirmed = true; } catch { /* sin permiso */ }
                  }
                  if (confirmed) { setInviteSent(true); setTimeout(() => setInviteSent(false), 4000); }
                }}
                className="w-full py-2 rounded-xl font-bold text-[10px] sm:text-xs border border-accent/40 text-accent hover:bg-accent/10 transition-all active:scale-[0.97]"
              >
                {t('ref_share')}
              </button>
              {inviteSent && (
                <p className="mt-2 text-center text-[9px] sm:text-[10px] text-accent animate-fade-in" role="status">
                  {navigator.share ? t('ref_sent') : t('ref_copied')}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      <div className="h-2 shrink-0" />

      {/* ── Hojas de selección ── */}
      {sheet === 'region' && (
        <SelectorSheet<GameMode>
          title={t('region_title')}
          subtitle={t('region_subtitle')}
          options={regionOptions}
          selected={selectedMode}
          confirmLabel={t('region_confirm')}
          footnote={t('region_keepDifficulty')}
          onConfirm={(k) => { setSelectedMode(k); setSheet(null); }}
          onClose={closeSheet}
          closeLabel={t('close')}
        />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<Difficulty>
          title={t('diff_title')}
          subtitle={t('diff_subtitle')}
          options={difficultyOptions}
          selected={selectedDifficulty}
          confirmLabel={t('diff_confirm')}
          footnote={t('diff_keepRegion')}
          context={{ emoji: MODE_UNLOCK[selectedMode].emoji, title: t('diff_currentRegion', { region: regionLabel }), desc: citiesInfo }}
          onConfirm={(k) => { setSelectedDifficulty(k); setSheet(null); }}
          onClose={closeSheet}
          closeLabel={t('close')}
        />
      )}
    </main>
  );
}

function Dropdown({ label, emoji, value, onClick }: { label: string; emoji: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-2.5 sm:p-3 rounded-2xl border border-border bg-muted/30 hover:border-accent/50 transition-colors active:scale-[0.98] text-left"
      aria-haspopup="dialog"
    >
      <span className="text-[11px] sm:text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 w-full mt-1">
        <span className="text-xl" aria-hidden>{emoji}</span>
        <span className="flex-1 font-black text-sm sm:text-base truncate">{value}</span>
        <span className="text-muted-foreground" aria-hidden>⌄</span>
      </span>
    </button>
  );
}

function AccessCard({ emoji, title, desc, onClick, extra }: { emoji: string; title: string; desc: string; onClick: () => void; extra?: React.ReactNode }) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="w-full h-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border border-border bg-card/70 hover:border-accent/50 text-left transition-all active:scale-[0.98]"
      >
        <span className="text-3xl sm:text-4xl shrink-0" aria-hidden>{emoji}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-sm sm:text-base leading-tight">{title}</span>
          <span className="block text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2">{desc}</span>
        </span>
        <span className="text-muted-foreground hidden sm:inline" aria-hidden>›</span>
      </button>
      {extra}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 py-1.5">
      <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xs sm:text-sm font-bold font-mono text-primary">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`px-1 py-1 rounded-md text-[8px] sm:text-[10px] font-bold whitespace-nowrap truncate transition-all active:scale-[0.97] ${
        active ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}
