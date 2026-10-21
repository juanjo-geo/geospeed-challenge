import { useState, useEffect, useMemo, useCallback } from 'react';
import { Difficulty, GameMode, MODE_CONFIG } from '@/data/cities';
import { getPlayerStats, getDailyPlayerCount } from '@/lib/gameUtils';
import { getPlayerLevel } from '@/lib/levelSystem';
import DailyChestModal from './DailyChestModal';
import { checkStreak, claimDailyReward, getUnclaimedChestToday, skipTodayChest, type StreakReward } from '@/lib/dailyStreak';
import { homeInterruptionShown, markHomeInterruption } from '@/lib/interruptions';
import EnergyBar from './EnergyBar';
import StreakChip from './StreakChip';
import { nextRollover } from '@/lib/gameDay';
import { getCachedDailyStatus, playedToday, todayDailyNo, DAILY_STATUS_EVENT, type DailyStatus } from '@/lib/dailyChallenge';
import { lazy, Suspense } from 'react';
// La demo dibuja el mapa (polígonos pesados): se carga aparte para que el inicio pinte antes
const AutoDemo = lazy(() => import('./AutoDemo'));
import Mascot from './Mascot';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import { AccountButton, SettingsButton } from './HeaderActions';
import { playButtonTap } from '@/lib/sounds';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';
import { getReferralProgress, claimReferralReward } from '@/lib/referralSystem';
import { tLevelTitle } from '@/lib/gameI18n';
import Wordmark from '@/components/ui/Wordmark';
import { REGION_ART, DIFF_ART } from '@/lib/selectionArt';

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
  onOpenRanking?: () => void;
  onMoreModes?: () => void;
  onHowToPlay?: () => void;
}

/** Dificultades: clave de datos, emoji y nivel de desbloqueo (D12: candado visible). */
const DIFF_CONFIG: { key: Difficulty; emoji: string; art: [string, string?]; unlockLevel: number }[] = [
  { key: 'basic',  ...DIFF_ART.basic,  unlockLevel: 1 },
  { key: 'easy',   ...DIFF_ART.easy,   unlockLevel: 2 },
  { key: 'medium', ...DIFF_ART.medium, unlockLevel: 4 },
  { key: 'hard',   ...DIFF_ART.hard,   unlockLevel: 6 },
];

/** Regiones: emoji y nivel de desbloqueo. */
const MODE_UNLOCK: Record<GameMode, { level: number; emoji: string; art: [string, string?] }> = {
  world:    { level: 1, ...REGION_ART.world },
  europe:   { level: 2, ...REGION_ART.europe },
  asia:     { level: 3, ...REGION_ART.asia },
  americas: { level: 4, ...REGION_ART.americas },
  africa:   { level: 5, ...REGION_ART.africa },
};

const CLASSIC_ROUNDS = 13;
const CLASSIC_SECONDS = 15;
const SELECTION_KEY = 'geospeed_last_selection';

