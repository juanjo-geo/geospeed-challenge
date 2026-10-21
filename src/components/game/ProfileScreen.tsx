import { useEffect, useState, type ReactNode } from 'react';
import { scrollAppToTop } from '@/lib/appScroll';
import { fetchMyProgress, type MyProgress } from '@/lib/gameResults';
import { getStreakState } from '@/lib/dailyStreak';
import { playButtonTap } from '@/lib/sounds';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerStats, getGameHistory, formatDistance, type GameHistoryEntry } from '@/lib/gameUtils';
import { getPlayerLevel, getPlayerBadges, type PlayerLevel, type Badge } from '@/lib/levelSystem';
import { tLevelTitle, tBadgeName, tBadgeDesc, tDifficulty } from '@/lib/gameI18n';
import { getEnergy } from '@/lib/energySystem';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { updateMyProfile } from '@/lib/identity';
import { useNavigate } from 'react-router-dom';
import Mascot from './Mascot';
import { appNumberLocale, formatNumber } from '@/lib/format';
import { ChevronIcon, HomeIcon, LegendPin } from '@/components/ui/icons';
import HeaderBackdrop from './HeaderBackdrop';

/** 'mascot' = el Explorador (avatar por defecto, maqueta Perfil_APROBADA_v1) */
const AVATARS = ['mascot', '🌍', '🗺️', '🧭', '✈️', '🚀', '🏔️', '🌋', '🏝️', '🎯', '👑', '⚡', '🔮', '🦅', '🐉', '🎲', '🛸'];
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

type ProfileTab = 'overview' | 'stats' | 'levels' | 'badges' | 'history';

interface ProfileScreenProps {
  onBack: () => void;
  /** Sección inicial (la pestaña "Progreso" de la barra abre el historial) */
  initialTab?: ProfileTab;
  onMyChallenges?: () => void;
  onOpenHistory?: () => void;
  onOpenRanking?: () => void;
}

function AvatarFace({ avatar, size }: { avatar: string; size: 'lg' | 'sm' }) {
  if (avatar === 'mascot') return <Mascot state="wink" className={size === 'lg' ? 'w-[84%]' : 'w-[80%]'} />;
  return <span className={size === 'lg' ? 'text-6xl sm:text-7xl' : 'text-xl sm:text-2xl'}>{avatar}</span>;
}

/**
 * Mi perfil (maquetas Perfil_Movil/Computador_APROBADA_v1): avatar con aro amarillo, nombre, rango y nivel con
 * medallón de brújula · Tus estadísticas · Explora tu progreso (Historial, Ranking, Mis retos + accesos compactos
 * a Niveles, Insignias y Estadísticas, que la maqueta no muestra) · Volver al inicio.
 */