function loadSelection(): { mode: GameMode; difficulty: Difficulty } | null {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * Inicio v2 (maquetas GeoSpeed_Inicio_Movil_APROBADA_v2 / Inicio_Computador_v2).
 * Celular: encabezado de una línea (vidas · marca · cuenta · ajustes). Computador: el encabezado lo pone
 * la barra superior (AppNav). Banner "¿Cómo se juega?" con la demo y los 3 pasos · "Tu próxima aventura"
 * (región + dificultad en hojas) · Diario / Amigos / Mis retos / Más modos · franja de nivel con
 * estadísticas y accesos a ranking, historial e invitar amigos. Todo visible desde la primera visita (D13).
 */
/** El día del cofre se registra una vez por apertura de la app (ver efecto del cofre). */
let dayRegisteredThisSession = false;

export default function HomeScreen({ onStartGame, onMultiplayer, onTimeAttack, onDailyChallenge, onStartTraining, onMyChallenges, onOpenProfile, onOpenSettings, onOpenHistory, onOpenRanking, onMoreModes, onHowToPlay }: HomeScreenProps) {
  const { t, locale } = useI18n();
  const stats = getPlayerStats();
  const avgDist = stats.totalRounds > 0 ? Math.round(stats.totalDistance / stats.totalRounds) : 0;
  const playerLevel = getPlayerLevel();
  const isOnline = useOnlineStatus();
  const isNewPlayer = stats.gamesPlayed === 0;
  const numberLocale = locale === 'en' ? 'en-US' : 'es-CO';
  const fmt = (n: number) => n.toLocaleString(numberLocale);

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

  const [inviteSent, setInviteSent] = useState(false);

  // ── Racha / cofre ──
  const [streakReward, setStreakReward] = useState<StreakReward | null>(null);
  const [streakDismissed, setStreakDismissed] = useState(false);
  const [dailyPlayers, setDailyPlayers] = useState<number>(0);
  // El diario cambia a medianoche de Colombia para todos (Fase 2); se muestra la hora local equivalente
  const dailyRolloverTime = nextRollover().toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', { hour: '2-digit', minute: '2-digit' });
  // Racha del diario (servidor, en caché): la tarjeta dice si ya se jugó hoy
  const [dailySt, setDailySt] = useState<DailyStatus | null>(getCachedDailyStatus);
  useEffect(() => {
    const on = (e: Event) => setDailySt((e as CustomEvent<DailyStatus>).detail);
    window.addEventListener(DAILY_STATUS_EVENT, on);
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);
  const dailyStreakNow = dailySt?.current_streak ?? 0;
  const dailyDone = playedToday(dailySt);

  useEffect(() => {
    window.scrollTo(0, 0);
    getDailyPlayerCount().then(setDailyPlayers);
  }, []);

  // Cofre diario (reglas de interrupciones, 2026-10-19):
  //  · el día se registra una sola vez por apertura de la app, con la fecha LOCAL: si la sesión cruza la
  //    medianoche, el cofre del día nuevo llega la próxima vez que se abra la app, no a mitad de la sesión;
  //  · si el premio no se reclamó (p. ej. se entró por un enlace y el inicio se vio un instante), sigue
  //    pendiente y aparece en la próxima visita al inicio;
  //  · un jugador nuevo no recibe cofre su primer día (empieza con las vidas llenas);
  //  · cuenta como la única ventana de esta visita al inicio.
  useEffect(() => {
    if (!dayRegisteredThisSession) {
      dayRegisteredThisSession = true;
      checkStreak();
      if (isNewPlayer) skipTodayChest();
    }
    if (isNewPlayer || homeInterruptionShown()) return;
    const pending = getUnclaimedChestToday();
    if (pending) { markHomeInterruption(); setStreakReward(pending); }
  }, [isNewPlayer]);


  // ── Opciones de las hojas ──
  const regionOptions: SelectorOption<GameMode>[] = useMemo(() => MODE_CONFIG.map(m => {
    const lock = MODE_UNLOCK[m.key];
    const locked = playerLevel.level < lock.level;
    return {
      key: m.key,
      emoji: lock.emoji,
      art: lock.art,
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
      art: d.art,
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
    const url = `${window.location.origin}/d/${todayDailyNo()}`;
    const text = t('home_dailyShareText', { date: dateLabel });
    if (navigator.share) {
      try { await navigator.share({ title: 'GeoSpeed Daily', text, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard?.writeText(`${text}\n${url}`);
    }
  };

  // Invitar amigos (programa de referidos): mismo enlace que antes, ahora desde la franja de nivel
  const referral = getReferralProgress();
  const shareInvite = async () => {
    playButtonTap();
    const text = t('ref_shareText');
    let confirmed = false;
    if (navigator.share) {
      try { await navigator.share({ title: 'GeoSpeed', text, url: referral.link }); confirmed = true; } catch { /* cancelado */ }
    } else {
      try { await navigator.clipboard?.writeText(`${text}\n${referral.link}`); confirmed = true; } catch { /* sin permiso */ }
    }
    if (confirmed) { setInviteSent(true); setTimeout(() => setInviteSent(false), 4000); }
  };

  const steps = [
    { icon: '📘', title: t('home_step1'), desc: t('home_step1Desc') },
    { icon: '👆', title: t('home_step2'), desc: t('home_step2Desc') },
    { icon: '⭐', title: t('home_step3'), desc: t('home_step3Desc') },
  ];

  return (
    <main
      className="min-h-[calc(100dvh-var(--nav-h)-var(--sab))] md:min-h-[calc(100dvh-var(--nav-h))] flex flex-col items-center px-3 pb-2 sm:px-4 sm:pb-6 lg:px-6 lg:pb-4 overflow-y-auto game-bg pt-[max(0.75rem,var(--sat))] md:pt-4 lg:pt-3"
      aria-label={t('nav_home')}
    >
      <a
        href="#game-modes"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
      >
        {t('home_skipToContent')}
      </a>

      {/* ── Encabezado del celular: vidas · marca · cuenta · ajustes (en md+ lo pone AppNav) ── */}
      <header className="md:hidden w-full max-w-md mb-2 sm:mb-3 animate-fade-in-up grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-1.5">
          <EnergyBar stacked />
          <StreakChip />
        </div>
        <div className="flex items-center justify-center gap-1.5 min-w-0">
          <img src="/mascot/explorer-logo.webp" alt="" className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 object-contain shrink-0" />
          <span className="flex flex-col leading-none min-w-0">
            <Wordmark size="custom" className="text-[1.25rem] min-[400px]:text-2xl" />
            <span className="text-[8.5px] min-[400px]:text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{t('home_tagline')}</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <AccountButton onOpenProfile={onOpenProfile} showName={false} />
          {onOpenSettings && <SettingsButton onClick={onOpenSettings} />}
        </div>
      </header>

      {!isOnline && (
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-6xl mb-2 animate-fade-in">
          <div className="bg-primary/15 border border-primary/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <span>📡</span>
            <span className="text-primary font-bold">{t('home_offline')}</span>
            <span className="text-muted-foreground">{t('home_offlineDesc')}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:grid lg:grid-cols-[1fr_minmax(320px,0.55fr)] lg:gap-4 lg:items-stretch">
        {/* ── Banner: ¿Cómo se juega? ── */}
        <section className="rounded-3xl border-2 border-primary/70 bg-card/60 p-2.5 sm:p-4 mb-2 sm:mb-3 lg:mb-0 animate-fade-in-up animation-delay-100 shadow-[0_0_24px_hsl(var(--primary)/0.12)]" aria-label={t('home_howToPlay')}>
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl lg:text-3xl font-extrabold">
              <span aria-hidden>📖</span>
              <span>{t('home_howToPlayLead')} <span className="text-primary">{t('home_howToPlayTail')}</span></span>
            </h2>
            {onHowToPlay && (
              <button onClick={() => { playButtonTap(); onHowToPlay(); }} className="text-xs sm:text-sm font-bold text-accent hover:underline whitespace-nowrap">
                {t('home_seeTutorial')}
              </button>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden border border-border/60">
            <Suspense fallback={<div className="w-full aspect-[360/128] bg-muted/20" />}>
              <AutoDemo hideTagline />
            </Suspense>
          </div>
          {/* Pasos con número, ícono y (en computador) descripción */}
          <ol className="mt-2 sm:mt-3 flex items-center justify-between gap-1 rounded-2xl border border-border/60 bg-background/40 px-2 py-1.5 sm:py-2 sm:px-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                {i > 0 && <span className="text-muted-foreground text-xs sm:text-base shrink-0 -ml-0.5 mr-0.5" aria-hidden>›</span>}
                <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-accent text-accent text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-base sm:text-xl shrink-0" aria-hidden>{s.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] min-[400px]:text-[11px] sm:text-sm font-bold leading-tight">{s.title}</span>
                  <span className="hidden lg:block text-[11px] text-muted-foreground leading-tight mt-0.5">{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-center text-[11px] sm:text-sm font-bold mt-1.5 sm:mt-2">
            <span className="text-accent">{t('home_equationSpeed')}</span> + <span className="text-accent">{t('home_equationPrecision')}</span> = <span className="text-primary">{t('home_equationPoints')}</span>
          </p>
        </section>

        {/* ── Tu próxima aventura ── */}
        <section id="game-modes" className="rounded-3xl border border-accent/40 bg-card/70 p-3 sm:p-5 mb-2 sm:mb-3 lg:mb-0 animate-fade-in-up animation-delay-150 flex flex-col shadow-[0_0_24px_hsl(var(--accent)/0.10)]" aria-label={t('home_nextAdventure')}>
          <div className="grid grid-cols-[3.9rem_1fr] min-[400px]:grid-cols-[4.4rem_1fr] sm:grid-cols-[5.5rem_1fr] lg:grid-cols-[5rem_1fr] gap-x-2.5 sm:gap-x-3 gap-y-1.5 sm:gap-y-2 items-center">
            <div className="row-span-2 lg:row-span-1 self-center">
              <Mascot state="happy" className="w-full animate-mascot-float drop-shadow-[0_8px_18px_hsl(var(--brand-navy-deep)/0.6)]" />
            </div>
            <h2 className="text-[min(5.6vw,1.6rem)] sm:text-[1.9rem] lg:text-[min(1.85vw,1.9rem)] font-extrabold leading-tight whitespace-nowrap">
              {t('home_nextAdventureLead')} <span className="text-primary">{t('home_nextAdventureTail')}</span>
            </h2>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-3 lg:col-span-2 lg:grid-cols-1 lg:mt-3">
              <Dropdown label={t('home_region')} emoji={MODE_UNLOCK[selectedMode].emoji} value={regionLabel} onClick={() => { playButtonTap(); setSheet('region'); }} />
              <Dropdown label={t('home_difficultyLabel')} emoji={difficultyEmoji} value={difficultyName} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
            </div>
          </div>
          <p className="text-center text-[11px] sm:text-sm text-muted-foreground mt-2 mb-2 sm:mt-3 sm:mb-3">{citiesInfo}</p>
          <button
            onClick={() => { playButtonTap(); onStartGame(selectedDifficulty, selectedMode); }}
            className="btn3d lg:mt-auto w-full flex items-center justify-center gap-3 py-3 sm:py-4 rounded-2xl font-black text-lg sm:text-2xl tracking-wide text-primary-foreground animate-pulse-glow-subtle"
            style={{ background: 'var(--grad-cta)' }}
            aria-label={`${t('home_playNow')} — ${difficultyName}, ${regionLabel}`}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
            <span>{t('home_playNow')}</span>
          </button>
        </section>
      </div>

      {/* ── Tarjetas de acceso (orden de la maqueta: Diario · Amigos · Mis retos · Más modos) ── */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mt-4 animate-fade-in-up animation-delay-200">
        <AccessCard icon={<span className="text-[1.7rem] sm:text-[2.5rem]">📅</span>} title={t('home_dailyCard')} desc={dailyDone ? t('home_dailyDoneDesc', { n: dailyStreakNow }) : dailyStreakNow > 0 ? `${t('home_dailyStreakDesc', { n: dailyStreakNow })} · ${t('home_dailyRollover', { time: dailyRolloverTime })}` : `${dailyPlayers > 0 ? (dailyPlayers === 1 ? t('home_dailyPlayedOne') : t('home_dailyPlayedMany', { count: dailyPlayers })) : t('home_dailyCardDesc')} · ${t('home_dailyRollover', { time: dailyRolloverTime })}`} onClick={() => { playButtonTap(); onDailyChallenge(); }} extra={<button onClick={(e) => { e.stopPropagation(); shareDaily(); }} className="absolute top-1.5 right-2 text-xs opacity-60 hover:opacity-100" aria-label={t('share')} title={t('share')}>🔗</button>} />
        <AccessCard icon={<FriendsIcon />} title={t('home_friends')} desc={t('home_friendsDesc')} onClick={() => { playButtonTap(); onMultiplayer(); }} />
        {onMyChallenges
          ? <AccessCard icon={<span className="text-[1.7rem] sm:text-[2.5rem]">📋</span>} title={t('home_myChallenges')} desc={t('home_myChallengesDesc')} onClick={() => { playButtonTap(); onMyChallenges(); }} />
          : <AccessCard icon={<span className="text-[1.7rem] sm:text-[2.5rem]">🎯</span>} title={t('home_trainingCard')} desc={t('home_trainingCardDesc')} onClick={() => { playButtonTap(); onStartTraining(); }} />}
        <AccessCard icon={<span className="text-[1.7rem] sm:text-[2.5rem]">⚡</span>} title={t('home_moreModes')} desc={t('home_moreModesDesc')} onClick={() => { playButtonTap(); (onMoreModes ?? onTimeAttack)(); }} />
      </div>

      {/* ── Cofre diario ── */}
      {streakReward && !streakDismissed && (
        <DailyChestModal reward={streakReward} onOpen={() => claimDailyReward()} onClose={() => setStreakDismissed(true)} />
      )}

      {/* ── Franja de nivel: nivel + XP · (computador) estadísticas · ranking / historial / invitar ── */}
      <section className="w-full max-w-md md:max-w-2xl lg:max-w-6xl mb-2 sm:mb-3 animate-fade-in-up animation-delay-250 rounded-2xl border border-border bg-card/70 px-2.5 py-2 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 lg:gap-5" aria-label={t('home_level')}>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 lg:flex-[1.3]">
          <span className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-full border-2 border-foreground/30 bg-gradient-to-b from-muted/80 to-background flex items-center justify-center text-xl sm:text-2xl shadow-inner" aria-hidden>{playerLevel.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[13px] sm:text-base leading-tight lg:truncate">
              {t('home_level')} {playerLevel.level} · <span className="text-primary">{tLevelTitle(playerLevel.title, locale)}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.6)] transition-all duration-700" style={{ width: `${playerLevel.progress}%` }} />
              </div>
              <span className="hidden lg:inline text-xs text-muted-foreground whitespace-nowrap">{fmt(playerLevel.xp)} / {fmt(playerLevel.xpForNext)} {t('home_xp')}</span>
            </div>
            <p className="lg:hidden text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">{fmt(playerLevel.xp)} / {fmt(playerLevel.xpForNext)} {t('home_xp')}</p>
          </div>
        </div>
        {/* Estadísticas (solo computador, como en la maqueta) */}
        <div className="hidden lg:flex items-center gap-5 lg:gap-7 border-l border-border pl-5">
          <StripStat icon="🎮" value={fmt(stats.gamesPlayed)} label={t('home_stripGames')} />
          <StripStat icon="🏆" value={fmt(stats.bestScore)} label={t('home_stripRecord')} />
          <StripStat icon="📍" value={`${fmt(avgDist)} km`} label={t('home_stripAvgDist')} />
        </div>
        <div className="flex items-stretch shrink-0 border-l border-border divide-x divide-border font-bold">
          <StripLink icon="🏆" label={t('home_ranking')} onClick={() => { playButtonTap(); (onOpenRanking ?? onOpenProfile)?.(); }} />
          <StripLink icon="📊" label={t('home_history')} onClick={() => { playButtonTap(); (onOpenHistory ?? onOpenProfile)?.(); }} />
          <StripLink icon="🎁" label={t('home_inviteFriends')} shortLabel={t('home_inviteShort')} onClick={shareInvite} />
        </div>
      </section>

      {/* Invitar amigos en el celular (la franja no tiene espacio) y recompensa de referidos lista */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-6xl flex flex-col items-center gap-2 empty:hidden">
        {referral.claimable && (
          <button
            onClick={() => { claimReferralReward(referral.claimable!.tier); playButtonTap(); }}
            className="btn3d w-full max-w-md py-2.5 rounded-xl font-bold text-xs text-primary-foreground animate-pulse"
            style={{ background: 'var(--grad-cta)' }}
          >
            {t('ref_claim', { lives: referral.claimable.lives, bonus: referral.claimable.bonus ? ` + ${referral.claimable.bonus}` : '' })}
          </button>
        )}
        {inviteSent && (
          <p className="text-center text-[10px] sm:text-xs text-accent animate-fade-in" role="status">
            {navigator.share ? t('ref_sent') : t('ref_copied')}
          </p>
        )}
      </div>

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

const Chevron = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
);

/** Selector de la tarjeta de aventura: etiqueta encima y caja con ícono · valor · flecha (maqueta). */
function Dropdown({ label, emoji, value, onClick }: { label: string; emoji: string; value: string; onClick: () => void }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] sm:text-xs lg:text-sm font-semibold text-muted-foreground lg:text-foreground mb-0.5 sm:mb-1">{label}</span>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:py-2 sm:px-2.5 lg:px-3 lg:py-2.5 rounded-xl border border-accent/40 bg-background/50 hover:border-accent transition-colors active:scale-[0.98] text-left"
        aria-haspopup="dialog"
        aria-label={`${label}: ${value}`}
      >
        <span className="text-lg sm:text-xl lg:text-2xl shrink-0" aria-hidden>{emoji}</span>
        <span className="flex-1 min-w-0 font-bold text-[13px] min-[400px]:text-sm sm:text-base truncate">{value}</span>
        <Chevron className="rotate-90 text-foreground/80 shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}

/** Ícono de "Jugar con amigos": dos exploradores (amarillo y turquesa), como en la maqueta. */
function FriendsIcon() {
  return (
    <span className="relative block w-9 h-8 sm:w-12 sm:h-11" aria-hidden>
      <img src="/mascot/explorer-logo.webp" alt="" className="absolute left-0 bottom-0 w-6 sm:w-8 -rotate-6" />
      <img src="/mascot/explorer-logo.webp" alt="" className="absolute right-0 bottom-0 w-6 sm:w-8 rotate-6 [filter:hue-rotate(125deg)_saturate(1.3)]" />
    </span>
  );
}

function AccessCard({ icon, title, desc, onClick, extra }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; extra?: React.ReactNode }) {
  return (
    <div className="relative min-w-0">
      <button
        onClick={onClick}
        className="w-full h-full flex items-center gap-2 sm:gap-3 px-2.5 py-2 sm:p-3.5 rounded-2xl border border-border bg-card/70 hover:border-accent/50 text-left transition-all active:scale-[0.98]"
      >
        <span className="shrink-0 leading-none" aria-hidden>{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-[13px] sm:text-base leading-tight">{title}</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-1 sm:line-clamp-2">{desc}</span>
        </span>
        <Chevron className="text-muted-foreground shrink-0" />
      </button>
      {extra}
    </div>
  );
}

function StripStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="leading-tight">
        <span className="block font-bold text-sm">{value}</span>
        <span className="block text-[11px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function StripLink({ icon, label, shortLabel, onClick }: { icon: string; label: string; shortLabel?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-2 sm:px-3 hover:text-primary transition-colors whitespace-nowrap" aria-label={label}>
      <span className="text-lg lg:text-base leading-none" aria-hidden>{icon}</span>
      <span className="flex items-center gap-0.5 text-[11px] sm:text-xs lg:text-sm">
        {shortLabel ? <><span className="lg:hidden">{shortLabel}</span><span className="hidden lg:inline">{label}</span></> : label}
      </span>
    </button>
  );
}