export default function ProfileScreen({ onBack, initialTab = 'overview', onMyChallenges, onOpenHistory, onOpenRanking }: ProfileScreenProps) {
  const { user, displayName, avatar: serverAvatar, isAnonymous, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const navigateTo = (path: string) => navigate(path);
  const { t, locale } = useI18n();
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) || 'mascot');
  // Avatar guardado en el servidor gana sobre el local (otro dispositivo)
  useEffect(() => { if (serverAvatar) { setAvatar(serverAvatar); localStorage.setItem(AVATAR_KEY, serverAvatar); } }, [serverAvatar]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const saveName = async () => {
    const n = nameDraft.trim();
    if (n.length >= 2) { playButtonTap(); await updateMyProfile({ displayName: n }); await refreshProfile(); }
    setEditingName(false);
  };
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  const localStats = getPlayerStats();
  const history = getGameHistory();
  // F5: con sesión, las estadísticas salen del servidor; sin sesión, de lo local
  const [progress, setProgress] = useState<MyProgress | null>(null);
  useEffect(() => { fetchMyProgress().then(p => { if (p && p.gamesPlayed > 0) setProgress(p); }).catch(() => {}); }, []);
  const stats = progress
    ? { ...localStats, gamesPlayed: progress.gamesPlayed, bestScore: Math.max(progress.bestScore, localStats.bestScore), totalRounds: progress.totalRounds, totalDistance: (progress.avgDistanceKm ?? 0) * progress.totalRounds }
    : localStats;
  const streak = getStreakState().currentStreak;
  const level = getPlayerLevel();
  const badges = getPlayerBadges();
  const energy = getEnergy();
  const avgDist = stats.totalRounds > 0 ? stats.totalDistance / stats.totalRounds : 0;
  const totalXp = level.xp;
  const unlockedBadges = badges.filter(b => b.unlocked).length;
  // Sin sesión todavía: el nombre elegido queda pendiente en local hasta crear la sesión de invitado
  const pendingName = (() => { try { return localStorage.getItem('geospeed_pending_display_name') || ''; } catch { return ''; } })();
  const name = displayName || pendingName || user?.email?.split('@')[0] || t('profile_player');
  const levelTitle = tLevelTitle(level.title, locale);

  const selectAvatar = (a: string) => {
    playButtonTap();
    setAvatar(a);
    localStorage.setItem(AVATAR_KEY, a);
    updateMyProfile({ avatar: a }).catch(() => {});
    setShowAvatarPicker(false);
  };
  const open = (next: ProfileTab) => { playButtonTap(); setTab(next); scrollAppToTop(); };

  const SECTION_TITLES: Record<Exclude<ProfileTab, 'overview'>, string> = {
    history: t('profile_historyTitle'),
    levels: t('profile_levels'),
    badges: t('profile_badgesTitle'),
    stats: t('profile_detailedStats'),
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center px-3 py-4 sm:px-4 sm:py-6 md:px-6 overflow-y-auto game-bg">
      {/* Mapa tenue detrás de la cabecera (maqueta Perfil) */}
      {tab === 'overview' && <HeaderBackdrop />}
      <div className="relative w-full max-w-5xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={tab === 'overview' ? onBack : () => setTab('overview')}
          title={tab === 'overview' ? t('profile_title') : SECTION_TITLES[tab]}
          subtitle={tab === 'overview' ? t('profile_subtitle') : undefined}
        />

        {tab === 'overview' ? (
          <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-stretch">
            {/* ── Explorador: avatar (sobre la tarjeta en el celular, dentro en computador), nombre y nivel ── */}
            <section className="flex flex-col items-center text-center md:rounded-3xl md:border-2 md:border-accent/50 md:bg-card/70 md:p-6 md:shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
              <button
                onClick={() => { playButtonTap(); setShowAvatarPicker(v => !v); }}
                className="relative w-36 h-36 sm:w-44 sm:h-44 short:w-24 short:h-24 rounded-full border-[5px] border-primary bg-[radial-gradient(circle_at_50%_40%,hsl(var(--brand-navy-card)),hsl(var(--brand-navy-deep)))] flex items-center justify-center shadow-[0_0_34px_hsl(var(--primary)/0.45)] transition-transform hover:scale-[1.03] active:scale-95"
                aria-label={t('profile_changeAvatar')}
              >
                <AvatarFace avatar={avatar} size="lg" />
                <svg viewBox="0 0 60 16" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[46%] text-primary" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
                  <path d="M6 4l5 6M22 3l2 8M38 3l-2 8M54 4l-5 6" />
                </svg>
                <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-card border-2 border-accent/60 flex items-center justify-center text-xs" aria-hidden>✏️</span>
              </button>

              <div className="w-full mt-4 rounded-3xl border-2 border-accent/50 bg-card/70 p-4 shadow-[0_0_20px_hsl(var(--accent)/0.12)] md:mt-3 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none flex flex-col items-center">
                {showAvatarPicker && (
                  <div className="w-full mb-3 pb-3 border-b border-accent/20 animate-fade-in">
                    <p className="text-xs text-muted-foreground mb-2">{t('profile_chooseAvatar')}</p>
                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 sm:gap-2">
                      {AVATARS.map(a => (
                        <button
                          key={a}
                          onClick={() => selectAvatar(a)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            avatar === a ? 'bg-primary/20 border-2 border-primary' : 'bg-muted/40 border border-transparent hover:border-accent/50'
                          }`}
                          aria-label={a === 'mascot' ? t('profile_avatarExplorer') : a}
                        >
                          <AvatarFace avatar={a} size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editingName ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="w-full max-w-xs flex gap-2">
                    <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value.slice(0, 20))} placeholder={t('acc_namePlaceholder')} maxLength={20}
                      className="flex-1 min-w-0 rounded-xl border-2 border-accent/60 bg-brand-navy-deep/60 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-accent" />
                    <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-3 font-black text-sm">{t('acc_save')}</button>
                  </form>
                ) : (
                  <button onClick={() => { playButtonTap(); setNameDraft(displayName || pendingName || ''); setEditingName(true); }} className="group flex items-center gap-2 max-w-full" aria-label={t('acc_editName')}>
                    <span className="font-black text-[2rem] sm:text-[2.6rem] leading-tight truncate">{name}</span>
                    <span className="text-sm opacity-60 group-hover:opacity-100" aria-hidden>✏️</span>
                  </button>
                )}
                {editingName && <p className="mt-1 text-[11px] text-muted-foreground">{t('acc_nameHint')}</p>}
                <span className="mt-1.5 rounded-full border-2 border-accent/40 bg-brand-navy-deep/50 px-5 py-0.5 text-sm sm:text-base font-semibold">{levelTitle}</span>

                <div className="hidden md:block w-full h-px bg-accent/20 mt-5" />

                {/* Nivel: medallón de brújula + barra de XP */}
                <div className="w-full mt-4 rounded-2xl border border-accent/30 bg-brand-navy-deep/40 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-left">
                  <CompassMedal className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-base sm:text-lg leading-tight">
                      {t('profile_levelN', { n: level.level })} · <span className="text-primary">{levelTitle}</span>
                    </p>
                    <div className="mt-2 h-3 rounded-full border border-foreground/30 bg-brand-navy-deep overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: `${level.progress}%`, boxShadow: '0 0 10px hsl(var(--accent) / 0.6)' }} />
                    </div>
                    <p className="mt-1.5 text-sm sm:text-base font-bold">{formatNumber(totalXp)} / {formatNumber(level.xpForNext)} XP</p>
                    <p className="text-xs sm:text-sm text-brand-sky">{t('profile_nextLevelHint')}</p>
                    {streak > 0 && <p className="mt-1 text-xs sm:text-sm font-bold">🔥 {t('profile_streak', { n: streak })}</p>}
                  </div>
                </div>

                {(!user || isAnonymous) && (
                  <div className="w-full mt-3 rounded-2xl border border-primary/50 bg-primary/10 p-3 text-left">
                    <p className="font-black text-sm">🔒 {t('acc_guestTitle')}</p>
                    <p className="text-xs text-foreground/70 mt-0.5">{t('acc_guestDesc')}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => { playButtonTap(); navigateTo('/auth?mode=signup'); }} className="btn3d rounded-xl px-3 py-1.5 text-xs font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('acc_createAccount')}</button>
                      <button onClick={() => { playButtonTap(); navigateTo('/auth'); }} className="rounded-xl px-3 py-1.5 text-xs font-bold border-2 border-accent/50 hover:bg-accent/10">{t('acc_haveAccount')}</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="flex flex-col gap-4">
              {/* ── Tus estadísticas ── */}
              <section className="rounded-3xl border-2 border-accent/50 bg-card/70 p-3 sm:p-5 shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
                <h2 className="text-[1.6rem] sm:text-3xl font-black mb-3 leading-tight">{t('profile_statsLead')} <span className="text-primary">{t('profile_statsTail')}</span></h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <StatTile icon={<span className="text-[2rem] sm:text-5xl">🎮</span>} label={t('profile_gamesPlayed')} value={formatNumber(stats.gamesPlayed)} />
                  <StatTile icon={<span className="text-[2rem] sm:text-5xl">🏆</span>} label={t('profile_record')} value={formatNumber(stats.bestScore)} unit="pts" />
                  <StatTile icon={<LegendPin color="hsl(var(--accent))" className="w-9 h-9 sm:w-12 sm:h-12" />} label={t('profile_avgDistance')} value={formatDistance(avgDist)} hint={t('profile_avgDistanceHint')} />
                  <StatTile icon={<span className="text-[2rem] sm:text-5xl">🧭</span>} label={t('profile_level')} value={String(level.level)} />
                </div>
              </section>

              {/* ── Explora tu progreso: las tres filas de la maqueta + accesos compactos a Niveles, Insignias y Estadísticas ── */}
              <section className="rounded-3xl border-2 border-accent/50 bg-card/70 p-3 sm:p-5 shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
                <h2 className="text-[1.6rem] sm:text-3xl font-black mb-3 leading-tight">{t('profile_exploreLead')} <span className="text-primary">{t('profile_exploreTail')}</span></h2>
                <div className="flex flex-col gap-2">
                  <ExploreRow icon="📊" title={t('profile_historyTitle')} desc={t('profile_historyDesc')} onClick={() => onOpenHistory ? (playButtonTap(), onOpenHistory()) : open('history')} />
                  {onOpenRanking && <ExploreRow icon="🏆" title={t('rank_title')} desc={t('profile_rankingDesc')} onClick={() => { playButtonTap(); onOpenRanking(); }} />}
                  {onMyChallenges && <ExploreRow icon="📋" title={t('home_myChallenges')} desc={t('profile_myChallengesDesc')} onClick={() => { playButtonTap(); onMyChallenges(); }} />}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <MiniTile icon="🏅" label={t('profile_levels')} onClick={() => open('levels')} />
                  <MiniTile icon="🎖️" label={t('profile_badgesShort')} extra={`${unlockedBadges}/${badges.length}`} onClick={() => open('badges')} />
                  <MiniTile icon="📈" label={t('profile_statsShort')} onClick={() => open('stats')} />
                </div>
              </section>
            </div>
          </div>
          <button onClick={() => { playButtonTap(); onBack(); }} className="mt-4 mx-auto md:mx-0 flex items-center gap-2.5 font-semibold text-foreground/90 hover:text-foreground">
            <HomeIcon className="w-6 h-6" /> {t('more_back')}
          </button>
          <div className="h-4" />
          </>
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in pb-4">
            {tab === 'stats' && <StatsTab stats={stats} avgDist={avgDist} totalXp={totalXp} energy={energy} history={history} />}
            {tab === 'levels' && <LevelsTab currentLevel={level} />}
            {tab === 'badges' && <BadgesTab badges={badges} unlockedCount={unlockedBadges} />}
            {tab === 'history' && <HistoryTab history={history} />}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, unit, hint }: { icon: ReactNode; label: string; value: string; unit?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-brand-navy-deep/40 p-2 sm:p-3 flex items-center gap-2 sm:gap-3 min-w-0">
      <span className="shrink-0 w-9 sm:w-14 flex justify-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]" aria-hidden>{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs sm:text-sm font-semibold text-foreground/85">{label}</span>
        <span className="block font-extrabold text-[1.15rem] sm:text-[1.7rem] leading-tight whitespace-nowrap truncate">{value}{unit && <span className="text-base sm:text-lg"> {unit}</span>}</span>
        {hint && <span className="block text-[10px] sm:text-[11px] text-foreground/70 leading-tight">{hint}</span>}
      </span>
    </div>
  );
}

function ExploreRow({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 sm:gap-4 rounded-2xl border border-accent/30 bg-brand-navy-deep/40 px-3 py-2.5 sm:py-3 text-left hover:border-accent/70 hover:bg-accent/5 transition-colors active:scale-[0.99]">
      <span className="text-3xl sm:text-4xl w-11 text-center shrink-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]" aria-hidden>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-extrabold text-base sm:text-lg leading-tight">{title}</span>
        <span className="block text-xs sm:text-sm text-foreground/75 truncate">{desc}</span>
      </span>
      <ChevronIcon className="w-6 h-6 text-foreground/80" />
    </button>
  );
}

/** Accesos compactos a las secciones que la maqueta no muestra (Niveles · Insignias · Estadísticas) */
function MiniTile({ icon, label, extra, onClick }: { icon: string; label: string; extra?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-accent/25 bg-brand-navy-deep/30 px-2 py-2 hover:border-accent/60 hover:bg-accent/5 transition-colors active:scale-[0.98]">
      <span className="text-xl sm:text-2xl leading-none" aria-hidden>{icon}</span>
      <span className="text-xs sm:text-sm font-bold leading-tight">{label}{extra && <span className="text-foreground/60 font-semibold"> {extra}</span>}</span>
    </button>
  );
}

/** Medallón de brújula del nivel (maqueta Perfil): aro plateado, cara azul y rosa de los vientos */
function CompassMedal({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`${className} drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]`} aria-hidden>
      <circle cx="32" cy="32" r="30" className="text-brand-sky" fill="currentColor" />
      <circle cx="32" cy="32" r="30" className="text-foreground" fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
      <circle cx="32" cy="32" r="24" className="text-brand-navy-card" fill="currentColor" />
      <circle cx="32" cy="32" r="24" className="text-foreground" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M32 11 36 28 53 32 36 36 32 53 28 36 11 32 28 28Z" className="text-foreground" fill="currentColor" />
      <path d="M32 11 36 28 32 32ZM53 32 36 36 32 32ZM32 53 28 36 32 32ZM11 32 28 28 32 32Z" className="text-brand-sky" fill="currentColor" />
      <circle cx="32" cy="32" r="3" className="text-accent" fill="currentColor" />
    </svg>
  );
}

/** Fecha corta local ("17 oct"). Las fechas YYYY-MM-DD se leen como locales (no UTC) para no restar un día. */
function shortDate(raw: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short' });
}

/* ── Stats Tab ── */
function StatsTab({ stats, avgDist, totalXp, energy, history }: {
  stats: ReturnType<typeof getPlayerStats>;
  avgDist: number;
  totalXp: number;
  energy: ReturnType<typeof getEnergy>;
  history: GameHistoryEntry[];
}) {
  const { t, locale } = useI18n();
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
        <StatBlock label={t('profile_personalRecord')} value={stats.bestScore.toLocaleString(appNumberLocale())} icon="🏆" highlight />
        <StatBlock label={t('profile_avgDist')} value={formatDistance(avgDist)} icon="📍" />
        <StatBlock label={t('profile_totalRounds')} value={stats.totalRounds.toLocaleString(appNumberLocale())} icon="🔄" />
        <StatBlock label={t('profile_totalXP')} value={totalXp.toLocaleString(appNumberLocale())} icon="⚡" />
        <StatBlock label={t('profile_lives')} value={energy.lives > energy.maxLives ? `${energy.lives}` : `${energy.lives}/${energy.maxLives}`} icon="❤️" />
      </div>

      {/* Modes breakdown */}
      {totalGames > 0 && (
        <div className="bg-card/70 border border-border rounded-2xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('profile_byMode')}</p>
          <div className="space-y-2">
            <ModeBar label={t('profile_mode13')} count={classicGames} total={totalGames} color="hsl(var(--primary))" />
            <ModeBar label={t('profile_modeChaos')} count={taGames} total={totalGames} color="hsl(var(--destructive))" />
            <ModeBar label={t('profile_modeDaily')} count={dailyGames} total={totalGames} color="hsl(var(--accent))" />
          </div>
        </div>
      )}

      {/* Best game */}
      {bestGame && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('profile_bestGame')}</p>
          <p className="font-black text-lg sm:text-xl" style={{ color: 'hsl(var(--primary))' }}>
            {bestGame.score.toLocaleString(appNumberLocale())} pts
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            {shortDate(bestGame.date, locale)} · {bestGame.rounds} {t('profile_rounds')} · {formatDistance(bestGame.avgDistance)} {t('profile_avgShort')}
          </p>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-card/70 border rounded-2xl p-3 sm:p-4 text-center ${highlight ? 'border-primary/40' : 'border-border'}`}>
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
  const { t, locale } = useI18n();
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {LEVELS_CONFIG.map((lvl, i) => {
        const lvlNumber = i + 1;
        const isCurrentOrPast = currentLevel.level >= lvlNumber;
        const isCurrent = currentLevel.level === lvlNumber;

        return (
          <div
            key={lvlNumber}
            className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all ${
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
                  Nv.{lvlNumber} {tLevelTitle(lvl.title, locale)}
                </span>
                {isCurrent && (
                  <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                    {t('profile_current')}
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                {lvl.minXp.toLocaleString(appNumberLocale())} {t('profile_xpRequired')}
              </p>
            </div>
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {isCurrentOrPast ? (
                <span className="text-accent text-sm font-black">✓</span>
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
  const { t, locale } = useI18n();
  return (
    <div>
      <div className="text-center mb-3 sm:mb-4">
        <p className="text-2xl sm:text-3xl font-black" style={{ color: 'hsl(var(--primary))' }}>
          {unlockedCount}/{badges.length}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('profile_badgesUnlocked')}</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`flex flex-col items-center gap-1 p-3 sm:p-4 rounded-2xl border text-center transition-all ${
              badge.unlocked
                ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                : 'border-border bg-card/50 opacity-40 grayscale'
            }`}
          >
            <span className={`text-2xl sm:text-3xl ${badge.unlocked ? 'animate-fade-in' : ''}`}>{badge.emoji}</span>
            <p className="text-[9px] sm:text-[10px] font-bold text-foreground leading-tight">{tBadgeName(badge.id, badge.name, locale)}</p>
            <p className="text-[7px] sm:text-[8px] text-muted-foreground leading-tight">{tBadgeDesc(badge.id, badge.description, locale)}</p>
            {badge.unlocked && (
              <span className="text-[8px] sm:text-[9px] font-bold text-accent mt-0.5">{t('profile_unlocked')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── History Tab ── */
function HistoryTab({ history }: { history: GameHistoryEntry[] }) {
  const { t, locale } = useI18n();
  if (history.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-3xl sm:text-4xl mb-2">🕹️</p>
        <p className="text-sm text-muted-foreground">{t('profile_noGames')}</p>
      </div>
    );
  }

  const typeLabels: Record<string, { label: string; emoji: string }> = {
    classic: { label: t('profile_mode13'), emoji: '🎮' },
    timeattack: { label: t('profile_modeChaos'), emoji: '⏱️' },
    daily: { label: t('profile_dailyShort'), emoji: '📅' },
  };
  const mundial = { label: t('wc_modeName'), emoji: '⚽' };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {history.map((game, i) => {
        const gt = game.mode === 'mundial' ? mundial : (typeLabels[game.type] || typeLabels.classic);
        return (
          <div key={i} className="flex items-center gap-3 bg-card/70 border border-border rounded-2xl p-2.5 sm:p-3">
            <span className="text-lg sm:text-xl shrink-0">{gt.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'hsl(var(--primary))' }}>
                  {game.score.toLocaleString(appNumberLocale())} pts
                </span>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground">{gt.label}</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                {game.rounds} {t('profile_rounds')}{game.mode === 'mundial' ? '' : ` · ${formatDistance(game.avgDistance)} ${t('profile_avgShort')}`} · {tDifficulty(game.difficulty, locale)}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{shortDate(game.date, locale)}</span>
          </div>
        );
      })}
    </div>
  );
}
